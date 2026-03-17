# API Integration Summary

## Authentication

Authentication uses **AWS Cognito** via `amazon-cognito-identity-js`. The full flow (registration with email verification, login, session restoration, logout, 401 auto-logout) is implemented in `AuthContext.jsx`.

**Cognito User Pool:** `us-east-1_d63e7X9x7`
**App Client ID:** `1ccr4hrojdp2kt96qohc2a05s5`

JWT tokens are stored in `localStorage` (`sorterra_token`) and attached to all API requests via the base HTTP client.

---

## API Service Modules

| Module | File | Endpoints |
|--------|------|-----------|
| `authApi` | `src/api/auth.js` | Cognito register, login, confirm, resend code, logout, restore session |
| `usersApi` | `src/api/users.js` | CRUD, lookup by Cognito sub |
| `organizationsApi` | `src/api/organizations.js` | CRUD |
| `userOrganizationsApi` | `src/api/userOrganizations.js` | CRUD, lookup by user ID |
| `recipesApi` | `src/api/recipes.js` | CRUD with filters (orgId, isActive, orderBy) |
| `sharePointConnectionsApi` | `src/api/sharePointConnections.js` | CRUD |
| `sharePointAuthApi` | `src/api/sharePointAuth.js` | Get admin consent URL for a connection |
| `sortApi` | `src/api/sort.js` | Trigger file sorting (POST) |
| `processedFilesApi` | `src/api/processedFiles.js` | CRUD |
| `activityApi` | `src/api/activity.js` | CRUD, recent by organization |
| `searchApi` | `src/api/search.js` | Search, history, update results, track clicks |

All modules use the centralized HTTP client (`src/api/client.js`) which handles auth headers, JSON parsing, and error mapping.

---

## Key Integration Points

### SharePoint Connection (Admin Consent Flow)

1. User clicks "Add Connection" in Settings
2. `ConnectionModal` collects site URL and source folder
3. On submit: creates connection via `sharePointConnectionsApi.create()` (status: `pending`)
4. Immediately calls `sharePointAuthApi.getConsentUrl(connectionId)` to get the Microsoft consent URL
5. Redirects browser to Microsoft (`window.location.href = consentUrl`)
6. Azure AD admin grants consent for Sorterra
7. Microsoft redirects to API callback → API captures tenant ID → redirects to `/settings?consent=success`
8. `Settings.jsx` reads query params, shows success toast, refreshes connections

### File Sorting

1. User clicks "Sort Now" on a connection card in Settings
2. `SortModal` opens — user selects a recipe and enters a folder path
3. Calls `sortApi.triggerSort(connectionId, recipeId, folderPath)`
4. Shows real-time progress, then displays per-file results (success/error)
5. Results are recorded as `ProcessedFile` records visible on the Files page

### Dashboard

- Stats cards call activity, recipe, and connection APIs for counts
- Activity feed calls `activityApi.getRecentByOrganization()`
- Semantic search records queries via `searchApi` (RAG backend integration pending)

---

## Environment Configuration

```bash
# Backend API base URL
VITE_API_BASE_URL=http://localhost:5001

# AWS Cognito
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
VITE_COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Connection Status Lifecycle

| Status | Meaning | Sort Now |
|--------|---------|----------|
| `pending` | Connection created, no consent yet | Disabled |
| `consented` | Admin consent granted, tenant ID captured | Enabled |
| `active` | Fully operational | Enabled |
| `connected` | Legacy status | Enabled |
| `error` | Something is wrong (see errorMessage) | Disabled |
