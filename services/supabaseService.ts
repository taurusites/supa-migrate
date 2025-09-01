import { SchemaInfo, TableSelection, FunctionSelection, TypeSelection, TriggerSelection } from "../types";

// fetch schemas + all object lists
export async function listSchemaDetails(
  url: string,
  key: string,
  showBuiltIn: boolean = false
): Promise<SchemaInfo[]> {
  const res = await fetch("/api/list-schemas-tables", {
    headers: { 
      "x-sb-url": url, 
      "x-sb-key": key,
      "x-show-builtin": showBuiltIn.toString()
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Post selections to generate SQL
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
      "x-sb-key": key,
    },
    body: JSON.stringify({ selections, functionSelections, typeSelections, triggerSelections })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.text();
}