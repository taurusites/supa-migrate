// pages/api/generate-sql.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { generateMigrationSQL } from "../../services/sql-generator";
import { TableSelection, FunctionSelection, TypeSelection, TriggerSelection, PolicySelection } from "../../types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string | { error: string }>
) {
  try {
    // Extract credentials from headers
    const url = req.headers["x-sb-url"] as string;
    const key = req.headers["x-sb-key"] as string;

    // Parse request body
    const { selections, functionSelections, typeSelections, triggerSelections, policySelections } = req.body as {
      selections: TableSelection[];
      functionSelections?: FunctionSelection[];
      typeSelections?: TypeSelection[];
      triggerSelections?: TriggerSelection[];
      policySelections?: PolicySelection[];
    };

    // Generate SQL using the modular generator
    const sql = await generateMigrationSQL({
      url,
      key,
      selections,
      functionSelections,
      typeSelections,
      triggerSelections,
      policySelections,
      options: {
        includeData: true,
        dropAndRecreate: true
      }
    });

    res.setHeader("Content-Type", "text/plain");
    return res.status(200).send(sql);
  }
  catch (err: any) {
    console.error("generate-sql error:", err);
    return res.status(500).send(err.message);
  }
}