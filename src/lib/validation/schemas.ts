import { z } from "zod";
import { isValidDoi, isValidIssn, isValidOrcid, isValidPageRange } from "@/lib/identifiers";

export const roleSchema = z.enum([
  "SUPER_ADMIN",
  "EDITOR_IN_CHIEF",
  "MANAGING_EDITOR",
  "SECTION_EDITOR",
  "AUTHOR",
  "REVIEWER",
  "READER",
]);

export const articleStatusSchema = z.enum([
  "DRAFT",
  "SUBMITTED",
  "FOR_REVIEW",
  "REVISION_REQUIRED",
  "REVISED",
  "FOR_APPROVAL",
  "APPROVED",
  "READY_FOR_PUBLICATION",
  "SCHEDULED",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
]);

export const articleTypeSchema = z.enum([
  "RESEARCH",
  "REVIEW",
  "SHORT_COMMUNICATION",
  "EDITORIAL",
  "CASE_STUDY",
  "TECHNICAL_NOTE",
]);

export const issueStatusSchema = z.enum(["DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED"]);
export const fileTypeSchema = z.enum([
  "FINAL_PDF",
  "SUPPLEMENTARY",
  "THUMBNAIL",
  "MANUSCRIPT",
  "COVER_LETTER",
  "TITLE_PAGE",
  "ANONYMOUS_MANUSCRIPT",
]);

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export const authorRegistrationSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  middleName: z.string().trim().max(80).optional().nullable(),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  affiliation: z.string().trim().min(2).max(300),
  country: z.string().trim().min(2).max(80),
  orcid: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine((value) => !value || isValidOrcid(value), "Enter a valid ORCID iD"),
  password: z
    .string()
    .min(12, "Use at least 12 characters")
    .max(200)
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[a-z]/, "Add a lowercase letter")
    .regex(/[0-9]/, "Add a number"),
});

export const userCreateSchema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(255),
  password: z.string().min(12).max(200),
  role: roleSchema,
  active: z.boolean().optional().default(true),
  sendInvite: z.boolean().optional().default(true),
});

export const userUpdateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().min(12).max(200).optional(),
  role: roleSchema.optional(),
  active: z.boolean().optional(),
});

export const assignmentSchema = z.object({
  userId: z.string().min(1),
  journalId: z.string().min(1),
  role: roleSchema,
  categoryId: z.string().nullable().optional(),
});

export const journalSchema = z.object({
  name: z.string().min(2).max(300),
  abbreviation: z.string().min(1).max(40),
  description: z.string().min(10).max(20000),
  issnPrint: z
    .string()
    .optional()
    .nullable()
    .refine((value) => !value || isValidIssn(value), "Invalid print ISSN"),
  issnOnline: z
    .string()
    .optional()
    .nullable()
    .refine((value) => !value || isValidIssn(value), "Invalid online ISSN"),
  publisher: z.string().min(2).max(200),
  frequency: z.string().min(2).max(80),
  websiteSlug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and dashes"),
  active: z.boolean().optional().default(true),
});

export const issueSchema = z.object({
  journalId: z.string().min(1),
  volume: z.number().int().positive(),
  issueNumber: z.number().int().positive(),
  title: z.string().min(2).max(300),
  year: z.number().int().min(1900).max(2100),
  publicationDate: z.coerce.date().optional().nullable(),
  coverUrl: z.string().max(500).optional().nullable(),
  status: issueStatusSchema.optional(),
});

export const categorySchema = z.object({
  journalId: z.string().min(1),
  name: z.string().min(2).max(160),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().max(5000).optional().nullable(),
  parentId: z.string().optional().nullable(),
});

export const authorSchema = z.object({
  firstName: z.string().min(1).max(80),
  middleName: z.string().max(80).optional().nullable(),
  lastName: z.string().min(1).max(80),
  email: z.string().email(),
  affiliation: z.string().min(2).max(300),
  country: z.string().min(2).max(80),
  orcid: z
    .string()
    .optional()
    .nullable()
    .refine((value) => !value || isValidOrcid(value), "Invalid ORCID"),
  biography: z.string().max(8000).optional().nullable(),
  userId: z.string().optional().nullable(),
  affiliations: z
    .array(
      z.object({
        name: z.string().min(2).max(300),
        country: z.string().max(80).optional().nullable(),
        department: z.string().max(160).optional().nullable(),
        isPrimary: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const articleInformationSchema = z.object({
  title: z.string().min(3).max(500),
  abstract: z.string().min(20).max(20000),
  articleType: articleTypeSchema,
  categoryId: z.string().optional().nullable(),
});

export const articlePublicationSchema = z
  .object({
    journalId: z.string().min(1),
    issueId: z.string().optional().nullable(),
    firstPage: z.string().max(20).optional().nullable(),
    lastPage: z.string().max(20).optional().nullable(),
    publicationDate: z.coerce.date().optional().nullable(),
  })
  .refine((value) => isValidPageRange(value.firstPage, value.lastPage), {
    message: "Last page must be greater than or equal to first page",
    path: ["lastPage"],
  });

export const articleIdentifiersSchema = z.object({
  doi: z
    .string()
    .optional()
    .nullable()
    .refine((value) => !value || isValidDoi(value), "Invalid DOI"),
  edasPaperId: z.string().max(80).optional().nullable(),
});

export const articleAuthorLinkSchema = z.object({
  authorId: z.string().min(1).optional(),
  author: authorSchema.optional(),
  authorOrder: z.number().int().positive(),
  corresponding: z.boolean().default(false),
  affiliationText: z.string().max(400).optional().nullable(),
});

export const keywordSchema = z.object({
  keyword: z.string().min(1).max(80),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const referenceSchema = z.object({
  referenceText: z.string().min(5).max(4000),
  doi: z
    .string()
    .optional()
    .nullable()
    .refine((value) => !value || isValidDoi(value), "Invalid reference DOI"),
  url: z.string().url().optional().nullable(),
  referenceOrder: z.number().int().positive(),
});

export const announcementSchema = z.object({
  journalId: z.string().min(1),
  title: z.string().min(3).max(240),
  body: z.string().min(10).max(20000),
  publishedAt: z.coerce.date().optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  active: z.boolean().optional().default(true),
});

export const editorialBoardSchema = z.object({
  journalId: z.string().min(1),
  userId: z.string().optional().nullable(),
  name: z.string().min(2).max(200),
  title: z.string().min(2).max(200),
  affiliation: z.string().min(2).max(300),
  email: z.string().email().optional().nullable(),
  orcid: z
    .string()
    .optional()
    .nullable()
    .refine((value) => !value || isValidOrcid(value), "Invalid ORCID"),
  photoUrl: z.string().url().optional().nullable(),
  biography: z.string().max(8000).optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
  active: z.boolean().optional().default(true),
});

export const settingSchema = z.object({
  journalId: z.string().min(1),
  key: z.string().min(2).max(80),
  value: z.string().max(2000),
});

const blankToUndefined = (value: unknown) =>
  value === "" || value === null || value === undefined ? undefined : value;

const optionalSearchText = z.preprocess(blankToUndefined, z.string().max(300).optional());
const optionalSearchInt = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}, z.number().int().positive().optional());

function stringList(value: unknown): string[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.flatMap(stringList);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const searchQuerySchema = z.object({
  q: z.preprocess(blankToUndefined, z.string().max(200).optional().default("")),
  keyword: optionalSearchText,
  author: optionalSearchText,
  title: optionalSearchText,
  journal: z.preprocess(stringList, z.array(z.string().max(120)).default([])),
  year: z.preprocess(
    (value) =>
      stringList(value)
        .map(Number)
        .filter((year: number) => Number.isInteger(year) && year > 0),
    z.array(z.number().int().positive()).default([]),
  ),
  volume: optionalSearchInt,
  issue: optionalSearchInt,
  category: z.preprocess(stringList, z.array(z.string().max(120)).default([])),
  type: articleTypeSchema.optional(),
  page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).optional().default(1)),
});

export const reviewRecommendationSchema = z.enum([
  "ACCEPT",
  "MINOR_REVISION",
  "MAJOR_REVISION",
  "REJECT",
]);

export const editorialDecisionSchema = z.enum([
  "SEND_TO_REVIEW",
  "DESK_REJECT",
  "ACCEPT",
  "MINOR_REVISION",
  "MAJOR_REVISION",
  "REJECT",
]);

export const reviewReportSchema = z.object({
  recommendation: reviewRecommendationSchema,
  originality: z.string().min(10).max(8000),
  significance: z.string().min(10).max(8000),
  methodology: z.string().min(10).max(8000),
  clarity: z.string().min(10).max(8000),
  commentsToAuthor: z.string().min(20).max(20000),
  commentsToEditor: z.string().min(10).max(20000),
});

export const assignReviewerSchema = z.object({
  reviewerId: z.string().min(1),
  dueDate: z.coerce.date().optional().nullable(),
});

export const screeningSchema = z.object({
  action: z.enum(["SEND_TO_REVIEW", "DESK_REJECT"]),
  letterToAuthors: z.string().min(10).max(20000),
});

export const decisionLetterSchema = z.object({
  decision: z.enum(["ACCEPT", "MINOR_REVISION", "MAJOR_REVISION", "REJECT"]),
  letterToAuthors: z.string().min(20).max(20000),
});

export const revisionSchema = z.object({
  responseToReviewers: z.string().min(20).max(20000),
});
