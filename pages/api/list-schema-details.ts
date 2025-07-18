// pages/api/list-schema-details.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import {
  SchemaDetail,
  EnumInfo,
  RoutineInfo,
  TriggerInfo,
  IndexInfo,
  ForeignKeyInfo,
} from "../../types";

const INTERNAL_SCHEMAS = new Set([
  "pg_catalog",
  "information_schema",
  "pg_toast",
  "realtime",
  "graphql_public",
  "storage",
  "supabase_migrations",
  "graphql",
  "vault",
  "extensions",
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SchemaDetail[] | { error: string }>
) {
  try {
    const url = req.headers["x-sb-url"]  as string;
    const key = req.headers["x-sb-key"]  as string;
    if (!url || !key) throw new Error("Missing Supabase URL/key");

    const supa = createClient(url, key, {
      global: { headers: { Accept: "application/json" } },
    });

    // 1) List schemas via RPC, then filter out internal ones
    const schemasRaw = await supa.rpc("pg_list_schemas");
    if (schemasRaw.error) throw schemasRaw.error;
    const allSchemas = (schemasRaw.data as any[]).map((r) => r.schema_name as string);
    const schemas = allSchemas.filter((s) => !INTERNAL_SCHEMAS.has(s));

    const out: SchemaDetail[] = [];

    for (const schema of schemas) {
      // a) Tables
      const tb = await supa.rpc("pg_list_tables", { schemaname: schema });
      if (tb.error) throw tb.error;
      const tables = (tb.data as any[]).map((r) => r.table_name as string);

      // b) Enums in this schema
      const e = await supa.rpc("pg_list_enum_types");
      if (e.error) throw e.error;
      const enums = (e.data as any[])
        .filter((r) => r.type_schema === schema)
        .map((r) => ({
          type_schema: r.type_schema,
          type_name:   r.type_name,
          labels:      r.labels as string[],
        }) as EnumInfo);

      // c) Functions in this schema
      const fn = await supa.rpc("pg_list_functions");
      if (fn.error) throw fn.error;
      const functions = (fn.data as any[])
        .filter((r) => r.function_schema === schema)
        .map((r) => ({
          function_schema: r.function_schema,
          function_name:   r.function_name,
        }) as RoutineInfo);

      // d) Triggers in this schema
      const tr = await supa.rpc("pg_list_triggers");
      if (tr.error) throw tr.error;
      const triggers = (tr.data as any[])
        .filter((r) => r.trigger_schema === schema)
        .map((r) => ({
          trigger_schema:     r.trigger_schema,
          table_name:         r.event_object_table, // or r.table_name
          trigger_name:       r.trigger_name,
        }) as TriggerInfo);

      // e) Indexes via RPC (we added pg_list_schema_indexes)
      const ix = await supa.rpc("pg_list_schema_indexes", { schemaname: schema });
      if (ix.error) throw ix.error;
      const indexes: IndexInfo[] = (ix.data as any[]).map((r) => ({
        tablename: r.tablename,
        indexname: r.indexname,
        indexdef:  r.indexdef,
      }));

      // f) Foreign keys in this schema
      const fk = await supa.rpc("pg_list_foreign_keys");
      if (fk.error) throw fk.error;
      const foreignKeys = (fk.data as any[])
        .filter((r) => r.fk_schema === schema)
        .map((r) => ({
          fk_schema:            r.fk_schema,
          fk_name:              r.fk_name,
          table_schema:         r.table_schema,
          table_name:           r.table_name,
          column_names:         r.column_names as string[],
          foreign_table_schema: r.foreign_table_schema,
          foreign_table_name:   r.foreign_table_name,
          foreign_column_names: r.foreign_column_names as string[],
        }) as ForeignKeyInfo);

      out.push({
        schema,
        tables,
        enums,
        functions,
        triggers,
        indexes,
        foreignKeys,
      });
    }

    return res.status(200).json(out);
  } catch (err: any) {
    console.error("list-schema-details error:", err);
    return res.status(500).json({ error: err.message });
  }
}