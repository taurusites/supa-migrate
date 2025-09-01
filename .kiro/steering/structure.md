# Project Structure

## Root Level Organization
```
├── components/          # Reusable React components
├── context/            # React Context providers
├── pages/              # Next.js pages and API routes
├── services/           # External API service functions
├── sql/                # SQL migration scripts and functions
├── styles/             # Global CSS styles
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Key Directories

### `/components`
- React components following PascalCase naming
- Step-based components for wizard flow (`Step1Credentials.tsx`, `Step2Select.tsx`, etc.)
- Shared UI components (`Loading.tsx`, `SQLViewer.tsx`)
- Main orchestrating component (`Wizard.tsx`)

### `/pages`
- Next.js file-based routing
- `index.tsx` - Main application entry point
- `_app.tsx` - App-level configuration and providers
- `/api` - Backend API endpoints for Supabase operations

### `/context`
- React Context providers for global state
- `SupabaseContext.tsx` - Manages Supabase credentials across components

### `/services`
- External API communication functions
- `supabaseService.ts` - Wrapper functions for API calls to Next.js backend

### `/types`
- TypeScript interface definitions
- `index.ts` - Core type definitions (Credentials, SchemaInfo, TableSelection)

### `/sql`
- SQL migration scripts and database functions
- Contains Supabase-specific migration utilities

### `/utils`
- Utility functions like file download helpers
- Pure functions without side effects

## Naming Conventions
- **Components**: PascalCase (e.g., `Step1Credentials.tsx`)
- **Files**: camelCase for utilities, PascalCase for components
- **Types**: PascalCase interfaces (e.g., `Credentials`, `SchemaInfo`)
- **Context**: PascalCase with "Context" suffix

## Architecture Patterns
- **Wizard Pattern**: Multi-step form with state management
- **Context Pattern**: Global state via React Context
- **Service Layer**: Abstraction over API calls
- **Type Safety**: Comprehensive TypeScript interfaces