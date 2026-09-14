import { NextRequest } from "next/server";
import { assertCsrf } from "@/lib/csrf";
import { errorResponse, json } from "@/lib/http";
import { clientKey, rateLimit } from "@/lib/auth/rate-limit";
import { RateLimitError } from "@/lib/errors";
import { registerAuthor } from "@/lib/services/users";

export async function POST(request: NextRequest) {
  try {
    assertCsrf(request);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    const limited = rateLimit(clientKey(ip, "author-registration"), 5, 60 * 60 * 1000);
    if (!limited.allowed) {
      throw new RateLimitError("Too many account attempts. Please try again later.");
    }
    return json({ user: await registerAuthor(await request.json()) }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
