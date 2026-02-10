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

- [ ] Connect authentication to Cognito
- [ ] Integrate with backend API endpoints
- [ ] Add Recipes page (sorting rule management)
- [ ] Add Settings page (user/org configuration)
- [ ] Implement real-time activity updates (WebSocket/polling)
- [ ] Add loading states and error handling
- [ ] Add responsive mobile design
- [ ] Add user profile dropdown
- [ ] Add logout functionality
- [ ] Add SharePoint connection flow

## 👥 Team

- **Patrick Petty** - Frontend Developer
- **Zach Bagley** - Backend API & Authentication
- **McKay Boody** - Cloud Infrastructure & DevOps
- **Nate Shaw** - AI/ML (Classification)
- **Caleb Gooch** - AI/ML (Search & RAG)

## 📄 License

MISM Capstone Project
