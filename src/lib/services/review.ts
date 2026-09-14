import {
  ArticleStatus,
  AuditAction,
  EditorialDecisionType,
  Prisma,
  ReviewAssignmentStatus,
  ReviewRecommendation,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { AppError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { sanitizePlainText, sanitizeRichText } from "@/lib/sanitize";
import type { SessionUser } from "@/lib/auth/session";
import {
  articleListFilter,
  canAssignReviewers,
  canEditArticleMetadata,
  canMakeEditorialDecision,
  canScreenManuscript,
  isSuperAdmin,
} from "@/lib/auth/rbac";
import { getArticleById } from "@/lib/services/articles";
import { transitionArticle } from "@/lib/services/articles";
import {
  assignReviewerSchema,
  decisionLetterSchema,
  reviewReportSchema,
  revisionSchema,
  screeningSchema,
} from "@/lib/validation/schemas";
import { lookupEdasPaper, recordEdasDecision, recordEdasReview, recordEdasSubmission } from "@/lib/edas/sync";
import { sendReviewAssignmentNotice } from "@/lib/email/notify";

const reviewInclude = {
  reviewRounds: {
    orderBy: { roundNumber: "asc" as const },
    include: {
      assignments: {
        include: {
          reviewer: { select: { id: true, name: true, email: true, role: true } },
          report: true,
        },
      },
      decisions: { orderBy: { createdAt: "asc" as const } },
      revisions: { orderBy: { submittedAt: "asc" as const } },
    },
  },
  editorialDecisions: {
    orderBy: { createdAt: "asc" as const },
    include: { decidedBy: { select: { id: true, name: true, role: true } } },
  },
  authors: { include: { author: true }, orderBy: { authorOrder: "asc" as const } },
  files: { orderBy: { createdAt: "desc" as const } },
  journal: true,
} satisfies Prisma.ArticleInclude;

export function anonymizeReviewerLabel(index: number) {
  return `Reviewer ${index + 1}`;
}

export function redactReviewPacket(
  packet: Awaited<ReturnType<typeof loadReviewPacket>>,
  viewer: SessionUser,
) {
  const editorial =
    isSuperAdmin(viewer) ||
    canScreenManuscript(viewer, packet.journalId) ||
    canMakeEditorialDecision(viewer, packet.journalId);
  const isAuthor = packet.createdById === viewer.id;
  const reviewerAssignmentIds = packet.reviewRounds.flatMap((round) =>
    round.assignments.filter((assignment) => assignment.reviewerId === viewer.id).map((a) => a.id),
  );
  const { reviewRounds, ...rest } = packet;

  return {
    ...rest,
    reviewMode: "SINGLE_BLIND" as const,
    rounds: reviewRounds.map((round) => ({
      ...round,
      assignments: round.assignments.map((assignment, index) => {
        const isOwn = assignment.reviewerId === viewer.id;
        const showIdentity = editorial || isOwn;
        return {
          id: assignment.id,
          status: assignment.status,
          dueDate: assignment.dueDate,
          completedAt: assignment.completedAt,
          label: showIdentity ? assignment.reviewer.name : anonymizeReviewerLabel(index),
          reviewer: showIdentity
            ? assignment.reviewer
            : { id: null, name: anonymizeReviewerLabel(index), email: null, role: "REVIEWER" },
          report: assignment.report
            ? {
                recommendation: assignment.report.recommendation,
                originality: editorial || isOwn ? assignment.report.originality : assignment.report.originality,
                significance: assignment.report.significance,
                methodology: assignment.report.methodology,
                clarity: assignment.report.clarity,
                commentsToAuthor: assignment.report.commentsToAuthor,
                commentsToEditor: editorial || isOwn ? assignment.report.commentsToEditor : null,
                submittedAt: assignment.report.submittedAt,
              }
            : null,
        };
      }),
      revisions: round.revisions,
    })),
    authors: editorial || reviewerAssignmentIds.length > 0 || isAuthor ? packet.authors : [],
    viewerRole: editorial ? "editorial" : isAuthor ? "author" : reviewerAssignmentIds.length ? "reviewer" : "other",
  };
}

async function loadReviewPacket(articleId: string) {
  const article = await prisma.article.findFirst({
    where: { id: articleId, deletedAt: null },
    include: reviewInclude,
  });
  if (!article) throw new NotFoundError("Article not found");
  return article;
}

export async function getReviewPacket(articleId: string, viewer: SessionUser) {
  const packet = await loadReviewPacket(articleId);
  const assigned = packet.reviewRounds.some((round) =>
    round.assignments.some((assignment) => assignment.reviewerId === viewer.id),
  );
  const allowed =
    isSuperAdmin(viewer) ||
    canScreenManuscript(viewer, packet.journalId) ||
    packet.createdById === viewer.id ||
    assigned;
  if (!allowed) throw new ForbiddenError("You cannot view this review record");
  const redacted = redactReviewPacket(packet, viewer);
  return {
    ...redacted,
    edas: await lookupEdasPaper(packet.edasPaperId),
  };
}

export async function submitForScreening(
  articleId: string,
  actor: SessionUser,
  requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const article = await getArticleById(articleId);
  if (!canEditArticleMetadata(actor, article)) {
    throw new ForbiddenError("You cannot submit this manuscript");
  }
  if (!article.title?.trim() || article.title === "Untitled article") {
    throw new AppError("A complete title is required before screening");
  }
  if (!article.abstract || article.abstract.length < 20) {
    throw new AppError("An abstract is required before screening");
  }
  if (article.authors.length < 1) {
    throw new AppError("At least one author is required before screening");
  }
  const updated = await transitionArticle(articleId, ArticleStatus.SUBMITTED, actor, requestMeta);
  await writeAuditLog({
    userId: actor.id,
    action: AuditAction.SCREEN,
    entityType: "Article",
    entityId: articleId,
    metadata: { step: "submitted_for_screening" },
    ...requestMeta,
  });
  await recordEdasSubmission(updated);
  return updated;
}

async function currentOrCreateRound(articleId: string) {
  const latest = await prisma.reviewRound.findFirst({
    where: { articleId, completedAt: null },
    orderBy: { roundNumber: "desc" },
  });
  if (latest) return latest;
  const count = await prisma.reviewRound.count({ where: { articleId } });
  return prisma.reviewRound.create({
    data: { articleId, roundNumber: count + 1 },
  });
}

export async function screenManuscript(
  articleId: string,
  raw: unknown,
  actor: SessionUser,
  requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const article = await getArticleById(articleId);
  if (!canScreenManuscript(actor, article.journalId)) {
    throw new ForbiddenError("Only editors may complete initial screening");
  }
  if (article.status !== ArticleStatus.SUBMITTED && article.status !== ArticleStatus.REVISED) {
    throw new AppError("This manuscript is not awaiting screening");
  }
  const input = screeningSchema.parse(raw);
  const round = await currentOrCreateRound(articleId);
  await prisma.editorialDecision.create({
    data: {
      articleId,
      roundId: round.id,
      decidedById: actor.id,
      decision:
        input.action === "SEND_TO_REVIEW"
          ? EditorialDecisionType.SEND_TO_REVIEW
          : EditorialDecisionType.DESK_REJECT,
      letterToAuthors: sanitizeRichText(input.letterToAuthors),
    },
  });
  const next =
    input.action === "SEND_TO_REVIEW" ? ArticleStatus.FOR_REVIEW : ArticleStatus.REJECTED;
  const updated = await transitionArticle(articleId, next, actor, requestMeta);
  await writeAuditLog({
    userId: actor.id,
    action: input.action === "DESK_REJECT" ? AuditAction.REJECT : AuditAction.SCREEN,
    entityType: "Article",
    entityId: articleId,
    metadata: { action: input.action },
    ...requestMeta,
  });
  return updated;
}

export async function assignReviewer(
  articleId: string,
  raw: unknown,
  actor: SessionUser,
  requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const article = await getArticleById(articleId);
  if (!canAssignReviewers(actor, article.journalId)) {
    throw new ForbiddenError("Only the Editor-in-Chief or Associate Editor may assign reviewers");
  }
  if (article.status !== ArticleStatus.FOR_REVIEW) {
    throw new AppError("Reviewers can be assigned only after the manuscript enters peer review");
  }
  const input = assignReviewerSchema.parse(raw);
  if (input.reviewerId === actor.id && !isSuperAdmin(actor)) {
    throw new AppError("Editors should not assign themselves as anonymous reviewers");
  }
  const reviewer = await prisma.user.findFirst({
    where: { id: input.reviewerId, deletedAt: null, active: true },
  });
  if (!reviewer) throw new NotFoundError("Reviewer not found");
  const authorEmails = article.authors.map((link) => link.author.email.toLowerCase());
  if (authorEmails.includes(reviewer.email.toLowerCase()) || article.createdById === reviewer.id) {
    throw new AppError("A manuscript author cannot be assigned as a reviewer");
  }
  const round = await currentOrCreateRound(articleId);
  try {
    const assignment = await prisma.reviewAssignment.create({
      data: {
        articleId,
        roundId: round.id,
        reviewerId: reviewer.id,
        assignedById: actor.id,
        dueDate: input.dueDate ?? null,
        status: ReviewAssignmentStatus.INVITED,
      },
    });
    await writeAuditLog({
      userId: actor.id,
      action: AuditAction.ASSIGN_REVIEWER,
      entityType: "ReviewAssignment",
      entityId: assignment.id,
      metadata: { articleId, reviewerId: reviewer.id },
      ...requestMeta,
    });
    const notice = await sendReviewAssignmentNotice({
      reviewerName: reviewer.name,
      reviewerEmail: reviewer.email,
      articleTitle: article.title,
      journalName: article.journal.name,
      assignmentId: assignment.id,
      dueDate: assignment.dueDate,
    });
    return { ...assignment, inviteSent: Boolean(notice), inviteId: notice?.id ?? null };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError("This reviewer is already assigned to the current round");
    }
    throw error;
  }
}

export async function respondToInvitation(
  assignmentId: string,
  accept: boolean,
  actor: SessionUser,
) {
  const assignment = await prisma.reviewAssignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new NotFoundError("Review assignment not found");
  if (assignment.reviewerId !== actor.id) throw new ForbiddenError();
  if (assignment.status !== ReviewAssignmentStatus.INVITED) {
    throw new AppError("This invitation has already been answered");
  }
  return prisma.reviewAssignment.update({
    where: { id: assignmentId },
    data: {
      status: accept ? ReviewAssignmentStatus.ACCEPTED : ReviewAssignmentStatus.DECLINED,
      conflictDeclared: accept,
    },
  });
}

export async function submitReviewReport(
  assignmentId: string,
  raw: unknown,
  actor: SessionUser,
  requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const assignment = await prisma.reviewAssignment.findUnique({
    where: { id: assignmentId },
    include: { report: true, article: true },
  });
  if (!assignment) throw new NotFoundError("Review assignment not found");
  if (assignment.reviewerId !== actor.id) {
    throw new ForbiddenError("Only the assigned reviewer may submit this report");
  }
  if (assignment.status !== ReviewAssignmentStatus.ACCEPTED) {
    throw new AppError("Accept the review invitation before submitting a report");
  }
  if (assignment.report) throw new AppError("A report has already been submitted");
  const input = reviewReportSchema.parse(raw);
  const report = await prisma.$transaction(async (tx) => {
    const created = await tx.reviewReport.create({
      data: {
        assignmentId,
        articleId: assignment.articleId,
        roundId: assignment.roundId,
        reviewerId: actor.id,
        recommendation: input.recommendation as ReviewRecommendation,
        originality: sanitizePlainText(input.originality),
        significance: sanitizePlainText(input.significance),
        methodology: sanitizePlainText(input.methodology),
        clarity: sanitizePlainText(input.clarity),
        commentsToAuthor: sanitizeRichText(input.commentsToAuthor),
        commentsToEditor: sanitizeRichText(input.commentsToEditor),
      },
    });
    await tx.reviewAssignment.update({
      where: { id: assignmentId },
      data: { status: ReviewAssignmentStatus.COMPLETED, completedAt: new Date() },
    });
    return created;
  });
  await writeAuditLog({
    userId: actor.id,
    action: AuditAction.SUBMIT_REVIEW,
    entityType: "ReviewReport",
    entityId: report.id,
    metadata: { articleId: assignment.articleId, recommendation: input.recommendation },
    ...requestMeta,
  });
  await recordEdasReview(assignment.article, input.recommendation);
  return report;
}

export async function recordEditorialDecision(
  articleId: string,
  raw: unknown,
  actor: SessionUser,
  requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const article = await getArticleById(articleId);
  if (!canMakeEditorialDecision(actor, article.journalId)) {
    throw new ForbiddenError("Only the Editor-in-Chief may issue the editorial decision");
  }
  if (article.status !== ArticleStatus.FOR_REVIEW && article.status !== ArticleStatus.REVISED) {
    throw new AppError("An editorial decision can be recorded only during or after review");
  }
  const input = decisionLetterSchema.parse(raw);
  const round = await prisma.reviewRound.findFirst({
    where: { articleId },
    orderBy: { roundNumber: "desc" },
  });
  await prisma.editorialDecision.create({
    data: {
      articleId,
      roundId: round?.id,
      decidedById: actor.id,
      decision: input.decision as EditorialDecisionType,
      letterToAuthors: sanitizeRichText(input.letterToAuthors),
    },
  });
  if (round) {
    await prisma.reviewRound.update({ where: { id: round.id }, data: { completedAt: new Date() } });
  }
  const next =
    input.decision === "ACCEPT"
      ? ArticleStatus.READY_FOR_PUBLICATION
      : input.decision === "REJECT"
        ? ArticleStatus.REJECTED
        : ArticleStatus.REVISION_REQUIRED;
  const updated = await transitionArticle(articleId, next, actor, requestMeta);
  await writeAuditLog({
    userId: actor.id,
    action: input.decision === "REJECT" ? AuditAction.REJECT : AuditAction.EDITORIAL_DECISION,
    entityType: "Article",
    entityId: articleId,
    metadata: { decision: input.decision },
    ...requestMeta,
  });
  await recordEdasDecision(updated, input.decision);
  return updated;
}

export async function submitAuthorRevision(
  articleId: string,
  raw: unknown,
  actor: SessionUser,
  requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const article = await getArticleById(articleId);
  const canRevise =
    article.createdById === actor.id || canEditArticleMetadata(actor, article);
  if (!canRevise) throw new ForbiddenError("You cannot revise this manuscript");
  if (article.status !== ArticleStatus.REVISION_REQUIRED) {
    throw new AppError("This manuscript is not awaiting revision");
  }
  const input = revisionSchema.parse(raw);
  const round = await prisma.reviewRound.findFirst({
    where: { articleId },
    orderBy: { roundNumber: "desc" },
  });
  if (!round) throw new AppError("No review round is available for this revision");
  await prisma.authorRevision.create({
    data: {
      articleId,
      roundId: round.id,
      responseToReviewers: sanitizeRichText(input.responseToReviewers),
      submittedById: actor.id,
    },
  });
  const updated = await transitionArticle(articleId, ArticleStatus.REVISED, actor, requestMeta);
  await writeAuditLog({
    userId: actor.id,
    action: AuditAction.SUBMIT_REVISION,
    entityType: "Article",
    entityId: articleId,
    ...requestMeta,
  });
  return updated;
}

export async function listEditorialQueue(user: SessionUser, journalId?: string) {
  const scope = articleListFilter(user);
  return prisma.article.findMany({
    where: {
      deletedAt: null,
      ...(journalId ? { journalId } : {}),
      ...scope,
      status: { in: ["SUBMITTED", "FOR_REVIEW", "REVISION_REQUIRED", "REVISED"] },
    },
    include: {
      journal: true,
      authors: { include: { author: true }, orderBy: { authorOrder: "asc" } },
      reviewAssignments: { select: { id: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listMyReviewAssignments(userId: string) {
  return prisma.reviewAssignment.findMany({
    where: { reviewerId: userId },
    include: {
      article: {
        include: {
          journal: true,
          authors: { include: { author: true }, orderBy: { authorOrder: "asc" } },
        },
      },
      report: true,
    },
    orderBy: { invitedAt: "desc" },
  });
}

export async function listMySubmissions(userId: string) {
  return prisma.article.findMany({
    where: { createdById: userId, deletedAt: null },
    include: { journal: true, editorialDecisions: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listPotentialReviewers(journalId: string) {
  return prisma.user.findMany({
    where: {
      deletedAt: null,
      active: true,
      OR: [
        { role: "REVIEWER" },
        { assignments: { some: { journalId, role: "REVIEWER" } } },
      ],
    },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}
