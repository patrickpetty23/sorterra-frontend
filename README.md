# Sorterra Frontend

React-based frontend for **Sorterra**, an AI-powered file sorting and management system for SharePoint. Sorterra automatically classifies, organizes, and routes files using intelligent sorting recipes, semantic search, and activity tracking.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Authentication](#authentication)
- [API Integration](#api-integration)
- [Pages & Routes](#pages--routes)
- [Component Library](#component-library)
- [Styling & Design System](#styling--design-system)
- [Docker Deployment](#docker-deployment)
- [Team](#team)
- [License](#license)

## Features

- **AWS Cognito Authentication** — Email/password signup with email verification, JWT-based sessions, and automatic token management
- **Dashboard** — At-a-glance stats (files processed, active recipes, connected sites), recent activity feed, search history, and AI-powered smart suggestions
- **Sorting Recipes** — Full CRUD for file sorting rules with file type patterns, destination path templates (with variable substitution like `[Year]`, `[Month]`), priority ordering, and active/inactive toggling
- **Processed Files** — Browse all files handled by the system with status tracking, confidence scores, classified types, extracted metadata, and expandable detail rows
- **Settings** — User profile management, organization configuration with team member roles (Owner/Admin/Member), and SharePoint connection management
- **Semantic Search** — Natural language search bar with query history and example prompts
- **SharePoint Integration** — Connect and manage SharePoint sites with status monitoring and sync tracking

## Tech Stack

| Category        | Technology                                    |
| --------------- | --------------------------------------------- |
| Framework       | React 19, React Router 7                      |
| Build Tool      | Vite 7                                        |
| Styling         | Tailwind CSS 4, PostCSS, CSS Modules          |
| Authentication  | AWS Cognito (`amazon-cognito-identity-js`)    |
| Icons           | Lucide React                                  |
| State Mgmt      | React Context API (Auth, Organization, Toast) |
| Linting         | ESLint 9 with React Hooks plugin              |
| Containerization| Docker (Node 22 Alpine + Nginx 1.27 Alpine)   |

## Getting Started

### Prerequisites

- Node.js 18+ (22 recommended)
- npm
- Access to an AWS Cognito User Pool (for authentication)
- The [Sorterra API](https://github.com/szachbagley/sorterra-api) backend running locally or deployed

### Installation

```bash
# Clone the repository
git clone https://github.com/szachbagley/sorterra-frontend.git
cd sorterra-frontend

# Install dependencies
npm install

# Copy the environment config and fill in your values
cp .env.example .env
```

### Development

```bash
# Start the dev server (http://localhost:3000)
npm run dev

# Lint the codebase
npm run lint

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

## Project Structure

```
sorterra-frontend/
├── public/                        # Static assets
├── docker/
│   └── nginx.conf                 # Nginx config for SPA routing & caching
├── src/
│   ├── api/                       # API service layer
│   │   ├── client.js              # Base HTTP client (fetch wrapper, auth headers, error handling)
│   │   ├── auth.js                # Cognito authentication operations
│   │   ├── cognito.js             # Cognito User Pool SDK setup
│   │   ├── activity.js            # Activity log endpoints
│   │   ├── organizations.js       # Organization CRUD
│   │   ├── recipes.js             # Sorting recipe CRUD (with filters/ordering)
│   │   ├── users.js               # User management
│   │   ├── search.js              # Search queries & history
│   │   ├── processedFiles.js      # Processed file tracking
│   │   ├── userOrganizations.js   # User-organization membership
│   │   ├── sharePointConnections.js # SharePoint site connections
│   │   └── index.js               # Barrel exports
│   ├── components/                # Reusable UI components
│   │   ├── DashboardLayout.jsx    # Main app shell (sidebar, header, content area)
│   │   ├── ProtectedRoute.jsx     # Auth guard — redirects unauthenticated users
│   │   ├── RecipeModal.jsx        # Create/edit sorting recipe modal
│   │   ├── ConnectionModal.jsx    # Add SharePoint connection modal
│   │   ├── Toast.jsx              # Notification toasts (success/error/warning/info)
│   │   ├── ConfirmDialog.jsx      # Confirmation dialog for destructive actions
│   │   ├── EmptyState.jsx         # Placeholder for empty data states
│   │   ├── ErrorBoundary.jsx      # React error boundary with recovery
│   │   └── LoadingSpinner.jsx     # Full-page and inline loading indicators
│   ├── contexts/                  # React Context providers
│   │   ├── AuthContext.jsx        # Auth state, login/logout, session restoration
│   │   ├── OrgContext.jsx         # Current organization state
│   │   └── ToastContext.jsx       # Toast notification manager
│   ├── hooks/
│   │   └── useFocusTrap.js        # Accessible focus trapping for modals
│   ├── pages/                     # Route-level page components
│   │   ├── Login.jsx              # Email/password login via Cognito
│   │   ├── Register.jsx           # Two-step registration (signup + email verification)
│   │   ├── Dashboard.jsx          # Home — stats, activity feed, search, suggestions
│   │   ├── Recipes.jsx            # Sorting recipe management table
│   │   ├── Files.jsx              # Processed files list with expandable details
│   │   └── Settings.jsx           # Profile, organization, and connections config
│   ├── App.jsx                    # Route definitions with lazy loading
│   ├── main.jsx                   # React entry point
│   └── index.css                  # Global styles, CSS variables, Tailwind imports
├── Dockerfile                     # Multi-stage build (Node build → Nginx serve)
├── vite.config.js                 # Vite config (port 3000, code splitting)
├── tailwind.config.js             # Custom color palette and theme extensions
├── postcss.config.js              # Tailwind + Autoprefixer
├── eslint.config.js               # ESLint with React hooks rules
├── .env.example                   # Environment variable template
└── index.html                     # HTML entry point (includes Cognito polyfill)
```

## Environment Variables

Create a `.env` file in the project root (see `.env.example`):

```bash
# Backend API base URL
VITE_API_BASE_URL=http://localhost:5001

# AWS Cognito configuration
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

All `VITE_*` variables are embedded at build time by Vite and accessible via `import.meta.env`.

## Authentication

Authentication is handled entirely through **AWS Cognito** using the `amazon-cognito-identity-js` SDK.

### Flow

1. **Registration** — User signs up with email, display name, and password. Cognito sends a verification code via email. After verification, the user is automatically logged in and a corresponding record is created in the backend database.
2. **Login** — Cognito authenticates the user and returns a JWT ID token, which is stored in `localStorage` as `sorterra_token`.
3. **Session Restoration** — On app load, `AuthContext` checks for an existing Cognito session and restores it automatically.
4. **Logout** — Clears Cognito session and removes stored tokens/user data.
5. **401 Handling** — If the API returns a 401 (expired/invalid token), the user is automatically logged out and redirected to `/login`.

### Token Storage

| Key              | Value                              |
| ---------------- | ---------------------------------- |
| `sorterra_token` | JWT ID token from Cognito          |
| `sorterra_user`  | Cached user data (sub, email, name)|

## API Integration

The frontend communicates with the Sorterra API through a centralized HTTP client (`src/api/client.js`).

### Base Client

- Built on the Fetch API with automatic JSON parsing
- Attaches `Authorization: Bearer <token>` to all requests
- Returns user-friendly error messages for common HTTP status codes (400, 401, 403, 404, 409, 422, 429, 500, 502, 503)
- Handles network errors and 204 No Content responses
- Configurable 401 callback for automatic logout

### Service Modules

| Module                     | Resource                  | Operations                                     |
| -------------------------- | ------------------------- | ---------------------------------------------- |
| `authApi`                  | Authentication            | login, register, confirm, resend code, logout  |
| `usersApi`                 | Users                     | CRUD, lookup by Cognito sub                    |
| `organizationsApi`         | Organizations             | CRUD                                           |
| `userOrganizationsApi`     | Memberships               | CRUD, lookup by user ID                        |
| `recipesApi`               | Sorting Recipes           | CRUD with filters (orgId, isActive, orderBy)   |
| `sharePointConnectionsApi` | SharePoint Connections    | CRUD                                           |
| `processedFilesApi`        | Processed Files           | CRUD                                           |
| `activityApi`              | Activity Logs             | CRUD, recent by organization                   |
| `searchApi`                | Search Queries            | search, history, update results, track clicks  |

All endpoints are prefixed with `/api/` and target the base URL defined by `VITE_API_BASE_URL`.

## Pages & Routes

| Path          | Component      | Auth Required | Description                                           |
| ------------- | -------------- | ------------- | ----------------------------------------------------- |
| `/`           | —              | No            | Redirects to `/login`                                 |
| `/login`      | `Login`        | No            | Email/password authentication                         |
| `/register`   | `Register`     | No            | Two-step signup with email verification               |
| `/dashboard`  | `Dashboard`    | Yes           | Home — stats cards, activity feed, search, suggestions|
| `/recipes`    | `Recipes`      | Yes           | Sorting recipe table with CRUD, filtering, and search |
| `/files`      | `Files`        | Yes           | Processed files list with expandable metadata details |
| `/settings`   | `Settings`     | Yes           | Profile, organization members, SharePoint connections |

All authenticated routes are wrapped in `ProtectedRoute`, which redirects to `/login` if no valid session exists. Pages are lazy-loaded with `React.lazy()` and `Suspense` for optimal bundle splitting.

## Component Library

### Layout
- **`DashboardLayout`** — Sidebar navigation with collapsible menu, header with user info, and main content area

### Modals & Dialogs
- **`RecipeModal`** — Form for creating/editing sorting recipes with template variable insertion buttons (`[Year]`, `[Month]`, `[Day]`, `[Type]`, `[Department]`) and live path preview
- **`ConnectionModal`** — Form for adding new SharePoint connections (site URL, tenant ID, source folder)
- **`ConfirmDialog`** — Generic confirmation dialog for destructive actions (delete recipe, remove member, etc.)

### Feedback
- **`Toast`** — Stackable notifications with auto-dismiss, managed via `ToastContext` (success, error, warning, info variants)
- **`LoadingSpinner`** — Full-page overlay or inline spinner with optional message
- **`EmptyState`** — Illustrated placeholder with optional call-to-action button
- **`ErrorBoundary`** — Catches render errors with a recovery UI

### Accessibility
- Focus trapping in modals (`useFocusTrap` hook)
- ARIA labels, roles, and attributes throughout
- Keyboard navigation (Escape to close modals)
- Semantic HTML elements

## Styling & Design System

### Approach
- **Tailwind CSS 4** for utility-first styling
- **CSS Modules** (component-scoped `.css` files) for complex component styles
- **CSS Custom Properties** for theme tokens

### Color Palette

| Token          | Value     | Usage                     |
| -------------- | --------- | ------------------------- |
| Primary Blue   | `#2196F3` | Buttons, links, accents   |
| Sidebar Dark   | `#2C3E50` | Sidebar background        |
| Sidebar Hover  | `#34495E` | Sidebar hover states      |
| Sidebar Deep   | `#1A252F` | Sidebar active/dark areas |
| Success Green  | `#10B981` | Success states, completed |
| Warning Amber  | `#F59E0B` | Warnings, pending states  |
| Error Red      | `#EF4444` | Errors, failed states     |

### Typography
- **Font:** Inter (Google Fonts) — weights 400, 500, 600, 700
- Clean, professional aesthetic with rounded corners and subtle box shadows

### UI Patterns
- Skeleton loaders during data fetching
- Animated modals and toast notifications
- Color-coded status badges and activity type indicators
- Responsive layouts with flexbox and CSS grid

## Docker Deployment

The project includes a multi-stage Dockerfile for production deployment.

### Build & Run

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.sorterra.example.com \
  --build-arg VITE_COGNITO_REGION=us-east-1 \
  --build-arg VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX \
  --build-arg VITE_COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx \
  -t sorterra-frontend .

docker run -p 80:80 sorterra-frontend
```

### How It Works

1. **Build stage** (`node:22-alpine`) — Installs dependencies with `npm ci`, injects `VITE_*` environment variables as build args, and runs `npm run build` to produce static assets in `/dist`
2. **Serve stage** (`nginx:1.27-alpine`) — Copies the built assets into Nginx's web root with a custom config that handles SPA routing (all paths fall back to `index.html`)

### Nginx Features
- SPA routing via `try_files` fallback
- 1-year cache headers for content-hashed assets (JS, CSS, fonts, images)
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`)
- Built-in healthcheck (`wget http://localhost/`)

## Team

- **Patrick Petty** — Frontend Developer
- **Zach Bagley** — Backend API & Authentication
- **McKay Boody** — Cloud Infrastructure & DevOps
- **Nate Shaw** — AI/ML (Classification)
- **Caleb Gooch** — AI/ML (Search & RAG)

## License

MISM Capstone Project
