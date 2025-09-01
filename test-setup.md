# Test Setup Guide

## 1. Create Test Supabase Project

1. Go to https://supabase.com/dashboard
2. Create a new project
3. Wait for setup to complete

## 2. Install Required SQL Functions

Copy and run this in your Supabase SQL Editor:

```sql
-- Install all migration functions
-- (Copy the entire content from sql/supabase_migration_functions.sql)
```

## 3. Create Sample Test Data

```sql
-- Create a test schema
CREATE SCHEMA IF NOT EXISTS test_schema;

-- Create sample tables
CREATE TABLE test_schema.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE test_schema.posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES test_schema.users(id),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample data
INSERT INTO test_schema.users (name, email) VALUES
    ('John Doe', 'john@example.com'),
    ('Jane Smith', 'jane@example.com'),
    ('Bob Wilson', 'bob@example.com');

INSERT INTO test_schema.posts (user_id, title, content, published) VALUES
    (1, 'First Post', 'This is my first post content', true),
    (1, 'Second Post', 'Another post by John', false),
    (2, 'Jane''s Post', 'Content from Jane', true);

-- Create an enum type for testing
CREATE TYPE test_schema.status_enum AS ENUM ('active', 'inactive', 'pending');

-- Create table with enum
CREATE TABLE test_schema.accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES test_schema.users(id),
    status test_schema.status_enum DEFAULT 'pending',
    balance DECIMAL(10,2) DEFAULT 0.00
);

INSERT INTO test_schema.accounts (user_id, status, balance) VALUES
    (1, 'active', 1500.50),
    (2, 'active', 750.25),
    (3, 'pending', 0.00);
```

## 4. Get Your Credentials

1. Go to Settings > API in your Supabase dashboard
2. Copy your Project URL
3. Copy your service_role key (not anon key!)

## 5. Test the Migration Tool

1. Start the app: `npm run dev`
2. Navigate to http://localhost:3001
3. Enter your credentials
4. Select tables from test_schema
5. Generate and review the SQL

## Expected Results

The generated SQL should include:
- CREATE TYPE for status_enum
- CREATE TABLE statements for all tables
- INSERT statements with your test data
- Primary key and foreign key constraints
- Indexes

## Cleanup

After testing, you can delete the test schema:
```sql
DROP SCHEMA test_schema CASCADE;
```