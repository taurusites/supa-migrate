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
    if (!url || !key) throw new Error("Missing Supabase URL/key");

    const supa = createClient(url, key, { global: { headers: { Accept: "application/json" } } });

    // 1) list schemas
    const { data: scRows, error: scErr } = await supa.rpc<{ schema_name: string }[]>(
      "pg_list_schemas"
    );
    if (scErr) throw scErr;
    const schemas = scRows.map((r) => r.schema_name);

    // 2) list tables per schema
    const out: SchemaInfo[] = [];
    for (const schema of schemas) {
      const { data: tbRows, error: tbErr } = await supa.rpc<{ table_name: string }[]>(
        "pg_list_tables",
        { schemaname: schema }
      );
      if (tbErr) throw tbErr;
      out.push({ schema, tables: tbRows.map((r) => r.table_name) });
    }

    res.status(200).json(out);
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}