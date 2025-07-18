// services/supabaseService.ts
import { SchemaDetail, Selection } from "../types";

// fetch schemas + all object lists
export async function listSchemaDetails(
  url: string,
  key: string
): Promise<SchemaDetail[]> {
  const res = await fetch("/api/list-schema-details", {
    headers: { "x-sb-url": url, "x-sb-key": key },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Post selections to generate SQL
export async function generateMigrationSQL(
  url: string,
  key: string,
  selections: Selection[]
): Promise<string> {
  const res = await fetch("/api/generate-sql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sb-url": url,
      "x-sb-key": key,
    },
    body: JSON.stringify({ selections }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.text();
}