import {
  ArticleStatus,
  ArticleType,
  FileType,
  IssueStatus,
  MetricType,
  PrismaClient,
  Role,
} from "@prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/settings";
import { storeSeedFile } from "./seed-storage";

const SAMPLE_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);

async function store(key: string, body: Buffer) {
  return storeSeedFile(key, body, "application/pdf");
}

const SLUG = "artificial-intelligence-integration-in-higher-education";
const AFFILIATION = "Sultan Kudarat State University";

export async function seedComputingTechnologyArticle(
  prisma: PrismaClient,
  ids: { managingId: string; eicId: string },
) {
  await prisma.author.updateMany({
    where: { lastName: "Remegio" },
    data: { affiliation: AFFILIATION, country: "Philippines" },
  });

  let florlyn = await prisma.author.findFirst({ where: { firstName: "Florlyn Mae", lastName: "Remegio" } });
  let alex = await prisma.author.findFirst({ where: { firstName: "Alex", lastName: "Remegio" } });
  if (!florlyn) {
    florlyn = await prisma.author.create({
      data: {
        firstName: "Florlyn Mae",
        middleName: "C.",
        lastName: "Remegio",
        email: "florlyn.remegio@example.edu",
        affiliation: AFFILIATION,
        country: "Philippines",
        orcid: "0000-0003-1415-9269",
        biography: "<p>Researcher in artificial intelligence and education.</p>",
      },
    });
  } else if (!florlyn.orcid) {
    florlyn = await prisma.author.update({
      where: { id: florlyn.id },
      data: { orcid: "0000-0003-1415-9269" },
    });
  }
  if (!alex) {
    alex = await prisma.author.create({
      data: {
        firstName: "Alex",
        middleName: "N.",
        lastName: "Remegio",
        email: "alex.remegio@example.edu",
        affiliation: AFFILIATION,
        country: "Philippines",
        orcid: "0000-0001-2345-6789",
        biography: "<p>Works on scholarly publishing systems and educational technology.</p>",
      },
    });
  } else if (!alex.orcid) {
    alex = await prisma.author.update({
      where: { id: alex.id },
      data: { orcid: "0000-0001-2345-6789" },
    });
  }

  let journal = await prisma.journal.findFirst({ where: { websiteSlug: "jct", deletedAt: null } });
  if (!journal) {
    journal = await prisma.journal.create({
      data: {
        name: "Journal of Computing and Technology",
        abbreviation: "JCT",
        description:
          "<p>Journal of Computing and Technology publishes research in computing, education technology, and applied systems.</p>",
        issnPrint: "2049-8111",
        issnOnline: "2049-8112",
        publisher: "Sultan Kudarat State University",
        frequency: "Biannual",
        websiteSlug: "jct",
        active: true,
      },
    });
    await prisma.journalSetting.createMany({
      data: Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ journalId: journal!.id, key, value })),
    });
    await prisma.journalUserAssignment.createMany({
      data: [
        { userId: ids.eicId, journalId: journal.id, role: Role.EDITOR_IN_CHIEF },
        { userId: ids.managingId, journalId: journal.id, role: Role.MANAGING_EDITOR },
      ],
    });
  }

  const category =
    (await prisma.category.findFirst({
      where: { journalId: journal.id, slug: "education", deletedAt: null },
    })) ??
    (await prisma.category.create({
      data: { journalId: journal.id, name: "Education", slug: "education" },
    }));

  const issue =
    (await prisma.issue.findFirst({
      where: { journalId: journal.id, volume: 1, issueNumber: 2, year: 2026, deletedAt: null },
    })) ??
    (await prisma.issue.create({
      data: {
        journalId: journal.id,
        volume: 1,
        issueNumber: 2,
        title: "Computing and Education",
        year: 2026,
        publicationDate: new Date("2026-06-15"),
        status: IssueStatus.PUBLISHED,
      },
    }));

  const existing = await prisma.article.findFirst({
    where: { journalId: journal.id, slug: SLUG, deletedAt: null },
  });
  if (existing) return;

  const received = new Date("2026-01-12T00:00:00.000Z");
  const accepted = new Date("2026-03-18T00:00:00.000Z");
  const published = new Date("2026-06-15T00:00:00.000Z");
  const article = await prisma.article.create({
    data: {
      title: "Artificial Intelligence Integration in Higher Education",
      slug: SLUG,
      abstract:
        "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>",
      articleType: ArticleType.RESEARCH,
      categoryId: category.id,
      doi: "10.5555/jct.2026.001",
      journalId: journal.id,
      issueId: issue.id,
      firstPage: "1",
      lastPage: "18",
      publicationDate: published,
      status: ArticleStatus.PUBLISHED,
      createdById: ids.managingId,
      approvedById: ids.eicId,
      approvedAt: accepted,
      publishedAt: published,
      createdAt: received,
    },
  });

  await prisma.articleAuthor.createMany({
    data: [
      {
        articleId: article.id,
        authorId: florlyn.id,
        authorOrder: 1,
        corresponding: true,
        affiliationText: AFFILIATION,
      },
      {
        articleId: article.id,
        authorId: alex.id,
        authorOrder: 2,
        corresponding: false,
        affiliationText: AFFILIATION,
      },
    ],
  });
  await prisma.keyword.createMany({
    data: ["Artificial Intelligence", "Education", "Technology"].map((keyword, index) => ({
      articleId: article.id,
      keyword,
      sortOrder: index + 1,
    })),
  });
  await prisma.reference.createMany({
    data: [
      {
        articleId: article.id,
        referenceText:
          "Russell S, Norvig P. Artificial Intelligence: A Modern Approach. 4th ed. Pearson; 2020.",
        referenceOrder: 1,
      },
      {
        articleId: article.id,
        referenceText:
          "Holmes W, Bialik M, Fadel C. Artificial Intelligence in Education. Center for Curriculum Redesign; 2019.",
        referenceOrder: 2,
      },
      {
        articleId: article.id,
        referenceText:
          "Zawacki-Richter O, Marin VI, Bond M, Gouverneur F. Systematic review of research on artificial intelligence applications in higher education. Int J Educ Technol High Educ. 2019;16(1):39.",
        doi: "10.1186/s41239-019-0171-0",
        referenceOrder: 3,
      },
    ],
  });

  const pdfKey = `journals/${journal.id}/articles/${article.id}/final_pdf/seed.pdf`;
  const pdfUrl = await store(pdfKey, SAMPLE_PDF);
  await prisma.articleFile.create({
    data: {
      articleId: article.id,
      fileType: FileType.FINAL_PDF,
      originalName: `${SLUG}.pdf`,
      storageKey: pdfKey,
      publicUrl: pdfUrl,
      mimeType: "application/pdf",
      fileSize: SAMPLE_PDF.length,
      uploadedById: ids.managingId,
    },
  });
  await prisma.article.update({ where: { id: article.id }, data: { pdfUrl } });
  await prisma.articleMetric.createMany({
    data: [
      { articleId: article.id, metricType: MetricType.PAGE_VIEW, value: 1280 },
      { articleId: article.id, metricType: MetricType.PDF_DOWNLOAD, value: 831 },
    ],
  });
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const managing = await prisma.user.findFirst({ where: { email: "managing@sksu.edu.ph" } });
    const eic = await prisma.user.findFirst({ where: { email: "eic@sksu.edu.ph" } });
    if (!managing || !eic) throw new Error("Seed the main catalog first.");
    await seedComputingTechnologyArticle(prisma, { managingId: managing.id, eicId: eic.id });
    console.log("Journal of Computing and Technology article is ready.");
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes("seed-jct-article")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
