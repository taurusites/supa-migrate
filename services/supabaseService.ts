import { SchemaInfo, TableSelection, FunctionSelection, TypeSelection, TriggerSelection } from "../types";

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
  selections: TableSelection[],
  functionSelections: FunctionSelection[] = [],
  typeSelections: TypeSelection[] = [],
  triggerSelections: TriggerSelection[] = []
): Promise<string> {
  const res = await fetch("/api/generate-sql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sb-url": url,
      "x-sb-key": key
    },
    body: JSON.stringify({ selections, functionSelections, typeSelections, triggerSelections })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.text();
}