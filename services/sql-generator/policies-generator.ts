// services/sql-generator/policies-generator.ts

import { GeneratorContext } from "./types";

/**
 * Generate SQL for RLS (Row Level Security) policies
 */
export const generatePolicies = async (context: GeneratorContext): Promise<string> => {
  const { rpc, pickedPolicies } = context;
  let sql = "";

  if (pickedPolicies && pickedPolicies.length) {
    sql += "-- ROW LEVEL SECURITY POLICIES\n";

    for (const { schema, table, policy } of pickedPolicies) {
      try {
        // First, enable RLS on the table if not already enabled
        sql += `-- Enable RLS on ${schema}.${table}\n`;
        sql += `ALTER TABLE ${schema}.${table} ENABLE ROW LEVEL SECURITY;\n\n`;

        // Get the policy definition using RPC function
        const r = await rpc.rpc("pg_get_policy_def", {
          schemaname: schema,
          tablename: table,
          policyname: policy
        });
        
        if (r.error) throw r.error;
        const policyDef = r.data as Array<{ definition: string }> | null;
        
        if (policyDef && policyDef.length > 0) {
          // Add explicit DROP before CREATE
          sql += `-- Drop and recreate policy ${policy} on ${schema}.${table}\n`;
          sql += `DROP POLICY IF EXISTS ${policy} ON ${schema}.${table};\n`;
          
          // Check if policy references auth functions and warn
          const policyCode = policyDef[0].definition;
          if (policyCode.includes('auth.uid()') || 
              policyCode.includes('auth.jwt()') ||
              policyCode.includes('auth.role()')) {
            sql += `-- WARNING: Policy ${policy} references auth functions\n`;
            sql += `-- You may need to modify this policy for your target database\n`;
            sql += `-- Consider updating references to auth.uid(), auth.jwt(), or auth.role()\n`;
          }

          sql += `${policyCode};\n\n`;
        } else {
          sql += `-- Could not retrieve definition for policy ${schema}.${table}.${policy}\n`;
        }
      } catch (err) {
        sql += `-- Error retrieving definition for policy ${schema}.${table}.${policy}: ${err}\n`;
      }
    }
    sql += "\n";
  }

  return sql;
};

/**
 * Generate SQL to enable RLS on all tables with policies
 */
export const generateRLSEnabling = async (context: GeneratorContext): Promise<string> => {
  const { pickedPolicies } = context;
  let sql = "";

  if (pickedPolicies && pickedPolicies.length) {
    // Get unique tables that have policies
    const tablesWithPolicies = new Set<string>();
    pickedPolicies.forEach(({ schema, table }) => {
      tablesWithPolicies.add(`${schema}.${table}`);
    });

    if (tablesWithPolicies.size > 0) {
      sql += "-- ENABLE ROW LEVEL SECURITY\n";
      for (const tableRef of tablesWithPolicies) {
        sql += `ALTER TABLE ${tableRef} ENABLE ROW LEVEL SECURITY;\n`;
      }
      sql += "\n";
    }
  }

  return sql;
};