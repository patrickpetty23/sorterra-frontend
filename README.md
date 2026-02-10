# Sorterra Frontend

React-based frontend for Sorterra, an AI-powered file management system for SharePoint.

## 🎨 Branding

**Color Palette:**
- Primary Blue: `#1E40AF`
- Accent Blue: `#3B82F6`
- Dark Sidebar: `#1E293B`
- Slate Background: `#F3F4F6`
- Text Gray: `#374151`
- Success Green: `#10B981`
- Warning Amber: `#F59E0B`
- Error Red: `#EF4444`

**Typography:**
- Primary: Inter (via Google Fonts)
- Weights: 400 (Regular), 500 (Medium), 600 (Semi-Bold), 700 (Bold)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
sorterra-frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx          # Login page
│   │   ├── Register.jsx       # Registration page
│   │   ├── Dashboard.jsx      # Main dashboard
│   │   ├── Auth.css           # Auth pages styles
│   │   └── Dashboard.css      # Dashboard styles
│   ├── App.jsx                # Main app component with routing
│   ├── index.css              # Global styles and CSS variables
│   └── main.jsx               # Entry point
├── index.html                 # HTML template
└── README.md
```

## 🎯 Current Features

### Authentication
- **Login Page** - Email/password authentication
- **Register Page** - New user registration with password confirmation

### Dashboard
- **Search Bar** - Natural language search with example queries
- **Recent Activity** - Live feed of file organization events
- **Smart Suggestions** - AI-generated recommendations for:
  - Duplicate file detection
  - Sensitive file alerts
  - Sorting recipe suggestions
- **Sidebar Navigation** - Dashboard, Recipes, Settings
- **Organization Badge** - Current connected SharePoint organization

## 🔗 API Integration

This frontend is designed to work with the [Sorterra API](https://github.com/szachbagley/sorterra-api).

**API Endpoints (to be integrated):**
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/activity` - Recent activity feed
- `GET /api/suggestions` - Smart suggestions
- `GET /api/search` - Document search

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **CSS Modules** - Scoped styling

## 📦 Dependencies

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^7.1.1",
  "lucide-react": "^0.469.0"
}
```

## 🎨 Design System

The UI follows the Sorterra brand guidelines:
- **Professional** - Clean layout, balanced contrast
- **Exciting** - Bright blue accents, subtle animations
- **Human** - Rounded corners, approachable neutrals

## 🚧 To-Do

### API Integration

Backend API base URL: `http://localhost:5001` (dev) or production URL

#### Health & System
- [ ] `GET /health` - Full health check with database status
- [ ] `GET /health/ready` - Readiness probe
- [ ] `GET /health/live` - Liveness probe

#### Authentication & Users
- [ ] `GET /api/users` - List all users
- [ ] `GET /api/users/{id}` - Get user by ID
- [ ] `POST /api/users` - Create user (register)
  - Body: `{ cognitoSub, email, displayName }`
- [ ] `PUT /api/users/{id}` - Update user profile
- [ ] `DELETE /api/users/{id}` - Delete user
- [ ] **TODO:** Wire up Login/Register pages to user endpoints
- [ ] **TODO:** Add JWT token storage (localStorage or secure cookie)
- [ ] **TODO:** Add authentication state management (Context API or Redux)

#### Organizations
- [ ] `GET /api/organizations` - List all organizations
- [ ] `GET /api/organizations/{id}` - Get organization by ID
- [ ] `POST /api/organizations` - Create organization
- [ ] `PUT /api/organizations/{id}` - Update organization
- [ ] `DELETE /api/organizations/{id}` - Delete organization
- [ ] **TODO:** Add organization selector in Dashboard sidebar

#### User-Organization Membership
- [ ] `GET /api/userorganizations` - List memberships
- [ ] `GET /api/userorganizations/{userId}/{orgId}` - Get specific membership
- [ ] `POST /api/userorganizations` - Add user to organization
- [ ] `PUT /api/userorganizations/{userId}/{orgId}` - Update role/permissions
- [ ] `DELETE /api/userorganizations/{userId}/{orgId}` - Remove user from org

#### SharePoint Connections
- [ ] `GET /api/sharepointconnections` - List all connections
- [ ] `GET /api/sharepointconnections/{id}` - Get connection by ID
- [ ] `POST /api/sharepointconnections` - Create SharePoint connection
  - Body: `{ organizationId, siteUrl, tenantId, driveId, connectionStatus, createdBy }`
- [ ] `PUT /api/sharepointconnections/{id}` - Update connection status
- [ ] `DELETE /api/sharepointconnections/{id}` - Delete connection
- [ ] **TODO:** Build SharePoint connection flow UI (OAuth redirect, site picker)
- [ ] **TODO:** Display connection status in Dashboard sidebar

#### Sorting Recipes
- [ ] `GET /api/sortingrecipes` - List all recipes (supports filters: `?organizationId`, `?isActive`, `?orderBy`)
- [ ] `GET /api/sortingrecipes/{id}` - Get recipe by ID
- [ ] `GET /api/sortingrecipes/by-connection/{connectionId}` - Get active recipes for a connection
- [ ] `POST /api/sortingrecipes` - Create sorting recipe
  - Body: `{ organizationId, name, description, fileTypePattern, destinationPathTemplate, isActive, priority, rules, createdBy }`
- [ ] `PUT /api/sortingrecipes/{id}` - Update recipe
- [ ] `DELETE /api/sortingrecipes/{id}` - Delete recipe
- [ ] **TODO:** Build Recipes page (CRUD interface for sorting rules)
- [ ] **TODO:** Add recipe priority drag-and-drop reordering

#### Processed Files
- [ ] `GET /api/processedfiles` - List all processed files
- [ ] `GET /api/processedfiles/{id}` - Get file by ID
- [ ] `POST /api/processedfiles` - Log processed file
- [ ] `PUT /api/processedfiles/{id}` - Update file status/classification
- [ ] `DELETE /api/processedfiles/{id}` - Delete file record
- [ ] **TODO:** Display processed files in Dashboard activity feed (connect to real data)

#### Activity Logs
- [ ] `GET /api/activitylogs` - List all activity logs
- [ ] `GET /api/activitylogs/{id}` - Get log by ID
- [ ] `POST /api/activitylogs` - Create activity log entry
- [ ] `PUT /api/activitylogs/{id}` - Update log
- [ ] `DELETE /api/activitylogs/{id}` - Delete log
- [ ] **TODO:** Replace hardcoded activity feed with real API data
- [ ] **TODO:** Add real-time updates (polling every 10s or WebSocket)

#### Search Queries
- [ ] `GET /api/searchqueries` - List search query history
- [ ] `GET /api/searchqueries/{id}` - Get query by ID
- [ ] `POST /api/searchqueries` - Log search query
  - Body: `{ organizationId, userId, queryText, queryEmbedding, resultsCount, latencyMs }`
- [ ] `PUT /api/searchqueries/{id}` - Update query results/clicks
- [ ] `DELETE /api/searchqueries/{id}` - Delete query record
- [ ] **TODO:** Wire up Dashboard search bar to backend
- [ ] **TODO:** Implement semantic search results display

#### OAuth Tokens
- [ ] `GET /api/oauthtokens` - List OAuth tokens (encrypted fields excluded)
- [ ] `GET /api/oauthtokens/{id}` - Get token by ID
- [ ] `POST /api/oauthtokens` - Store OAuth token
- [ ] `PUT /api/oauthtokens/{id}` - Update token
- [ ] `DELETE /api/oauthtokens/{id}` - Delete token
- [ ] **TODO:** Handle OAuth flow for SharePoint connections

#### Document Chunks (RAG)
- [ ] `GET /api/documentchunks` - List document chunks
- [ ] `GET /api/documentchunks/{id}` - Get chunk by ID
- [ ] `POST /api/documentchunks` - Create document chunk with embedding
- [ ] `PUT /api/documentchunks/{id}` - Update chunk
- [ ] `DELETE /api/documentchunks/{id}` - Delete chunk
- [ ] **TODO:** Display search results with highlighted chunks

#### Webhook Events
- [ ] `GET /api/webhookevents` - List webhook events (debugging/replay)
- [ ] `GET /api/webhookevents/{id}` - Get event by ID
- [ ] `POST /api/webhookevents` - Log webhook event
- [ ] `PUT /api/webhookevents/{id}` - Update event
- [ ] `DELETE /api/webhookevents/{id}` - Delete event

### Frontend Features
- [ ] Add API client setup (axios or fetch wrapper)
- [ ] Add loading states and error handling
- [ ] Add Recipes page (sorting rule management UI)
- [ ] Add Settings page (user/org configuration)
- [ ] Implement real-time activity updates (polling/WebSocket)
- [ ] Add responsive mobile design
- [ ] Add user profile dropdown
- [ ] Add logout functionality
- [ ] Add SharePoint OAuth connection flow
- [ ] Add "Smart Suggestions" backend integration (duplicate detection, sensitive files)
- [ ] Add toast notifications for success/error messages

## 👥 Team

- **Patrick Petty** - Frontend Developer
- **Zach Bagley** - Backend API & Authentication
- **McKay Boody** - Cloud Infrastructure & DevOps
- **Nate Shaw** - AI/ML (Classification)
- **Caleb Gooch** - AI/ML (Search & RAG)

## 📄 License

MISM Capstone Project
