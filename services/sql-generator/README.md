# SQL Generator Service

A modular SQL migration generator for Supabase databases. This service breaks down the complex SQL generation process into focused, maintainable modules.

## Architecture

### Core Files

- **`index.ts`** - Main orchestrator that coordinates all generators
- **`types.ts`** - TypeScript interfaces and type definitions
- **`utils.ts`** - Shared utility functions

### Generator Modules

- **`cleanup.ts`** - Generates DROP statements for clean recreation
- **`types-generator.ts`** - Handles enum types and custom types
- **`tables-generator.ts`** - Manages table creation and dependencies
- **`data-generator.ts`** - Handles table data insertion
- **`functions-generator.ts`** - Processes user-defined functions
- **`triggers-generator.ts`** - Manages database triggers
- **`constraints-generator.ts`** - Handles constraints, indexes, and foreign keys

## Usage

```typescript
import { generateMigrationSQL } from './services/sql-generator';

const sql = await generateMigrationSQL({
  url: 'your-supabase-url',
  key: 'your-supabase-key',
  selections: [/* table selections */],
  functionSelections: [/* function selections */],
  typeSelections: [/* type selections */],
  triggerSelections: [/* trigger selections */],
  options: {
    includeData: true,
    dropAndRecreate: true
  }
});
```

## Features

### Drop and Recreate Approach
- Generates comprehensive DROP statements before CREATE statements
- Uses CASCADE to handle dependencies automatically
- Ensures idempotent migrations that can be run multiple times
- Recreates ALL selected objects exactly as they exist in source database

### Dependency Resolution
- Auto-detects and creates all tables from relevant schemas
- Ensures proper ordering: types → tables → data → functions → triggers → constraints
- Creates placeholder auth tables when needed for function compatibility
- Includes warnings for functions that reference auth tables

### Modular Design
- Each generator is focused on a specific database object type
- Easy to test, maintain, and extend individual components
- Clear separation of concerns

## Generator Order

1. **Cleanup** - DROP existing objects in reverse dependency order
2. **Types** - Enum types and custom types
3. **Tables** - Selected tables and auto-detected dependencies
4. **Data** - Table data insertion (if enabled)
5. **Functions** - User-defined functions
6. **Triggers** - Database triggers
7. **Constraints** - Table constraints and indexes
8. **Foreign Keys** - Cross-table relationships

## Error Handling

Each generator module includes:
- Comprehensive error handling with descriptive messages
- Graceful degradation when optional components fail
- Warning comments in generated SQL for manual review items

## Extensibility

To add new database object types:
1. Create a new generator module (e.g., `views-generator.ts`)
2. Add the generator to the main orchestrator in `index.ts`
3. Update types and interfaces as needed
4. Follow the established patterns for error handling and SQL generation