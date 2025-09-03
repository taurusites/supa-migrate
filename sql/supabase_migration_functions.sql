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

-- 8) user-defined functions
DROP FUNCTION IF EXISTS public.pg_list_functions(text);
CREATE OR REPLACE FUNCTION public.pg_list_functions(schemaname text)
  RETURNS TABLE(function_name text) AS $$
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = schemaname
      AND p.prokind = 'f'  -- 'f' = function, 'a' = aggregate, 'p' = procedure, 'w' = window
      AND p.proname NOT LIKE 'pg_%'
      AND p.proname NOT IN (
        'pg_list_schemas', 'pg_list_tables', 'pg_get_tabledef', 
        'pg_list_enum_types', 'pg_list_constraints', 'pg_list_indexes',
        'pg_list_foreign_keys', 'pg_list_functions', 'pg_list_user_types',
        'pg_list_triggers', 'pg_get_function_def', 'pg_get_trigger_def',
        'pg_get_type_def', 'pg_list_policies', 'pg_get_policy_def'
      )  -- exclude our own migration functions
    ORDER BY p.proname;
  $$ LANGUAGE sql STABLE;

-- 9) user-defined types (excluding enums which are handled separately)
DROP FUNCTION IF EXISTS public.pg_list_user_types(text);
CREATE OR REPLACE FUNCTION public.pg_list_user_types(schemaname text)
  RETURNS TABLE(type_name text) AS $$
    SELECT t.typname
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = schemaname
      AND t.typtype IN ('c', 'd')  -- composite and domain types
      AND t.typname NOT LIKE 'pg_%'
      AND t.typname NOT LIKE '_%'  -- exclude array types
    ORDER BY t.typname;
  $$ LANGUAGE sql STABLE;

-- 10) triggers
DROP FUNCTION IF EXISTS public.pg_list_triggers(text);
CREATE OR REPLACE FUNCTION public.pg_list_triggers(schemaname text)
  RETURNS TABLE(trigger_name text, table_name text) AS $$
    SELECT t.tgname, c.relname
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = schemaname
      AND NOT t.tgisinternal  -- exclude internal triggers
      AND t.tgname NOT LIKE 'RI_%'  -- exclude foreign key triggers
    ORDER BY c.relname, t.tgname;
  $$ LANGUAGE sql STABLE;

-- 11) get function definition
DROP FUNCTION IF EXISTS public.pg_get_function_def(text, text);
CREATE OR REPLACE FUNCTION public.pg_get_function_def(schemaname text, functionname text)
  RETURNS TABLE(definition text) AS $$
    SELECT pg_get_functiondef(p.oid)
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = schemaname
      AND p.proname = functionname
      AND p.prokind = 'f'
    LIMIT 1;
  $$ LANGUAGE sql STABLE;

-- 12) get trigger definition
DROP FUNCTION IF EXISTS public.pg_get_trigger_def(text, text);
CREATE OR REPLACE FUNCTION public.pg_get_trigger_def(schemaname text, triggername text)
  RETURNS TABLE(definition text) AS $$
    SELECT pg_get_triggerdef(t.oid)
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = schemaname
      AND t.tgname = triggername
      AND NOT t.tgisinternal
    LIMIT 1;
  $$ LANGUAGE sql STABLE;

-- 13) get user-defined type definition
DROP FUNCTION IF EXISTS public.pg_get_type_def(text, text);
CREATE OR REPLACE FUNCTION public.pg_get_type_def(schemaname text, typename text)
  RETURNS TABLE(definition text) AS $$
    SELECT 
      CASE 
        WHEN t.typtype = 'c' THEN
          'CREATE TYPE ' || quote_ident(schemaname) || '.' || quote_ident(typename) || ' AS (' ||
          string_agg(
            quote_ident(a.attname) || ' ' || format_type(a.atttypid, a.atttypmod),
            ', ' ORDER BY a.attnum
          ) || ')'
        WHEN t.typtype = 'd' THEN
          'CREATE DOMAIN ' || quote_ident(schemaname) || '.' || quote_ident(typename) || ' AS ' ||
          format_type(t.typbasetype, t.typtypmod) ||
          CASE WHEN t.typnotnull THEN ' NOT NULL' ELSE '' END
        ELSE
          '-- Unsupported type: ' || typename
      END as definition
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    LEFT JOIN pg_attribute a ON a.attrelid = t.typrelid AND a.attnum > 0 AND NOT a.attisdropped
    WHERE n.nspname = schemaname
      AND t.typname = typename
      AND t.typtype IN ('c', 'd')
    GROUP BY t.typtype, schemaname, typename, t.typbasetype, t.typtypmod, t.typnotnull;
  $$ LANGUAGE sql STABLE;

-- 14) list RLS policies
DROP FUNCTION IF EXISTS public.pg_list_policies(text);
CREATE OR REPLACE FUNCTION public.pg_list_policies(schemaname text)
  RETURNS TABLE(policy_name text, table_name text) AS $$
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = pg_list_policies.schemaname
    ORDER BY tablename, policyname;
  $$ LANGUAGE sql STABLE;

-- 15) get RLS policy definition
DROP FUNCTION IF EXISTS public.pg_get_policy_def(text, text, text);
CREATE OR REPLACE FUNCTION public.pg_get_policy_def(schemaname text, tablename text, policyname text)
  RETURNS TABLE(definition text) AS $$
    SELECT 
      'CREATE POLICY ' || quote_ident(policyname) || ' ON ' || quote_ident(schemaname) || '.' || quote_ident(tablename) ||
      CASE 
        WHEN cmd IS NOT NULL AND cmd != 'ALL' THEN E'\n  FOR ' || cmd
        ELSE ''
      END ||
      CASE 
        WHEN roles IS NOT NULL AND array_length(roles, 1) > 0 THEN 
          E'\n  TO ' || array_to_string(
            ARRAY(
              SELECT CASE 
                WHEN role_name = 'public' THEN 'public'
                ELSE quote_ident(role_name)
              END
              FROM unnest(roles) AS role_name
            ), 
            ', '
          )
        ELSE ''
      END ||
      CASE 
        WHEN qual IS NOT NULL THEN E'\n  USING (' || qual || ')'
        ELSE ''
      END ||
      CASE 
        WHEN with_check IS NOT NULL AND with_check != qual THEN E'\n  WITH CHECK (' || with_check || ')'
        ELSE ''
      END as definition
    FROM pg_policies
    WHERE schemaname = pg_get_policy_def.schemaname
      AND tablename = pg_get_policy_def.tablename
      AND policyname = pg_get_policy_def.policyname
    LIMIT 1;
  $$ LANGUAGE sql STABLE;