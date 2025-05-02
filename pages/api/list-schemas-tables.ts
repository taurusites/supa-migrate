import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { SchemaInfo } from "../../types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SchemaInfo[] | { error: string }>
) {
  try {
    const url = req.headers["x-sb-url"] as string;
    const key = req.headers["x-sb-key"] as string;
    if (!url || !key) throw new Error("Missing Supabase URL/key headers");

    const supa = createClient(url, key, {
      global: { headers: { Accept: "application/json" } }
    });

    // 1) List schemas
    const listSchemas = await supa.rpc("pg_list_schemas");
    if (listSchemas.error) throw listSchemas.error;
    const scRows = listSchemas.data as any[] | null;
    const schemas = scRows?.map((r) => r.schema_name as string) || [];

    // 2) List tables per schema
    const out: SchemaInfo[] = [];
    for (const schema of schemas) {
      const listTables = await supa.rpc("pg_list_tables", { schemaname: schema });
      if (listTables.error) throw listTables.error;
      const tbRows = listTables.data as any[] | null;
      const tables = tbRows?.map((r) => r.table_name as string) || [];
      out.push({ schema, tables });
    }

    return res.status(200).json(out);
  } catch (e: any) {
    console.error("list-schemas-tables error", e);
    return res.status(500).json({ error: e.message });
  }
}