import { Role } from "@prisma/client";
import { ForbiddenError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";

export const PUBLISHING_ROLES: Role[] = [Role.SUPER_ADMIN, Role.EDITOR_IN_CHIEF];
export const EDITORIAL_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.EDITOR_IN_CHIEF,
  Role.MANAGING_EDITOR,
  Role.SECTION_EDITOR,
];

export type ArticleAccessContext = {
  journalId: string;
  categoryId?: string | null;
  status?: string;
  createdById?: string;
};

export function isSuperAdmin(user: SessionUser) {
  return user.role === Role.SUPER_ADMIN;
}

export function assignmentsForJournal(user: SessionUser, journalId: string) {
  return user.assignments.filter((assignment) => assignment.journalId === journalId);
}

export function hasJournalRole(user: SessionUser, journalId: string, roles: Role[]) {
  if (!user.active) return false;
  if (isSuperAdmin(user) && roles.includes(Role.SUPER_ADMIN)) return true;
  return assignmentsForJournal(user, journalId).some((assignment) => roles.includes(assignment.role));
}

export function canManagePlatform(user: SessionUser) {
  return user.active && isSuperAdmin(user);
}

export function canViewAuditLogs(user: SessionUser, journalId?: string) {
  if (!user.active) return false;
  if (isSuperAdmin(user)) return true;
  if (!journalId) return false;
  return hasJournalRole(user, journalId, [Role.EDITOR_IN_CHIEF]);
}

export function canManageJournal(user: SessionUser, journalId: string) {
  return hasJournalRole(user, journalId, [Role.SUPER_ADMIN, Role.EDITOR_IN_CHIEF]);
}

export function canManageEditorialBoard(user: SessionUser, journalId: string) {
  return canManageJournal(user, journalId);
}

export function canManageIssues(user: SessionUser, journalId: string) {
  return hasJournalRole(user, journalId, [
    Role.SUPER_ADMIN,
    Role.EDITOR_IN_CHIEF,
    Role.MANAGING_EDITOR,
  ]);
}

export function canApproveIssue(user: SessionUser, journalId: string) {
  return hasJournalRole(user, journalId, [Role.SUPER_ADMIN, Role.EDITOR_IN_CHIEF]);
}

export function canCreateArticle(user: SessionUser, journalId: string) {
  if (!user.active) return false;
  if (isSuperAdmin(user)) return true;
  if (user.role === Role.AUTHOR) return true;
  return hasJournalRole(user, journalId, EDITORIAL_ROLES);
}

export function canEditArticleMetadata(
  user: SessionUser,
  article: ArticleAccessContext,
  options?: { allowPublishedCorrection?: boolean },
) {
  if (!user.active) return false;
  if (isSuperAdmin(user)) return true;
  const published = article.status === "PUBLISHED";
  if (published && !options?.allowPublishedCorrection) {
    return hasJournalRole(user, article.journalId, [Role.EDITOR_IN_CHIEF]);
  }
  if (
    user.role === Role.AUTHOR &&
    article.createdById === user.id &&
    ["DRAFT", "REVISION_REQUIRED", "REVISED"].includes(article.status ?? "DRAFT")
  ) {
    return true;
  }
  if (hasJournalRole(user, article.journalId, [Role.EDITOR_IN_CHIEF, Role.MANAGING_EDITOR])) {
    return true;
  }
  if (!hasJournalRole(user, article.journalId, [Role.SECTION_EDITOR])) return false;
  const categoryIds = assignmentsForJournal(user, article.journalId)
    .filter((assignment) => assignment.role === Role.SECTION_EDITOR)
    .map((assignment) => assignment.categoryId)
    .filter((id): id is string => Boolean(id));
  if (!article.categoryId) return false;
  return categoryIds.includes(article.categoryId);
}

export function canScreenManuscript(user: SessionUser, journalId: string) {
  return hasJournalRole(user, journalId, [
    Role.SUPER_ADMIN,
    Role.EDITOR_IN_CHIEF,
    Role.MANAGING_EDITOR,
    Role.SECTION_EDITOR,
  ]);
}

export function canAssignReviewers(user: SessionUser, journalId: string) {
  return canScreenManuscript(user, journalId);
}

export function canMakeEditorialDecision(user: SessionUser, journalId: string) {
  return hasJournalRole(user, journalId, [Role.SUPER_ADMIN, Role.EDITOR_IN_CHIEF]);
}

export function isAssignedReviewer(user: SessionUser, reviewerId: string) {
  return user.active && user.id === reviewerId;
}

export function canSubmitForApproval(user: SessionUser, article: ArticleAccessContext) {
  return canEditArticleMetadata(user, article);
}

export function canApproveArticle(user: SessionUser, journalId: string) {
  return hasJournalRole(user, journalId, PUBLISHING_ROLES);
}

export function canPublishArticle(user: SessionUser, journalId: string) {
  return hasJournalRole(user, journalId, PUBLISHING_ROLES);
}

export function canScheduleArticle(user: SessionUser, journalId: string) {
  return canManageIssues(user, journalId) || canPublishArticle(user, journalId);
}

export function canManageUsers(user: SessionUser) {
  return canManagePlatform(user);
}

export function canManageAuthors(user: SessionUser, journalId?: string) {
  if (canManagePlatform(user)) return true;
  if (!journalId) return user.active && EDITORIAL_ROLES.includes(user.role);
  return hasJournalRole(user, journalId, EDITORIAL_ROLES);
}

export function canEditAuthorProfile(
  user: SessionUser,
  author: { userId?: string | null },
) {
  if (!user.active) return false;
  if (canManageAuthors(user)) return true;
  return Boolean(author.userId && author.userId === user.id);
}

export function canAccessAdmin(user: SessionUser) {
  return user.active && user.role !== Role.READER;
}

export function assignedJournalIds(user: SessionUser) {
  return [...new Set(user.assignments.map((assignment) => assignment.journalId))];
}

export function articleListFilter(user: SessionUser): {
  createdById?: string;
  journalId?: { in: string[] };
  categoryId?: { in: string[] };
  reviewAssignments?: { some: { reviewerId: string } };
} {
  if (isSuperAdmin(user)) return {};
  if (user.role === Role.AUTHOR) return { createdById: user.id };
  if (user.role === Role.REVIEWER) {
    return { reviewAssignments: { some: { reviewerId: user.id } } };
  }
  const journalIds = assignedJournalIds(user);
  if (!journalIds.length) return { journalId: { in: ["__none__"] } };
  if (user.role === Role.SECTION_EDITOR) {
    const categoryIds = user.assignments
      .filter((assignment) => assignment.role === Role.SECTION_EDITOR && assignment.categoryId)
      .map((assignment) => assignment.categoryId as string);
    return { journalId: { in: journalIds }, categoryId: { in: categoryIds.length ? categoryIds : ["__none__"] } };
  }
  return { journalId: { in: journalIds } };
}

export function canAccessIssuesAdmin(user: SessionUser) {
  if (canManagePlatform(user)) return true;
  return assignedJournalIds(user).some((journalId) => canManageIssues(user, journalId));
}

export function assertPermission(allowed: boolean, message?: string) {
  if (!allowed) throw new ForbiddenError(message);
}

export const ROLE_DUTIES: Record<Role, string[]> = {
  SUPER_ADMIN: ["Manages the entire platform", "System configuration", "Users", "Journals"],
  EDITOR_IN_CHIEF: ["Manages the journal", "Approves issues", "Accepts articles", "Publishes scheduled articles"],
  MANAGING_EDITOR: ["Manages article records", "Metadata", "Schedules accepted articles", "Uploads final files"],
  SECTION_EDITOR: ["Manages articles under the assigned discipline"],
  AUTHOR: ["Author profile", "ORCID", "Published articles"],
  REVIEWER: ["Reviews are handled through EDAS"],
  READER: ["Search", "View articles", "Download PDF"],
};

export function navItemsForRole(role: Role) {
  if (role === Role.READER) return [];
  const dashboard = { href: "/admin", label: "Dashboard" };
  if (role === Role.SUPER_ADMIN) {
    return [
      dashboard,
      { href: "/admin/users", label: "Users" },
      { href: "/admin/journals", label: "Journals" },
      { href: "/admin/settings", label: "System configuration" },
      { href: "/admin/articles", label: "Articles" },
      { href: "/admin/issues", label: "Issues" },
      { href: "/admin/review", label: "Peer review" },
      { href: "/admin/authors", label: "Authors" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/announcements", label: "Announcements" },
      { href: "/admin/editorial-board", label: "Editorial board" },
      { href: "/admin/audit-logs", label: "Audit logs" },
    ];
  }
  if (role === Role.EDITOR_IN_CHIEF) {
    return [
      dashboard,
      { href: "/admin/journals", label: "Journals" },
      { href: "/admin/settings", label: "Journal settings" },
      { href: "/admin/articles", label: "Articles" },
      { href: "/admin/issues", label: "Issues" },
      { href: "/admin/review", label: "Peer review" },
      { href: "/admin/authors", label: "Authors" },
      { href: "/admin/categories", label: "Categories" },
      { href: "/admin/announcements", label: "Announcements" },
      { href: "/admin/editorial-board", label: "Editorial board" },
    ];
  }
  if (role === Role.MANAGING_EDITOR) {
    return [
      dashboard,
      { href: "/admin/articles", label: "Article records" },
      { href: "/admin/issues", label: "Publication schedule" },
      { href: "/admin/review", label: "Peer review" },
      { href: "/admin/authors", label: "Authors" },
    ];
  }
  if (role === Role.SECTION_EDITOR) {
    return [
      dashboard,
      { href: "/admin/articles", label: "Section articles" },
      { href: "/admin/review", label: "Peer review" },
    ];
  }
  if (role === Role.AUTHOR) {
    return [
      dashboard,
      { href: "/admin/profile", label: "Author profile" },
      { href: "/admin/submissions", label: "My submissions" },
    ];
  }
  return [dashboard, { href: "/admin/reviews", label: "My reviews" }];
}
