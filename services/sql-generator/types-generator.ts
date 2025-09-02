// services/sql-generator/types-generator.ts

import { GeneratorContext } from "./types";

/**
 * Generate SQL for enum types
 */
export const generateEnumTypes = async (context: GeneratorContext): Promise<string> => {
  const { rpc, schemaSet } = context;
  let sql = "";

  const r = await rpc.rpc("pg_list_enum_types");
  if (r.error) throw r.error;
  
  const enums = r.data as Array<{
    type_schema: string;
    type_name: string;
    labels: string[];
  }> | null;

  const use = enums?.filter((e) => schemaSet.has(e.type_schema)) || [];
  
  if (use.length) {
    sql += "-- ENUM TYPES\n";
    for (const e of use) {
      const vals = e.labels.map((l) => `'${l.replace(/'/g, "''")}'`);
      sql += `-- Drop and recreate enum ${e.type_schema}.${e.type_name}\n`;
      sql += `DROP TYPE IF EXISTS ${e.type_schema}.${e.type_name} CASCADE;\n`;
      sql += `CREATE TYPE ${e.type_schema}.${e.type_name} AS ENUM (${vals.join(", ")});\n`;
    }
    sql += "\n";
  }

  return sql;
};

/**
 * Generate SQL for custom types
 */
export const generateCustomTypes = async (context: GeneratorContext): Promise<string> => {
  const { rpc, schemaSet, pickedTypes } = context;
  let sql = "";

  // Get all custom types from schemas that have selected tables
  const allCustomTypes = new Set<string>();

  // Add explicitly selected types
  pickedTypes.forEach(({ schema, type }) => {
    allCustomTypes.add(`${schema}.${type}`);
  });

  // Get all custom types from schemas with selected tables
  for (const schema of schemaSet) {
    try {
      const r = await rpc.rpc("pg_list_user_types", { schemaname: schema });
      if (r.error) throw r.error;
      const types = r.data as Array<{ type_name: string }> | null;

      if (types) {
        types.forEach(({ type_name }) => {
          allCustomTypes.add(`${schema}.${type_name}`);
        });
      }
    } catch (err) {
      console.warn(`Could not list types for schema ${schema}:`, err);
    }
  }

  if (allCustomTypes.size > 0) {
    sql += "-- CUSTOM TYPES (All types from selected schemas)\n";

    for (const typeRef of allCustomTypes) {
      const [typeSchema, typeName] = typeRef.split('.');
      try {
        const r = await rpc.rpc("pg_get_type_def", {
          schemaname: typeSchema,
          typename: typeName
        });
        if (r.error) throw r.error;
        const typeDef = r.data as Array<{ definition: string }> | null;
        if (typeDef && typeDef.length > 0) {
          sql += `-- Drop and recreate type ${typeSchema}.${typeName}\n`;
          sql += `DROP TYPE IF EXISTS ${typeSchema}.${typeName} CASCADE;\n`;
          sql += `${typeDef[0].definition};\n\n`;
        } else {
          sql += `-- Could not retrieve definition for type ${typeSchema}.${typeName}\n`;
        }
      } catch (err) {
        sql += `-- Error retrieving definition for type ${typeSchema}.${typeName}: ${err}\n`;
      }
    }
    sql += "\n";
  }

  return sql;
};