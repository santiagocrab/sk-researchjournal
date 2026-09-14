import { describe, expect, it } from "vitest";
import { Role } from "@prisma/client";
import {
  canApproveArticle,
  canCreateArticle,
  canEditArticleMetadata,
  canEditAuthorProfile,
  canManagePlatform,
  canPublishArticle,
  canScheduleArticle,
  canViewAuditLogs,
  navItemsForRole,
} from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/session";

function user(role: Role, assignments: SessionUser["assignments"] = []): SessionUser {
  return {
    id: "u1",
    name: "Test",
    email: "test@example.com",
    role,
    active: true,
    assignments,
  };
}

describe("RBAC", () => {
  const journalId = "j1";

  it("allows Super Admin to manage the platform and publish", () => {
    const admin = user(Role.SUPER_ADMIN);
    expect(canManagePlatform(admin)).toBe(true);
    expect(canPublishArticle(admin, journalId)).toBe(true);
    expect(canViewAuditLogs(admin)).toBe(true);
  });

  it("allows Editor-in-Chief of an assigned journal to approve and publish", () => {
    const eic = user(Role.EDITOR_IN_CHIEF, [{ journalId, role: Role.EDITOR_IN_CHIEF, categoryId: null }]);
    expect(canApproveArticle(eic, journalId)).toBe(true);
    expect(canPublishArticle(eic, journalId)).toBe(true);
    expect(canPublishArticle(eic, "other")).toBe(false);
  });

  it("prevents Managing Editors from publishing", () => {
    const editor = user(Role.MANAGING_EDITOR, [{ journalId, role: Role.MANAGING_EDITOR, categoryId: null }]);
    expect(canCreateArticle(editor, journalId)).toBe(true);
    expect(canPublishArticle(editor, journalId)).toBe(false);
    expect(canScheduleArticle(editor, journalId)).toBe(true);
    expect(canEditArticleMetadata(editor, { journalId, categoryId: "c1", status: "DRAFT" })).toBe(true);
    expect(canEditArticleMetadata(editor, { journalId, categoryId: "c1", status: "PUBLISHED" })).toBe(false);
  });

  it("scopes Section Editors to assigned categories", () => {
    const section = user(Role.SECTION_EDITOR, [
      { journalId, role: Role.SECTION_EDITOR, categoryId: "cat-a" },
    ]);
    expect(canEditArticleMetadata(section, { journalId, categoryId: "cat-a", status: "DRAFT" })).toBe(true);
    expect(canEditArticleMetadata(section, { journalId, categoryId: "cat-b", status: "DRAFT" })).toBe(false);
    expect(canPublishArticle(section, journalId)).toBe(false);
  });

  it("denies inactive users", () => {
    const inactive = { ...user(Role.SUPER_ADMIN), active: false };
    expect(canManagePlatform(inactive)).toBe(false);
  });

  it("gives each role the duties from the editorial map", () => {
    expect(navItemsForRole(Role.SUPER_ADMIN).map((item) => item.href)).toEqual(
      expect.arrayContaining(["/admin/users", "/admin/journals", "/admin/settings"]),
    );
    expect(navItemsForRole(Role.EDITOR_IN_CHIEF).map((item) => item.label)).toEqual(
      expect.arrayContaining(["Journals", "Issues", "Articles"]),
    );
    expect(navItemsForRole(Role.MANAGING_EDITOR).map((item) => item.label)).toEqual(
      expect.arrayContaining(["Article records", "Publication schedule"]),
    );
    expect(navItemsForRole(Role.SECTION_EDITOR).some((item) => item.href === "/admin/issues")).toBe(false);
    expect(navItemsForRole(Role.AUTHOR).map((item) => item.href)).toEqual(
      expect.arrayContaining(["/admin/profile", "/admin/submissions"]),
    );
    expect(navItemsForRole(Role.REVIEWER)).toEqual([
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/reviews", label: "My reviews" },
    ]);
    expect(navItemsForRole(Role.READER)).toEqual([]);
  });

  it("lets authors edit their own profile but not other authors", () => {
    const author = user(Role.AUTHOR);
    expect(canEditAuthorProfile(author, { userId: "u1" })).toBe(true);
    expect(canEditAuthorProfile(author, { userId: "other" })).toBe(false);
  });
});
