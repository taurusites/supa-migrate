export interface Credentials {
    url: string;
    key: string;
  }
  
  export interface SchemaInfo {
    schema: string;
    tables: string[];
  }
  
  export interface TableSelection {
    schema: string;
    table: string;
    selected: boolean;
  }