// services/sql-generator/tables-generator.ts

import { GeneratorContext } from "./types";

/**
 * Generate SQL for explicitly selected tables
 */
export const generateSelectedTables = async (context: GeneratorContext): Promise<string> => {
  const { rpc, picked } = context;
  let sql = "";

  if (picked.length) {
    sql += "-- TABLE DEFINITIONS\n";
    for (const { schema, table } of picked) {
      const r = await rpc.rpc("pg_get_tabledef", {
        schemaname: schema,
        tablename: table
      });
      if (r.error) throw r.error;
      const tableDef = r.data as Array<{ ddl: string }> | null;
      if (tableDef && tableDef.length > 0) {
        sql += `-- Drop and recreate table ${schema}.${table}\n`;
        sql += `DROP TABLE IF EXISTS ${schema}.${table} CASCADE;\n`;
        sql += `${tableDef[0].ddl};\n\n`;
      }
    }
  }

  return sql;
};

/**
 * Generate SQL for auto-detected dependency tables
 */
export const generateDependencyTables = async (context: GeneratorContext): Promise<string> => {
  const { rpc, picked, pickedFunctions, pickedTypes, pickedTriggers } = context;
  let sql = "";

  // Get all tables from schemas that have selected content (tables, functions, types, triggers, policies)
  const allRelevantSchemas = new Set<string>();

  // Add schemas from all selected content
  picked.forEach(({ schema }) => allRelevantSchemas.add(schema));
  pickedFunctions.forEach(({ schema }) => allRelevantSchemas.add(schema));
  pickedTypes.forEach(({ schema }) => allRelevantSchemas.add(schema));
  pickedTriggers.forEach(({ schema }) => allRelevantSchemas.add(schema));
  if (context.pickedPolicies) {
    context.pickedPolicies.forEach(({ schema }) => allRelevantSchemas.add(schema));
  }

  const allSchemaTables = new Set<string>();

  // Add explicitly selected tables
  picked.forEach(({ schema, table }) => {
    allSchemaTables.add(`${schema}.${table}`);
  });

  // Get ALL tables from ALL relevant schemas
  for (const schema of allRelevantSchemas) {
    try {
      const r = await rpc.rpc("pg_list_tables", { schemaname: schema });
      if (r.error) throw r.error;
      const tables = r.data as Array<{ table_name: string }> | null;

      if (tables) {
        tables.forEach(({ table_name }) => {
          const tableRef = `${schema}.${table_name}`;
          allSchemaTables.add(tableRef);
        });
      }
    } catch (err) {
      console.warn(`Could not list tables for schema ${schema}:`, err);
    }
  }

  // Create additional tables (not explicitly selected)
  const additionalTables = Array.from(allSchemaTables).filter(tableRef => {
    const [schema, table] = tableRef.split('.');
    return !picked.some(p => p.schema === schema && p.table === table);
  });

  if (additionalTables.length > 0) {
    sql += "-- ADDITIONAL TABLES FROM RELEVANT SCHEMAS (Auto-detected for dependencies)\n";

    for (const tableRef of additionalTables) {
      const [schema, table] = tableRef.split('.');
      try {
        const r = await rpc.rpc("pg_get_tabledef", {
          schemaname: schema,
          tablename: table
        });
        if (r.error) throw r.error;
        const tableDef = r.data as Array<{ ddl: string }> | null;
        if (tableDef && tableDef.length > 0) {
          sql += `-- Drop and recreate table ${schema}.${table} (auto-detected)\n`;
          sql += `DROP TABLE IF EXISTS ${schema}.${table} CASCADE;\n`;
          sql += `${tableDef[0].ddl};\n\n`;
        }
      } catch (err) {
        sql += `-- Error retrieving definition for table ${schema}.${table}: ${err}\n`;
      }
    }
  }

  return sql;
};

/**
 * Generate placeholder auth tables if needed
 */
export const generateAuthTables = (context: GeneratorContext, allRelevantSchemas: Set<string>): string => {
  const { pickedFunctions } = context;
  let sql = "";

  // Check if we need to create placeholder auth tables for function compatibility
  const needsAuthTables = pickedFunctions.some(({ function: funcName }) =>
    !['get_user_internal_id', 'get_or_create_user', 'set_user_context_by_clerk_id',
      'handle_new_user', 'handle_new_user_setup'].includes(funcName)
  );

  if (needsAuthTables && allRelevantSchemas.has('public')) {
    sql += "-- PLACEHOLDER AUTH TABLES (for function compatibility)\n";
    sql += "-- WARNING: These are minimal placeholders. You may need to customize them.\n";
    sql += `-- Placeholder for public.users (if referenced by functions)\n`;
    sql += `CREATE TABLE IF NOT EXISTS public.users (\n`;
    sql += `  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
    sql += `  clerk_user_id text UNIQUE,\n`;
    sql += `  email text,\n`;
    sql += `  first_name text,\n`;
    sql += `  last_name text,\n`;
    sql += `  created_at timestamptz DEFAULT now(),\n`;
    sql += `  updated_at timestamptz DEFAULT now(),\n`;
    sql += `  internal_id uuid DEFAULT gen_random_uuid()\n`;
    sql += `);\n\n`;
  }

  return sql;
};