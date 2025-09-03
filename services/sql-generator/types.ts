// services/sql-generator/types.ts

import { SupabaseClient } from "@supabase/supabase-js";
import { TableSelection, FunctionSelection, TypeSelection, TriggerSelection, PolicySelection } from "../../types";

export interface GeneratorContext {
  rpc: SupabaseClient;
  url: string;
  key: string;
  picked: TableSelection[];
  pickedFunctions: FunctionSelection[];
  pickedTypes: TypeSelection[];
  pickedTriggers: TriggerSelection[];
  pickedPolicies?: PolicySelection[];
  tableSet: Set<string>;
  schemaSet: Set<string>;
}

export interface GeneratorOptions {
  includeData?: boolean;
  dropAndRecreate?: boolean;
}