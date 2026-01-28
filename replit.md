# CHRONOS - Luxury Watch Inventory Management System

## Overview

CHRONOS is a high-performance, desktop-optimized internal CRM and Inventory Management system designed for luxury watch-flipping businesses. The application enables dealers to track watches from acquisition to sale, monitor profit margins, manage client relationships, and analyze business performance through comprehensive dashboards and analytics.

The system is built as a full-stack TypeScript application with a React frontend and Express backend, using PostgreSQL for data persistence and Replit Auth for authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state, local React state for UI
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style variant)
- **Build Tool**: Vite with hot module replacement

The frontend follows a page-based architecture with reusable components. Protected routes require authentication through the `useAuth` hook, and unauthenticated users are redirected to a landing page.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schema validation
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Replit Auth integration using OpenID Connect with Passport.js
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple

API routes are organized by resource (clients, inventory, expenses, dashboard) and all require authentication. The storage layer (`server/storage.ts`) abstracts database operations through an interface pattern.

### Data Storage
- **Database**: PostgreSQL (required via DATABASE_URL environment variable)
- **Schema Location**: `shared/schema.ts` for business entities, `shared/models/auth.ts` for auth tables
- **Migrations**: Managed via Drizzle Kit (`drizzle-kit push`)

Core entities:
- **Clients**: Buyers and dealers with contact info, VIP status, notes
- **Inventory**: Watches with full tracking (brand, model, reference number, purchase/sale prices, condition, status)
- **Expenses**: Costs associated with inventory items (shipping, servicing, authentication)
- **Sessions/Users**: Replit Auth managed tables (mandatory, do not modify)

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts`: Drizzle table definitions and Zod validation schemas
- `routes.ts`: API route definitions with path, method, input/output schemas
- `models/auth.ts`: Authentication-related database models

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Authentication
- **Replit Auth**: OpenID Connect authentication flow
- **Passport.js**: Authentication middleware
- **express-session**: Session management with PostgreSQL store

### Frontend Libraries
- **shadcn/ui**: Pre-built accessible UI components (Radix UI primitives)
- **TanStack React Query**: Data fetching and caching
- **date-fns**: Date formatting and manipulation
- **Recharts**: Financial charts and data visualization (per requirements)
- **Lucide React**: Icon library

### Build & Development
- **Vite**: Frontend build tool with React plugin
- **esbuild**: Server bundling for production
- **TypeScript**: Full-stack type safety

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `ISSUER_URL`: Replit Auth OIDC issuer (defaults to https://replit.com/oidc)
- `REPL_ID`: Automatically provided by Replit environment