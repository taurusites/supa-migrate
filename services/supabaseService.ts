import { SchemaInfo, TableSelection } from "../types";

/**
 * Fetch schemas & tables via our Next.js API.
 */
export async function listSchemasAndTables(
  url: string,
  key: string
): Promise<SchemaInfo[]> {
  const res = await fetch("/api/list-schemas-tables", {
    headers: { "x-sb-url": url, "x-sb-key": key }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * Fetch generated SQL via our Next.js API.
 */
export async function generateMigrationSQL(
  url: string,
  key: string,
  selections: TableSelection[]
): Promise<string> {
  const res = await fetch("/api/generate-sql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sb-url": url,
      "x-sb-key": key
    },
    body: JSON.stringify({ selections })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.text();
}