// services/sql-generator/data-generator.ts

import { createClient } from "@supabase/supabase-js";
import { GeneratorContext } from "./types";
import { literalize } from "./utils";

/**
 * Generate SQL for table data
 */
export const generateTableData = async (context: GeneratorContext): Promise<string> => {
  const { url, key, picked } = context;
  let sql = "";

  if (picked.length) {
    sql += "-- TABLE DATA\n";
    
    for (const { schema, table } of picked) {
      const db = createClient(url, key, {
        db: { schema },
        global: { headers: { Accept: "application/json" } }
      });

      let offset = 0;
      const pageSize = 500;
      let hasData = false;

      while (true) {
        const { data, error } = await db
          .from(table)
          .select("*")
          .range(offset, offset + pageSize - 1);

        if (error) throw error;
        const rows = data as any[];
        if (!rows.length) break;

        if (!hasData) {
          sql += `-- Data for ${schema}.${table}\n`;
          hasData = true;
        }

        const cols = Object.keys(rows[0]);
        const vals = rows.map(r => "(" +
          cols.map(c => literalize(r[c])).join(", ") + ")"
        );

        sql += `INSERT INTO ${schema}.${table} (${cols.join(", ")}) VALUES\n`;
        sql += `${vals.join(",\n")};\n\n`;

        if (rows.length < pageSize) break;
        offset += pageSize;
      }

      if (!hasData) {
        sql += `-- No data found for ${schema}.${table}\n\n`;
      }
    }
  }

  return sql;
};