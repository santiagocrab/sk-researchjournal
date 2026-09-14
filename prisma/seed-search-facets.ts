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

export async function seedSearchFacetDemo(
  prisma: PrismaClient,
  ids: { managingId: string; eicId: string; authorIds: string[] },
) {
  if (await prisma.journal.findFirst({ where: { websiteSlug: "jot", deletedAt: null } })) {
    return;
  }

  const [technology, education] = await Promise.all([
    prisma.journal.create({
      data: {
        name: "Journal of Technology",
        abbreviation: "JOT",
        description: "<p>Journal of Technology publishes research in computing, engineering, and applied technology.</p>",
        issnPrint: "1759-8111",
        issnOnline: "1759-8112",
        publisher: "Sultan Kudarat State University",
        frequency: "Quarterly",
        websiteSlug: "jot",
        active: true,
      },
    }),
    prisma.journal.create({
      data: {
        name: "Journal of Education",
        abbreviation: "JOE",
        description: "<p>Journal of Education publishes research on teaching, learning, and educational technology.</p>",
        issnPrint: "1759-8221",
        issnOnline: "1759-8222",
        publisher: "Sultan Kudarat State University",
        frequency: "Quarterly",
        websiteSlug: "joe",
        active: true,
      },
    }),
  ]);

  await prisma.journalSetting.createMany({
    data: [technology.id, education.id].flatMap((journalId) =>
      Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ journalId, key, value })),
    ),
  });
  await prisma.journalUserAssignment.createMany({
    data: [technology.id, education.id].flatMap((journalId) => [
      { userId: ids.eicId, journalId, role: Role.EDITOR_IN_CHIEF },
      { userId: ids.managingId, journalId, role: Role.MANAGING_EDITOR },
    ]),
  });

  const [computing, engineering, educationCategory] = await Promise.all([
    prisma.category.create({ data: { journalId: technology.id, name: "Computing", slug: "computing" } }),
    prisma.category.create({ data: { journalId: technology.id, name: "Engineering", slug: "engineering" } }),
    prisma.category.create({ data: { journalId: education.id, name: "Education", slug: "education" } }),
  ]);

  const [tech2024, tech2025, tech2026, edu2025, edu2026] = await Promise.all([
    prisma.issue.create({
      data: {
        journalId: technology.id,
        volume: 8,
        issueNumber: 1,
        title: "Engineering systems",
        year: 2024,
        publicationDate: new Date("2024-03-01"),
        status: IssueStatus.PUBLISHED,
      },
    }),
    prisma.issue.create({
      data: {
        journalId: technology.id,
        volume: 9,
        issueNumber: 1,
        title: "Computing advances",
        year: 2025,
        publicationDate: new Date("2025-03-01"),
        status: IssueStatus.PUBLISHED,
      },
    }),
    prisma.issue.create({
      data: {
        journalId: technology.id,
        volume: 10,
        issueNumber: 1,
        title: "Intelligent systems",
        year: 2026,
        publicationDate: new Date("2026-03-01"),
        status: IssueStatus.PUBLISHED,
      },
    }),
    prisma.issue.create({
      data: {
        journalId: education.id,
        volume: 14,
        issueNumber: 2,
        title: "Learning sciences",
        year: 2025,
        publicationDate: new Date("2025-06-01"),
        status: IssueStatus.PUBLISHED,
      },
    }),
    prisma.issue.create({
      data: {
        journalId: education.id,
        volume: 15,
        issueNumber: 1,
        title: "Teaching with technology",
        year: 2026,
        publicationDate: new Date("2026-03-01"),
        status: IssueStatus.PUBLISHED,
      },
    }),
  ]);

  const papers = [
    {
      journalId: technology.id,
      issueId: tech2026.id,
      categoryId: computing.id,
      title: "Artificial intelligence for reliable computing systems",
      slug: "artificial-intelligence-reliable-computing-systems",
      doi: "10.5555/jot.2026.001",
      year: 2026,
    },
    {
      journalId: technology.id,
      issueId: tech2025.id,
      categoryId: computing.id,
      title: "Adaptive tutoring with artificial intelligence",
      slug: "adaptive-tutoring-artificial-intelligence",
      doi: "10.5555/jot.2025.001",
      year: 2025,
    },
    {
      journalId: technology.id,
      issueId: tech2024.id,
      categoryId: engineering.id,
      title: "Engineering design with artificial intelligence",
      slug: "engineering-design-artificial-intelligence",
      doi: "10.5555/jot.2024.001",
      year: 2024,
    },
    {
      journalId: education.id,
      issueId: edu2026.id,
      categoryId: educationCategory.id,
      title: "Teaching with artificial intelligence",
      slug: "teaching-with-artificial-intelligence",
      doi: "10.5555/joe.2026.001",
      year: 2026,
    },
    {
      journalId: education.id,
      issueId: edu2025.id,
      categoryId: educationCategory.id,
      title: "Artificial intelligence in classroom assessment",
      slug: "artificial-intelligence-classroom-assessment",
      doi: "10.5555/joe.2025.001",
      year: 2025,
    },
  ];

  const authorA = ids.authorIds[0];
  const authorB = ids.authorIds[1] ?? ids.authorIds[0];

  for (const paper of papers) {
    const publishedAt = new Date(`${paper.year}-03-15`);
    const article = await prisma.article.create({
      data: {
        title: paper.title,
        slug: paper.slug,
        abstract: `<p>This study examines artificial intelligence methods and their implications for research and practice.</p>`,
        articleType: ArticleType.RESEARCH,
        categoryId: paper.categoryId,
        doi: paper.doi,
        journalId: paper.journalId,
        issueId: paper.issueId,
        firstPage: "1",
        lastPage: "16",
        publicationDate: publishedAt,
        status: ArticleStatus.PUBLISHED,
        createdById: ids.managingId,
        approvedById: ids.eicId,
        approvedAt: publishedAt,
        publishedAt,
      },
    });
    await prisma.articleAuthor.createMany({
      data: [
        { articleId: article.id, authorId: authorA, authorOrder: 1, corresponding: true },
        ...(authorB !== authorA
          ? [{ articleId: article.id, authorId: authorB, authorOrder: 2, corresponding: false }]
          : []),
      ],
    });
    await prisma.keyword.createMany({
      data: ["artificial intelligence", "machine learning", "education technology"].map((keyword, index) => ({
        articleId: article.id,
        keyword,
        sortOrder: index + 1,
      })),
    });
    const pdfKey = `journals/${paper.journalId}/articles/${article.id}/final_pdf/seed.pdf`;
    const pdfUrl = await store(pdfKey, SAMPLE_PDF);
    await prisma.articleFile.create({
      data: {
        articleId: article.id,
        fileType: FileType.FINAL_PDF,
        originalName: `${paper.slug}.pdf`,
        storageKey: pdfKey,
        publicUrl: pdfUrl,
        mimeType: "application/pdf",
        fileSize: SAMPLE_PDF.length,
        uploadedById: ids.managingId,
      },
    });
    await prisma.article.update({ where: { id: article.id }, data: { pdfUrl } });
    await prisma.articleMetric.create({
      data: { articleId: article.id, metricType: MetricType.PAGE_VIEW, value: 8 },
    });
  }
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const managing = await prisma.user.findFirst({ where: { email: "managing@sksu.edu.ph" } });
    const eic = await prisma.user.findFirst({ where: { email: "eic@sksu.edu.ph" } });
    const authors = await prisma.author.findMany({ orderBy: { createdAt: "asc" }, take: 2 });
    if (!managing || !eic || !authors.length) {
      throw new Error("Seed the main catalog first, then run this demo facet seed.");
    }
    await seedSearchFacetDemo(prisma, {
      managingId: managing.id,
      eicId: eic.id,
      authorIds: authors.map((author) => author.id),
    });
    console.log("Search facet demo journals are ready.");
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.includes("seed-search-facets")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
