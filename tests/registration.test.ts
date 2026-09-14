import { describe, expect, it } from "vitest";
import { authorRegistrationSchema } from "@/lib/validation/schemas";

const validRegistration = {
  firstName: "Maya",
  lastName: "Santos",
  email: "maya.santos@example.edu",
  affiliation: "Sultan Kudarat State University",
  country: "Philippines",
  password: "ResearchAuthor2026",
};

describe("public author registration", () => {
  it("accepts a complete author profile", () => {
    expect(authorRegistrationSchema.parse(validRegistration)).toMatchObject({
      email: validRegistration.email,
      firstName: "Maya",
      lastName: "Santos",
    });
  });

  it("rejects weak passwords and invalid ORCID iDs", () => {
    expect(() =>
      authorRegistrationSchema.parse({ ...validRegistration, password: "too-short" }),
    ).toThrow();
    expect(() =>
      authorRegistrationSchema.parse({ ...validRegistration, orcid: "0000-0000-0000-0000" }),
    ).toThrow();
  });
});
