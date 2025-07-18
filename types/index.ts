// types/index.ts

export interface Credentials {
  url: string;
  key: string;
}

// per-type info returned by list-schema-details
export interface EnumInfo {
  type_schema: string;
  type_name:   string;
  labels:      string[];
}
export interface RoutineInfo {
  function_schema: string;
  function_name:   string;
}
export interface TriggerInfo {
  trigger_schema: string;
  table_name:     string;
  trigger_name:   string;
}
export interface IndexInfo {
  tablename: string;
  indexname: string;
  indexdef:  string;
}
export interface ForeignKeyInfo {
  fk_schema:            string;
  fk_name:              string;
  table_schema:         string;
  table_name:           string;
  column_names:         string[];
  foreign_table_schema: string;
  foreign_table_name:   string;
  foreign_column_names: string[];
}

// full schema detail
export interface SchemaDetail {
  schema:      string;
  tables:      string[];
  enums:       EnumInfo[];
  functions:   RoutineInfo[];
  triggers:    TriggerInfo[];
  indexes:     IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
}

// generic selection record
export type Category =
  | "table"
  | "enum"
  | "function"
  | "trigger"
  | "index"
  | "foreignKey";

export interface Selection {
  schema:   string;
  name:     string;
  category: Category;
  selected: boolean;
}