// services/sql-generator/cleanup.ts

import { GeneratorContext } from "./types";

/**
 * Generate DROP statements for all selected objects
 */
export const generateCleanupSQL = (context: GeneratorContext): string => {
  const { pickedTriggers, pickedFunctions, picked, pickedTypes } = context;
  let sql = "";

  // Drop triggers first (they depend on functions and tables)
  if (pickedTriggers.length) {
    sql += "-- Drop existing triggers\n";
    for (const { schema, trigger, table } of pickedTriggers) {
      sql += `DROP TRIGGER IF EXISTS ${trigger} ON ${schema}.${table} CASCADE;\n`;
    }
    sql += "\n";
  }

  // Drop functions (they may depend on types and tables)
  if (pickedFunctions.length) {
    sql += "-- Drop existing functions\n";
    for (const { schema, function: funcName } of pickedFunctions) {
      sql += `DROP FUNCTION IF EXISTS ${schema}.${funcName} CASCADE;\n`;
    }
    sql += "\n";
  }

  // Drop tables (they may depend on types)
  if (picked.length) {
    sql += "-- Drop existing tables\n";
    for (const { schema, table } of picked) {
      sql += `DROP TABLE IF EXISTS ${schema}.${table} CASCADE;\n`;
    }
    sql += "\n";
  }

  // Drop custom types
  if (pickedTypes.length) {
    sql += "-- Drop existing custom types\n";
    for (const { schema, type } of pickedTypes) {
      sql += `DROP TYPE IF EXISTS ${schema}.${type} CASCADE;\n`;
    }
    sql += "\n";
  }

  return sql;
};