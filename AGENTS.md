# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Commands

This project uses Bun as the JavaScript runtime and package manager. If you want to run any command with `node` or `npm`, ALWAYS use `bun` instead.

- **Development**: `bun dev` - Runs both frontend and backend concurrently using the custom dev script.
  Logs are written to `dev.log`, use this file or `bun logs` to view recent output.
- **Build**: `bun build` - Builds Next.js application for production
- **Code quality**:
  - `bun check` - Runs Biome checks (linting and formatting)
  - `bun fix` - Auto-fixes Biome issues
  - `bun format` - Formats code with Biome
  - `bun lint` - Runs both Biome and Turbo linting

## Project Architecture

This is a health context application (HealthCtx) built with:
- **Frontend**: Next.js 15 with React 19, Tailwind CSS, TypeScript
- **Backend**: Convex for database and server functions
- **Authentication**: Clerk for user management
- **AI**: Convex Agent with OpenAI GPT-4o integration
- **Package Manager**: Bun (specified in package.json)

### Key Components

**Frontend Structure**:
- `/app` - Next.js app router pages and components
- `/components` - Reusable React components including ConvexClientProvider
- Uses Clerk authentication middleware

**Backend Structure**:
- `/convex` - All Convex functions and schema
- `schema.ts` - Database schema
- Uses Clerk for authentication with user identity checks

### Important Convex Guidelines

Follow the comprehensive Convex rules in `.cursor/rules/convex_rules.mdc`:
- Always use new function syntax with validators for args and returns
- Use `ctx.auth.getUserIdentity()` for authentication
- Functions should be organized by type (public vs internal)
- Database queries should use indexes, not filters
- Actions require `"use node";` directive for Node.js modules

### AI Integration

The application uses Convex Agent for AI chat functionality:
- Thread-based conversations with user isolation
- OpenAI GPT-5 model integration
- Authentication checks ensure users only access their threads
- Pagination support for message history

### Code Quality

Uses Biome for linting and formatting with custom rules:
- 120 character line width
- Spaces for indentation
- Excludes generated files and build outputs
- Custom accessibility and style rule configurations

### Development Workflow

The custom dev script (`scripts/dev.sh`) manages:
- Parallel execution of frontend and backend servers
- Proper process management with cleanup
- Colored logging output for different services
- 7-second delay between backend and frontend startup
