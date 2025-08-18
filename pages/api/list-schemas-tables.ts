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

    // 1) List schemas (filter out built-in schemas)
    const listSchemas = await supa.rpc("pg_list_schemas");
    if (listSchemas.error) throw listSchemas.error;
    const scRows = listSchemas.data as any[] | null;
    const allSchemas = scRows?.map((r) => r.schema_name as string) || [];
    
    // Filter out built-in schemas that users typically don't want to migrate
    const builtInSchemas = [
      'auth', 'extensions', 'graphql', 'graphql_public', 'net', 'pgsodium', 
      'pgsodium_masks', 'realtime', 'storage', 'supabase_functions', 
      'supabase_migrations', 'vault'
    ];
    const schemas = allSchemas.filter(schema => !builtInSchemas.includes(schema));
    
    console.log('All schemas found:', allSchemas);
    console.log('Filtered schemas:', schemas);

    // 2) List tables, functions, and types per schema
    const out: SchemaInfo[] = [];
    for (const schema of schemas) {
      // Get tables
      const listTables = await supa.rpc("pg_list_tables", { schemaname: schema });
      if (listTables.error) throw listTables.error;
      const tbRows = listTables.data as any[] | null;
      const tables = tbRows?.map((r) => r.table_name as string) || [];

      // Get functions
      const listFunctions = await supa.rpc("pg_list_functions", { schemaname: schema });
      if (listFunctions.error) throw listFunctions.error;
      const fnRows = listFunctions.data as any[] | null;
      const functions = fnRows?.map((r) => r.function_name as string) || [];

      // Get user-defined types
      const listTypes = await supa.rpc("pg_list_user_types", { schemaname: schema });
      if (listTypes.error) throw listTypes.error;
      const typeRows = listTypes.data as any[] | null;
      const types = typeRows?.map((r) => r.type_name as string) || [];

      // Get triggers
      const listTriggers = await supa.rpc("pg_list_triggers", { schemaname: schema });
      if (listTriggers.error) throw listTriggers.error;
      const triggerRows = listTriggers.data as any[] | null;
      const triggers = triggerRows?.map((r) => ({ 
        trigger_name: r.trigger_name as string, 
        table_name: r.table_name as string 
      })) || [];

      out.push({ schema, tables, functions, types, triggers });
    }

    return res.status(200).json(out);
  } catch (e: any) {
    console.error("list-schemas-tables error", e);
    return res.status(500).json({ error: e.message });
  }
}