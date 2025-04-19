import { TableSelection } from "../types";

// generate SQL (client‑side calling API)
export async function generateMigrationSQL(selection: TableSelection[]) {
  const sql = await fetch("/api/generate-sql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selections: selection })
  }).then(async (r) => {
    if (!r.ok) throw new Error(await r.text());
    return r.text();
  });
  return sql;
}