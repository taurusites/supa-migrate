// services/sql-generator/constraints-generator.ts

import { GeneratorContext } from "./types";

/**
 * Generate SQL for table constraints
 */
export const generateConstraints = async (context: GeneratorContext): Promise<string> => {
  const { rpc, picked } = context;
  let sql = "";

  if (picked.length) {
    sql += "-- CONSTRAINTS\n";
    for (const { schema, table } of picked) {
      const { data, error } = await rpc.rpc("pg_list_constraints", {
        schemaname: schema,
        tablename: table
      });
      if (error) throw error;
      const constraints = data as Array<{ constraint_name: string; definition: string }> | null;

      if (constraints && constraints.length > 0) {
        sql += `-- Constraints for ${schema}.${table}\n`;
        for (const c of constraints) {
          sql += `ALTER TABLE ${schema}.${table}\n`;
          sql += `  ADD CONSTRAINT ${c.constraint_name} ${c.definition};\n`;
        }
        sql += "\n";
      }
    }
  }

  return sql;
};

/**
 * Generate SQL for indexes
 */
export const generateIndexes = async (context: GeneratorContext): Promise<string> => {
  const { rpc, picked } = context;
  let sql = "";

  if (picked.length) {
    sql += "-- INDEXES\n";
    for (const { schema, table } of picked) {
      // Get constraint names to avoid duplicating indexes
      const rc = await rpc.rpc("pg_list_constraints", {
        schemaname: schema,
        tablename: table
      });
      if (rc.error) throw rc.error;
      const constraintNames = (rc.data as any[])?.map(r => r.constraint_name) || [];

      // Get indexes
      const ri = await rpc.rpc("pg_list_indexes", {
        schemaname: schema,
        tablename: table
      });
      if (ri.error) throw ri.error;
      const indexes = ri.data as Array<{ indexdef: string }> | null;

      if (indexes && indexes.length > 0) {
        const filteredIndexes = indexes.filter(ix => {
          const match = ix.indexdef.match(/INDEX\s+("?)([^\s"]+)\1/i);
          const indexName = match?.[2] || "";
          return indexName && !constraintNames.includes(indexName);
        });

        if (filteredIndexes.length > 0) {
          sql += `-- Indexes for ${schema}.${table}\n`;
          filteredIndexes.forEach(ix => {
            sql += `${ix.indexdef.trim()};\n`;
          });
          sql += "\n";
        }
      }
    }
  }

  return sql;
};

/**
 * Generate SQL for foreign key constraints
 */
export const generateForeignKeys = async (context: GeneratorContext): Promise<string> => {
  const { rpc, tableSet } = context;
  let sql = "";

  const r = await rpc.rpc("pg_list_foreign_keys");
  if (r.error) throw r.error;
  const fks = r.data as any[];

  const use = fks.filter((fk) => {
    const left = `${fk.table_schema}.${fk.table_name}`;
    const right = `${fk.foreign_table_schema}.${fk.foreign_table_name}`;
    return tableSet.has(left) && tableSet.has(right);
  });

  if (use.length) {
    sql += "-- FOREIGN KEY CONSTRAINTS\n";
    use.forEach((fk: any) => {
      const cols = fk.column_names.join(", ");
      const fcols = fk.foreign_column_names.join(", ");
      sql += `ALTER TABLE ${fk.table_schema}.${fk.table_name}\n` +
        `  ADD CONSTRAINT ${fk.fk_name}\n` +
        `  FOREIGN KEY (${cols}) REFERENCES ${fk.foreign_table_schema}.${fk.foreign_table_name}(${fcols});\n\n`;
    });
  }

  return sql;
};