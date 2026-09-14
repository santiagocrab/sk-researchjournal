import { AuditAction, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { hashPassword, assertPasswordPolicy } from "@/lib/auth/password";
import { userCreateSchema, userUpdateSchema } from "@/lib/validation/schemas";
import { authorRegistrationSchema } from "@/lib/validation/schemas";
import type { SessionUser } from "@/lib/auth/session";
import { sendAccountInvite } from "@/lib/email/notify";
import { sanitizePlainText } from "@/lib/sanitize";

export async function registerAuthor(raw: unknown) {
  const input = authorRegistrationSchema.parse(raw);
  assertPasswordPolicy(input.password);
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    throw new ConflictError("An account already exists for this email. Sign in instead.");

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: sanitizePlainText(`${input.firstName} ${input.lastName}`),
        email,
        passwordHash: await hashPassword(input.password),
        role: Role.AUTHOR,
        active: true,
      },
    });
    await tx.author.create({
      data: {
        userId: created.id,
        firstName: sanitizePlainText(input.firstName),
        middleName: input.middleName ? sanitizePlainText(input.middleName) : null,
        lastName: sanitizePlainText(input.lastName),
        email,
        affiliation: sanitizePlainText(input.affiliation),
        country: sanitizePlainText(input.country),
        orcid: input.orcid || null,
        affiliations: {
          create: {
            name: sanitizePlainText(input.affiliation),
            country: sanitizePlainText(input.country),
            isPrimary: true,
          },
        },
      },
    });
    return created;
  });

  await writeAuditLog({
    userId: user.id,
    action: AuditAction.CREATE,
    entityType: "AuthorRegistration",
    entityId: user.id,
    metadata: { selfRegistered: true },
  });
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function listUsers() {
  return prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      assignments: { include: { journal: { select: { id: true, name: true } }, category: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createUser(
  raw: unknown,
  actor: SessionUser,
  requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const input = userCreateSchema.parse(raw);
  assertPasswordPolicy(input.password);
  const exists = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (exists) throw new ConflictError("Email already in use");
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      role: input.role,
      active: input.active,
    },
  });
  const invite =
    input.sendInvite !== false
      ? await sendAccountInvite({
          name: user.name,
          email: user.email,
          password: input.password,
          role: user.role,
        })
      : null;
  await writeAuditLog({
    userId: actor.id,
    action: AuditAction.CREATE,
    entityType: "User",
    entityId: user.id,
    metadata: { role: user.role, inviteSent: Boolean(invite), inviteId: invite?.id },
    ...requestMeta,
  });
  const { passwordHash, ...safe } = user;
  void passwordHash;
  return { ...safe, inviteSent: Boolean(invite), inviteId: invite?.id ?? null };
}

export async function updateUser(
  id: string,
  raw: unknown,
  actor: SessionUser,
  requestMeta?: { ipAddress?: string | null; userAgent?: string | null },
) {
  const existing = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!existing) throw new NotFoundError("User not found");
  const input = userUpdateSchema.parse(raw);
  if (input.password) assertPasswordPolicy(input.password);
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name } : {}),
      ...(input.email ? { email: input.email.toLowerCase() } : {}),
      ...(input.role ? { role: input.role } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
    },
  });
  await writeAuditLog({
    userId: actor.id,
    action:
      input.role && input.role !== existing.role ? AuditAction.ROLE_CHANGE : AuditAction.UPDATE,
    entityType: "User",
    entityId: id,
    metadata: { from: existing.role, to: user.role, active: user.active },
    ...requestMeta,
  });
  const { passwordHash, ...safe } = user;
  void passwordHash;
  return safe;
}

export async function assignUserToJournal(params: {
  userId: string;
  journalId: string;
  role: Role;
  categoryId?: string | null;
  actor: SessionUser;
  requestMeta?: { ipAddress?: string | null; userAgent?: string | null };
}) {
  const assignment = await prisma.journalUserAssignment.create({
    data: {
      userId: params.userId,
      journalId: params.journalId,
      role: params.role,
      categoryId: params.categoryId ?? null,
    },
  });
  await writeAuditLog({
    userId: params.actor.id,
    action: AuditAction.ROLE_CHANGE,
    entityType: "JournalUserAssignment",
    entityId: assignment.id,
    metadata: params,
    ...params.requestMeta,
  });
  return assignment;
}
