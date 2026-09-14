import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

/**
 * Persist seed binaries to local disk or Supabase Storage, depending on env.
 * On Vercel, STORAGE_DRIVER=supabase so PDFs are reachable after deploy.
 */
export async function storeSeedFile(key: string, body: Buffer, mimeType = "application/octet-stream") {
  const driver = process.env.STORAGE_DRIVER?.trim() || "local";
  if (driver === "supabase") {
    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "journal-files";
    if (!supabaseUrl || !serviceKey) {
      throw new Error("STORAGE_DRIVER=supabase requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    }
    const client = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.storage.from(bucket).upload(key, body, {
      contentType: mimeType,
      upsert: true,
      cacheControl: "3600",
    });
    if (error) throw new Error(`Supabase upload failed for ${key}: ${error.message}`);
    const encoded = key
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");
    return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${encoded}`;
  }

  const full = path.resolve(process.cwd(), ".storage", key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, body);
  return `/api/files/${key.split("/").map(encodeURIComponent).join("/")}`;
}
