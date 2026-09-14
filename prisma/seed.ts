import {
  ArticleStatus,
  ArticleType,
  FileType,
  IssueStatus,
  MetricType,
  PrismaClient,
  Role,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_SETTINGS } from "../src/lib/settings";
import { SKRJET_DESCRIPTION_HTML, SKRJET_FOUNDING_BOARD } from "../src/lib/content/skrjet";
import { seedSearchFacetDemo } from "./seed-search-facets";
import { seedComputingTechnologyArticle } from "./seed-jct-article";
import { storeSeedFile } from "./seed-storage";

/** Neon’s default URI often includes channel_binding=require, which breaks many Node clients. */
function normalizeDatabaseUrl(url: string | undefined) {
  if (!url) return url;
  return url
    .replace(/([?&])channel_binding=require&?/g, "$1")
    .replace(/[?&]$/, "")
    .replace(/\?&/, "?");
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;

if (!process.env.DATABASE_URL?.trim()) {
  console.error("DATABASE_URL is missing. Example:");
  console.error(
    '  DATABASE_URL="postgresql://USER:PASS@HOST/neondb?sslmode=require" npx prisma db seed',
  );
  process.exit(1);
}

const prisma = new PrismaClient();
const DEV_PASSWORD = "DevPassword123!";

const SAMPLE_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);

const SAMPLE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function store(key: string, body: Buffer, mimeType?: string) {
  return storeSeedFile(key, body, mimeType);
}

async function main() {
  await prisma.reviewReport.deleteMany();
  await prisma.authorRevision.deleteMany();
  await prisma.editorialDecision.deleteMany();
  await prisma.reviewAssignment.deleteMany();
  await prisma.reviewRound.deleteMany();
  await prisma.metricSession.deleteMany();
  await prisma.articleMetric.deleteMany();
  await prisma.articleFile.deleteMany();
  await prisma.reference.deleteMany();
  await prisma.keyword.deleteMany();
  await prisma.articleAuthor.deleteMany();
  await prisma.article.deleteMany();
  await prisma.authorAffiliation.deleteMany();
  await prisma.author.deleteMany();
  await prisma.editorialBoardMember.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.journalUserAssignment.deleteMany();
  await prisma.journalSetting.deleteMany();
  await prisma.category.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.journal.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);
  const [superAdmin, eic, managing, section, reviewer, authorUser] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Alex Remegio, PhD",
        email: "superadmin@sksu.edu.ph",
        passwordHash,
        role: Role.SUPER_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: "Mildred F. Accad, PhD",
        email: "eic@sksu.edu.ph",
        passwordHash,
        role: Role.EDITOR_IN_CHIEF,
      },
    }),
    prisma.user.create({
      data: {
        name: "Cyril John A. Domingo, PhD",
        email: "managing@sksu.edu.ph",
        passwordHash,
        role: Role.MANAGING_EDITOR,
      },
    }),
    prisma.user.create({
      data: { name: "Sofia Rahman", email: "section@sksu.edu.ph", passwordHash, role: Role.SECTION_EDITOR },
    }),
    prisma.user.create({
      data: { name: "Priya Nair", email: "reviewer@sksu.edu.ph", passwordHash, role: Role.REVIEWER },
    }),
    prisma.user.create({
      data: { name: "Amina Okoye", email: "author@sksu.edu.ph", passwordHash, role: Role.AUTHOR },
    }),
  ]);

  const journal = await prisma.journal.create({
    data: {
      name: "Sultan Kudarat Research Journal of Education and Technology",
      abbreviation: "SKRJET",
      description: SKRJET_DESCRIPTION_HTML,
      issnPrint: "2049-3630",
      issnOnline: "2049-3649",
      publisher: "Sultan Kudarat State University",
      frequency: "Bi-annual (June and December)",
      websiteSlug: "skrjet",
      active: true,
    },
  });

  await prisma.journalSetting.createMany({
    data: Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ journalId: journal.id, key, value })),
  });

  const [education, technology] = await Promise.all([
    prisma.category.create({
      data: { journalId: journal.id, name: "Education", slug: "education" },
    }),
    prisma.category.create({
      data: { journalId: journal.id, name: "Technology", slug: "technology" },
    }),
  ]);

  await prisma.journalUserAssignment.createMany({
    data: [
      { userId: eic.id, journalId: journal.id, role: Role.EDITOR_IN_CHIEF },
      { userId: managing.id, journalId: journal.id, role: Role.MANAGING_EDITOR },
      { userId: section.id, journalId: journal.id, role: Role.SECTION_EDITOR, categoryId: education.id },
      { userId: reviewer.id, journalId: journal.id, role: Role.REVIEWER },
    ],
  });

  const [issue1, issue2] = await Promise.all([
    prisma.issue.create({
      data: {
        journalId: journal.id,
        volume: 12,
        issueNumber: 1,
        title: "Advances in Applied Computing",
        year: 2026,
        publicationDate: new Date("2026-03-01"),
        coverUrl: "/covers/skrjet-12-1.svg",
        status: IssueStatus.PUBLISHED,
      },
    }),
    prisma.issue.create({
      data: {
        journalId: journal.id,
        volume: 12,
        issueNumber: 2,
        title: "Systems and Software",
        year: 2026,
        publicationDate: new Date("2026-06-01"),
        coverUrl: "/covers/skrjet-12-2.svg",
        status: IssueStatus.PUBLISHED,
      },
    }),
  ]);

  const authors = await Promise.all([
    prisma.author.create({
      data: {
        firstName: "Amina",
        lastName: "Okoye",
        email: "amina.okoye@example.edu",
        affiliation: "University of Lagos",
        country: "Nigeria",
        orcid: "0000-0002-1825-0097",
        biography: "<p>Researcher in information systems.</p>",
        userId: authorUser.id,
        affiliations: { create: [{ name: "University of Lagos", country: "Nigeria", isPrimary: true }] },
      },
    }),
    prisma.author.create({
      data: {
        firstName: "Daniel",
        middleName: "R.",
        lastName: "Voss",
        email: "daniel.voss@example.edu",
        affiliation: "TU Delft",
        country: "Netherlands",
        orcid: "0000-0001-5109-3700",
        biography: "<p>Software architecture scholar.</p>",
      },
    }),
    prisma.author.create({
      data: {
        firstName: "Mei",
        lastName: "Lin",
        email: "mei.lin@example.edu",
        affiliation: "National University of Singapore",
        country: "Singapore",
        biography: "<p>Works on scholarly metadata and digital libraries.</p>",
      },
    }),
    prisma.author.create({
      data: {
        firstName: "Florlyn Mae",
        middleName: "C.",
        lastName: "Remegio",
        email: "florlyn.remegio@example.edu",
        affiliation: "Sultan Kudarat State University",
        country: "Philippines",
        biography: "<p>Researcher in artificial intelligence and education.</p>",
      },
    }),
    prisma.author.create({
      data: {
        firstName: "Alex",
        middleName: "N.",
        lastName: "Remegio",
        email: "alex.remegio@example.edu",
        affiliation: "Sultan Kudarat State University",
        country: "Philippines",
        biography: "<p>Works on scholarly publishing systems and educational technology.</p>",
      },
    }),
  ]);

  async function createPublishedArticle(input: {
    title: string;
    slug: string;
    issueId: string;
    categoryId: string;
    doi: string;
    pages: [string, string];
    edasPaperId: string;
    authorIndexes: number[];
  }) {
    const article = await prisma.article.create({
      data: {
        title: input.title,
        slug: input.slug,
        abstract:
          "<p>This article presents a complete research contribution suitable for demonstration of the publishing platform, including metadata, authors, and references.</p>",
        articleType: ArticleType.RESEARCH,
        categoryId: input.categoryId,
        doi: input.doi,
        journalId: journal.id,
        issueId: input.issueId,
        firstPage: input.pages[0],
        lastPage: input.pages[1],
        publicationDate: new Date("2026-03-15"),
        status: ArticleStatus.PUBLISHED,
        edasPaperId: input.edasPaperId,
        createdById: managing.id,
        approvedById: eic.id,
        approvedAt: new Date("2026-03-10"),
        publishedAt: new Date("2026-03-15"),
      },
    });

    await prisma.articleAuthor.createMany({
      data: input.authorIndexes.map((authorIndex, order) => ({
        articleId: article.id,
        authorId: authors[authorIndex].id,
        authorOrder: order + 1,
        corresponding: order === 0,
        affiliationText: authors[authorIndex].affiliation,
      })),
    });
    await prisma.keyword.createMany({
      data: ["publishing systems", "metadata", "scholarly communication"].map((keyword, index) => ({
        articleId: article.id,
        keyword,
        sortOrder: index + 1,
      })),
    });
    await prisma.reference.createMany({
      data: [
        {
          articleId: article.id,
          referenceText: "Smith J. Scholarly publishing architectures. J Digit Lib. 2024;12(1):1-18.",
          doi: "10.1000/xyz123",
          referenceOrder: 1,
        },
        {
          articleId: article.id,
          referenceText: "Lee A. Editorial workflows for hybrid journals. Learned Publishing. 2023.",
          url: "https://example.org/lee-editorial",
          referenceOrder: 2,
        },
      ],
    });

    const pdfKey = `journals/${journal.id}/articles/${article.id}/final_pdf/seed.pdf`;
    const thumbKey = `journals/${journal.id}/articles/${article.id}/thumbnail/seed.png`;
    const suppKey = `journals/${journal.id}/articles/${article.id}/supplementary/dataset.txt`;
    const pdfUrl = await store(pdfKey, SAMPLE_PDF, "application/pdf");
    const thumbUrl = await store(thumbKey, SAMPLE_PNG, "image/png");
    const suppBody = Buffer.from(`Supplementary dataset for ${input.title}\nrows=12\n`);
    const suppUrl = await store(suppKey, suppBody, "text/plain");
    await prisma.articleFile.createMany({
      data: [
        {
          articleId: article.id,
          fileType: FileType.FINAL_PDF,
          originalName: `${input.slug}.pdf`,
          storageKey: pdfKey,
          publicUrl: pdfUrl,
          mimeType: "application/pdf",
          fileSize: SAMPLE_PDF.length,
          uploadedById: managing.id,
        },
        {
          articleId: article.id,
          fileType: FileType.THUMBNAIL,
          originalName: `${input.slug}.png`,
          storageKey: thumbKey,
          publicUrl: thumbUrl,
          mimeType: "image/png",
          fileSize: SAMPLE_PNG.length,
          uploadedById: managing.id,
        },
        {
          articleId: article.id,
          fileType: FileType.SUPPLEMENTARY,
          originalName: `${input.slug}-dataset.txt`,
          storageKey: suppKey,
          publicUrl: suppUrl,
          mimeType: "text/plain",
          fileSize: suppBody.length,
          uploadedById: managing.id,
        },
      ],
    });
    await prisma.article.update({
      where: { id: article.id },
      data: { pdfUrl, thumbnailUrl: thumbUrl },
    });
    await prisma.articleMetric.createMany({
      data: [
        { articleId: article.id, metricType: MetricType.PAGE_VIEW, value: 12 },
        { articleId: article.id, metricType: MetricType.PDF_DOWNLOAD, value: 4 },
      ],
    });
    return article;
  }

  await createPublishedArticle({
    title: "A reproducible workflow for multi-journal scholarly publishing",
    slug: "reproducible-workflow-multi-journal-publishing",
    issueId: issue1.id,
    categoryId: education.id,
    doi: "10.5555/skrjet.2026.001",
    pages: ["1", "18"],
    edasPaperId: "EDAS-1001",
    authorIndexes: [0, 1],
  });
  await createPublishedArticle({
    title: "Editorial metadata and Google Scholar citation tagging",
    slug: "editorial-metadata-google-scholar",
    issueId: issue1.id,
    categoryId: technology.id,
    doi: "10.5555/skrjet.2026.002",
    pages: ["19", "33"],
    edasPaperId: "EDAS-1002",
    authorIndexes: [1, 2],
  });
  await createPublishedArticle({
    title: "Section-aware access control in academic publishing systems",
    slug: "section-aware-access-control",
    issueId: issue2.id,
    categoryId: education.id,
    doi: "10.5555/skrjet.2026.003",
    pages: ["1", "15"],
    edasPaperId: "EDAS-1003",
    authorIndexes: [2, 0],
  });
  await createPublishedArticle({
    title: "AI Integration in Education",
    slug: "ai-integration-in-education",
    issueId: issue1.id,
    categoryId: technology.id,
    doi: "10.5555/skrjet.2026.004",
    pages: ["34", "48"],
    edasPaperId: "EDAS-1004",
    authorIndexes: [3, 4],
  });

  const underReview = await prisma.article.create({
    data: {
      title: "Evaluating single-blind review quality in computing journals",
      slug: "evaluating-single-blind-review-quality",
      abstract:
        "<p>This submitted manuscript is used to demonstrate initial screening, reviewer assignment, and editorial decision under a single-blind policy.</p>",
      articleType: ArticleType.RESEARCH,
      categoryId: education.id,
      journalId: journal.id,
      status: ArticleStatus.FOR_REVIEW,
      createdById: authorUser.id,
      edasPaperId: "EDAS-2001",
    },
  });
  await prisma.articleAuthor.create({
    data: {
      articleId: underReview.id,
      authorId: authors[0].id,
      authorOrder: 1,
      corresponding: true,
      affiliationText: authors[0].affiliation,
    },
  });
  const round = await prisma.reviewRound.create({
    data: { articleId: underReview.id, roundNumber: 1 },
  });
  await prisma.editorialDecision.create({
    data: {
      articleId: underReview.id,
      roundId: round.id,
      decidedById: managing.id,
      decision: "SEND_TO_REVIEW",
      letterToAuthors:
        "<p>The manuscript is within scope and has been sent for single-blind peer review.</p>",
    },
  });
  await prisma.reviewAssignment.create({
    data: {
      articleId: underReview.id,
      roundId: round.id,
      reviewerId: reviewer.id,
      assignedById: eic.id,
      status: "INVITED",
    },
  });

  await prisma.announcement.create({
    data: {
      journalId: journal.id,
      title: "Call for papers: Systems special issue",
      body: "<p>Submissions are screened and then evaluated by single-blind peer review. Accepted papers proceed to production in JACR.</p>",
      createdById: eic.id,
      publishedAt: new Date(),
      active: true,
    },
  });

  await prisma.editorialBoardMember.createMany({
    data: SKRJET_FOUNDING_BOARD.map((member) => ({
      journalId: journal.id,
      userId:
        member.title === "Editor-in-Chief"
          ? eic.id
          : member.title === "Managing Editor"
            ? managing.id
            : member.title === "Super Admin"
              ? superAdmin.id
              : null,
      name: member.name,
      title: member.title,
      affiliation: member.affiliation,
      email: member.email ?? null,
      biography: member.biography ?? null,
      sortOrder: member.sortOrder,
    })),
  });

  await seedSearchFacetDemo(prisma, {
    managingId: managing.id,
    eicId: eic.id,
    authorIds: authors.map((author) => author.id),
  });

  await seedComputingTechnologyArticle(prisma, {
    managingId: managing.id,
    eicId: eic.id,
  });

  console.log("Seed complete.");
  console.log("Development logins (do not use in production):");
  console.log(`  superadmin@sksu.edu.ph / ${DEV_PASSWORD}`);
  console.log(`  eic@sksu.edu.ph / ${DEV_PASSWORD}`);
  console.log(`  managing@sksu.edu.ph / ${DEV_PASSWORD}`);
  console.log(`  section@sksu.edu.ph / ${DEV_PASSWORD}`);
  console.log(`  reviewer@sksu.edu.ph / ${DEV_PASSWORD}`);
  console.log(`  author@sksu.edu.ph / ${DEV_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("\nSeed failed.");
    console.error(error);
    if (error instanceof Error && /P1001|Can't reach database/i.test(error.message)) {
      console.error("\nTip: use Neon’s connection string with sslmode=require (no channel_binding).");
      console.error("Prefer the pooled host (*-pooler.*) or the direct host from Neon → Connect.");
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
