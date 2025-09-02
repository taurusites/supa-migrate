// services/sql-generator/triggers-generator.ts

import { GeneratorContext } from "./types";

/**
 * Generate SQL for triggers
 */
export const generateTriggers = async (context: GeneratorContext): Promise<string> => {
  const { rpc, pickedTriggers } = context;
  let sql = "";

  if (pickedTriggers.length) {
    sql += "-- TRIGGERS\n";
    for (const { schema, trigger, table } of pickedTriggers) {
      try {
        const r = await rpc.rpc("pg_get_trigger_def", {
          schemaname: schema,
          triggername: trigger
        });
        if (r.error) throw r.error;
        const triggerDef = r.data as Array<{ definition: string }> | null;
        if (triggerDef && triggerDef.length > 0) {
          // Add explicit DROP before CREATE
          sql += `-- Drop and recreate trigger ${trigger} on ${schema}.${table}\n`;
          sql += `DROP TRIGGER IF EXISTS ${trigger} ON ${schema}.${table} CASCADE;\n`;
          sql += `${triggerDef[0].definition};\n\n`;
        } else {
          sql += `-- Could not retrieve definition for trigger ${schema}.${trigger} on ${table}\n`;
        }
      } catch (err) {
        sql += `-- Error retrieving definition for trigger ${schema}.${trigger}: ${err}\n`;
      }
    }
    sql += "\n";
  }

  return sql;
};