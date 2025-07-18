-- 1) schemas
DROP FUNCTION IF EXISTS public.pg_list_schemas();
CREATE OR REPLACE FUNCTION public.pg_list_schemas()
  RETURNS TABLE(schema_name text) AS $$
    SELECT schema_name FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog','information_schema')
      AND NOT schema_name LIKE 'pg_toast%';
  $$ LANGUAGE sql STABLE;

-- 2) tables
DROP FUNCTION IF EXISTS public.pg_list_tables(text);
CREATE OR REPLACE FUNCTION public.pg_list_tables(schemaname text)
  RETURNS TABLE(table_name text) AS $$
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = schemaname AND table_type='BASE TABLE';
  $$ LANGUAGE sql STABLE;

-- 3) Get CREATE TABLE DDL, ordering columns by ordinal_position inside string_agg
DROP FUNCTION IF EXISTS public.pg_get_tabledef(text, text);
CREATE OR REPLACE FUNCTION public.pg_get_tabledef(
  schemaname text,
  tablename  text
)
  RETURNS TABLE(ddl text) AS $$
    SELECT
      'CREATE TABLE '
      || quote_ident(schemaname) || '.' || quote_ident(tablename)
      || E'\n(\n'
      || string_agg(
           -- 1st arg: the column definition expression
           '  ' 
           || quote_ident(column_name)
           || ' '  
           || udt_name
           || COALESCE('(' || character_maximum_length || ')','')
           || CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END
           -- 2nd arg: the delimiter, with ORDER BY attached
           , E',\n' ORDER BY ordinal_position
         )
      || E'\n)' AS ddl
    FROM information_schema.columns
    WHERE table_schema = schemaname
      AND table_name   = tablename;
  $$ LANGUAGE sql STABLE;
  
-- 4) enums
DROP FUNCTION IF EXISTS public.pg_list_enum_types();
CREATE OR REPLACE FUNCTION public.pg_list_enum_types()
  RETURNS TABLE(type_schema text,type_name text,labels text[]) AS $$
    SELECT
      n.nspname, t.typname,
      array_agg(e.enumlabel ORDER BY e.enumsortorder)
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid=t.oid
    JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE t.typtype='e'
    GROUP BY n.nspname,t.typname;
  $$ LANGUAGE sql STABLE;

-- 5) constraints
DROP FUNCTION IF EXISTS public.pg_list_constraints(text,text);
CREATE OR REPLACE FUNCTION public.pg_list_constraints(schemaname text,tablename text)
  RETURNS TABLE(constraint_name text,definition text) AS $$
    SELECT c.conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid=c.conrelid
    JOIN pg_namespace ns ON ns.oid=rel.relnamespace
    WHERE c.contype IN('p','u')
      AND ns.nspname=schemaname
      AND rel.relname=tablename;
  $$ LANGUAGE sql STABLE;

-- 6) indexes
DROP FUNCTION IF EXISTS public.pg_list_indexes(text,text);
CREATE OR REPLACE FUNCTION public.pg_list_indexes(schemaname text,tablename text)
  RETURNS TABLE(indexdef text) AS $$
    SELECT indexdef FROM pg_indexes
    WHERE schemaname=pg_list_indexes.schemaname
      AND tablename=pg_list_indexes.tablename;
  $$ LANGUAGE sql STABLE;

-- 7) foreign keys
DROP FUNCTION IF EXISTS public.pg_list_foreign_keys();
CREATE OR REPLACE FUNCTION public.pg_list_foreign_keys()
  RETURNS TABLE(
    fk_schema text,fk_name text,
    table_schema text,table_name text,
    column_names text[],foreign_table_schema text,
    foreign_table_name text,foreign_column_names text[]
  ) AS $$
    SELECT
      nsp.nspname AS fk_schema, c.conname AS fk_name,
      nsp.nspname AS table_schema, rel.relname AS table_name,
      array_agg(att2.attname ORDER BY x.ordinality) AS column_names,
      fnsp.nspname AS foreign_table_schema, frel.relname AS foreign_table_name,
      array_agg(att.attname ORDER BY x.ordinality) AS foreign_column_names
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid=c.conrelid
    JOIN pg_namespace nsp ON nsp.oid=rel.relnamespace
    JOIN pg_class frel ON frel.oid=c.confrelid
    JOIN pg_namespace fnsp ON fnsp.oid=frel.relnamespace
    JOIN unnest(c.conkey,c.confkey) WITH ORDINALITY AS x(attnum,fanum,ordinality) ON TRUE
    JOIN pg_attribute att2 ON att2.attrelid=rel.oid AND att2.attnum=x.attnum
    JOIN pg_attribute att ON att.attrelid=frel.oid AND att.attnum=x.fanum
    WHERE c.contype='f'
    GROUP BY nsp.nspname,c.conname,rel.relname,fnsp.nspname,frel.relname;
  $$ LANGUAGE sql STABLE;

  -- 8) List all user functions
DROP FUNCTION IF EXISTS public.pg_list_functions();
CREATE OR REPLACE FUNCTION public.pg_list_functions()
  RETURNS TABLE(function_schema text, function_name text) AS $$
    SELECT n.nspname AS function_schema,
           p.proname AS function_name
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname NOT IN ('pg_catalog','information_schema')
      AND p.prokind = 'f';
  $$ LANGUAGE sql STABLE;

-- 9) Get function definition
DROP FUNCTION IF EXISTS public.pg_get_functiondef(text,text);
CREATE OR REPLACE FUNCTION public.pg_get_functiondef(
  function_schema text,
  function_name   text
)
  RETURNS TABLE(def text) AS $$
    SELECT pg_get_functiondef(p.oid) AS def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = function_schema
      AND p.proname = function_name
    LIMIT 1;
  $$ LANGUAGE sql STABLE;

-- 10) List all triggers
DROP FUNCTION IF EXISTS public.pg_list_triggers();
CREATE OR REPLACE FUNCTION public.pg_list_triggers()
  RETURNS TABLE(
    trigger_schema           text,
    table_name               text,
    trigger_name             text
  ) AS $$
    SELECT
      n.nspname    AS trigger_schema,
      c.relname    AS table_name,
      t.tgname     AS trigger_name
    FROM pg_trigger t
    JOIN pg_class c     ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE NOT t.tgisinternal;
  $$ LANGUAGE sql STABLE;

-- 11) Get trigger definition
DROP FUNCTION IF EXISTS public.pg_get_triggerdef(text,text,text);
CREATE OR REPLACE FUNCTION public.pg_get_triggerdef(
  trigger_schema text,
  table_name     text,
  trigger_name   text
)
  RETURNS TABLE(def text) AS $$
    SELECT pg_get_triggerdef(t.oid) AS def
    FROM pg_trigger t
    JOIN pg_class c     ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = trigger_schema
      AND c.relname = table_name
      AND t.tgname  = trigger_name
    LIMIT 1;
  $$ LANGUAGE sql STABLE;


  -- NEW: list indexes for one schema via RPC (avoids pg_catalog override)
DROP FUNCTION IF EXISTS public.pg_list_schema_indexes(text);
CREATE OR REPLACE FUNCTION public.pg_list_schema_indexes(schemaname text)
  RETURNS TABLE(
    tablename text,
    indexname text,
    indexdef  text
  ) AS $$
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = schemaname;
  $$ LANGUAGE sql STABLE;