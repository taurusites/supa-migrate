// services/sql-generator/index.ts

import { createClient } from "@supabase/supabase-js";
import { TableSelection, FunctionSelection, TypeSelection, TriggerSelection } from "../../types";
import { GeneratorContext, GeneratorOptions } from "./types";
import { generateHeader, generateCleanupHeader, generateRecreationHeader } from "./utils";
import { generateCleanupSQL } from "./cleanup";
import { generateEnumTypes, generateCustomTypes } from "./types-generator";
import { generateSelectedTables, generateDependencyTables, generateAuthTables } from "./tables-generator";
import { generateTableData } from "./data-generator";
import { generateFunctions } from "./functions-generator";
import { generateTriggers } from "./triggers-generator";
import { generateConstraints, generateIndexes, generateForeignKeys } from "./constraints-generator";

export interface SQLGeneratorInput {
  url: string;
  key: string;
  selections: TableSelection[];
  functionSelections?: FunctionSelection[];
  typeSelections?: TypeSelection[];
  triggerSelections?: TriggerSelection[];
  options?: GeneratorOptions;
}

/**
 * Main SQL generator function
 */
export const generateMigrationSQL = async (input: SQLGeneratorInput): Promise<string> => {
  const {
    url,
    key,
    selections,
    functionSelections = [],
    typeSelections = [],
    triggerSelections = [],
    options = { includeData: true, dropAndRecreate: true }
  } = input;

  // Validate inputs
  if (!url || !key) throw new Error("Missing credentials");

  // Filter selections
  const picked = selections.filter((s) => s.selected);
  const pickedFunctions = functionSelections.filter((s) => s.selected);
  const pickedTypes = typeSelections.filter((s) => s.selected);
  const pickedTriggers = triggerSelections.filter((s) => s.selected);

  if (!picked.length && !pickedFunctions.length && !pickedTypes.length && !pickedTriggers.length) {
    throw new Error("No tables, functions, types, or triggers selected");
  }

  // Create RPC client
  const rpc = createClient(url, key, { global: { headers: { Accept: "application/json" } } });

  // Build context
  const context: GeneratorContext = {
    rpc,
    url,
    key,
    picked,
    pickedFunctions,
    pickedTypes,
    pickedTriggers,
    tableSet: new Set(picked.map((s) => `${s.schema}.${s.table}`)),
    schemaSet: new Set(picked.map((s) => s.schema))
  };

  // Generate SQL
  let sql = generateHeader();

  // Cleanup section
  if (options.dropAndRecreate) {
    sql += generateCleanupHeader();
    sql += generateCleanupSQL(context);
    sql += generateRecreationHeader();
  }

  // Types
  sql += await generateEnumTypes(context);
  sql += await generateCustomTypes(context);

  // Tables
  sql += await generateSelectedTables(context);
  
  // Get all relevant schemas for dependency tables
  const allRelevantSchemas = new Set<string>();
  picked.forEach(({ schema }) => allRelevantSchemas.add(schema));
  pickedFunctions.forEach(({ schema }) => allRelevantSchemas.add(schema));
  pickedTypes.forEach(({ schema }) => allRelevantSchemas.add(schema));
  pickedTriggers.forEach(({ schema }) => allRelevantSchemas.add(schema));
  
  sql += await generateDependencyTables(context);
  sql += generateAuthTables(context, allRelevantSchemas);

  // Data
  if (options.includeData) {
    sql += await generateTableData(context);
  }

  // Functions and triggers
  sql += await generateFunctions(context);
  sql += await generateTriggers(context);

  // Constraints and indexes
  sql += await generateConstraints(context);
  sql += await generateIndexes(context);
  sql += await generateForeignKeys(context);

  return sql;
};