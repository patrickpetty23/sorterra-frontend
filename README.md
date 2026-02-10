# Sorterra Frontend

React frontend for Sorterra - an AI-powered file management system for SharePoint.

## Features

- 🔐 **Authentication** - Login and registration pages
- 📊 **Dashboard** - Real-time activity feed and smart suggestions
- 🎨 **Modern UI** - Built with Tailwind CSS
- 🚀 **Fast** - Powered by Vite

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Project Structure

```
sorterra-frontend/
├── src/
│   ├── components/
│   │   └── DashboardLayout.jsx    # Main layout with sidebar
│   ├── pages/
│   │   ├── Login.jsx              # Login page
│   │   ├── Register.jsx           # Registration page
│   │   └── Dashboard.jsx          # Main dashboard
│   ├── App.jsx                    # Router configuration
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Tailwind imports
├── tailwind.config.js
├── vite.config.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/patrickpetty23/sorterra-frontend.git
   cd sorterra-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Design System

### Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#2196F3` | Buttons, links, accents |
| Sidebar Dark | `#2C3E50` | Sidebar background |
| Background | `#F9FAFB` | Page background |

### Components

- **Login/Register** - Full-page auth forms with centered cards
- **Dashboard Layout** - Sidebar navigation with main content area
- **Dashboard** - Search bar, recent activity feed, smart suggestions
- **Activity Cards** - Colored left border with timestamp
- **Suggestion Cards** - Icon-based alerts with action buttons

## API Integration

The frontend is designed to connect to the Sorterra API backend:

**Backend Repository:** [sorterra-api](https://github.com/szachbagley/sorterra-api)

**API Base URL (Development):** `http://localhost:5001`

### TODO: Connect to API

- [ ] Add API client (axios/fetch)
- [ ] Implement authentication flow with Cognito
- [ ] Connect dashboard to `/api/activitylogs` endpoint
- [ ] Connect suggestions to processing pipeline
- [ ] Add error handling and loading states

## Deployment

### Build for Production

```bash
npm run build
```

The `dist/` folder will contain the optimized production build.

### Deploy to AWS Amplify / Vercel / Netlify

This is a standard Vite React app and can be deployed to any static hosting service.

**Build Command:** `npm run build`  
**Output Directory:** `dist`

## Team

| Member | Role |
|--------|------|
| Patrick Petty | Frontend Developer |
| Zach Bagley | Backend API & Authentication |
| McKay Boody | Cloud Infrastructure & DevOps |
| Nate Shaw | AI/ML (Classification) |
| Caleb Gooch | AI/ML (Search & RAG) |

## License

Capstone project for MISM program.
