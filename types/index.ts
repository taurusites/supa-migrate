export interface Credentials {
  url: string;
  key: string;
}

export interface SchemaInfo {
  schema: string;
  tables: string[];
  functions: string[];
  types: string[];
  triggers: Array<{ trigger_name: string; table_name: string; }>;
}

export interface TableSelection {
  schema: string;
  table: string;
  selected: boolean;
}

export interface FunctionSelection {
  schema: string;
  function: string;
  selected: boolean;
}

export interface TypeSelection {
  schema: string;
  type: string;
  selected: boolean;
}

export interface TriggerSelection {
  schema: string;
  trigger: string;
  table: string;
  selected: boolean;
}