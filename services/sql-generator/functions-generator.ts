// services/sql-generator/functions-generator.ts

import { GeneratorContext } from "./types";

/**
 * Generate SQL for user-defined functions
 */
export const generateFunctions = async (context: GeneratorContext): Promise<string> => {
  const { rpc, pickedFunctions } = context;
  let sql = "";

  if (pickedFunctions.length) {
    sql += "-- USER-DEFINED FUNCTIONS\n";

    for (const { schema, function: funcName } of pickedFunctions) {
      try {
        const r = await rpc.rpc("pg_get_function_def", {
          schemaname: schema,
          functionname: funcName
        });
        if (r.error) throw r.error;
        const funcDef = r.data as Array<{ definition: string }> | null;
        if (funcDef && funcDef.length > 0) {
          let functionCode = funcDef[0].definition;

          // Add explicit DROP before CREATE
          sql += `-- Drop and recreate function ${schema}.${funcName}\n`;
          sql += `DROP FUNCTION IF EXISTS ${schema}.${funcName} CASCADE;\n`;

          // Check if function references auth tables and warn
          if (functionCode.includes('public.users') ||
            functionCode.includes('auth.users') ||
            functionCode.includes('auth.uid()')) {
            sql += `-- WARNING: Function ${schema}.${funcName} references auth tables\n`;
            sql += `-- You may need to modify this function for your target database\n`;
            sql += `-- Consider updating references to auth.users or auth.uid() calls\n`;
          }

          sql += `${functionCode};\n\n`;
        } else {
          sql += `-- Could not retrieve definition for ${schema}.${funcName}\n`;
        }
      } catch (err) {
        sql += `-- Error retrieving definition for ${schema}.${funcName}: ${err}\n`;
      }
    }
    sql += "\n";
  }

  return sql;
};