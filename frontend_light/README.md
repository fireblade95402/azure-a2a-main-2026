# A2A Light Frontend

A super lightweight, fully responsive frontend for the A2A platform. Designed to work seamlessly on any device - from mobile phones to desktop computers.

## Features

- 🔐 **Authentication** - Secure login with JWT tokens
- 📱 **Fully Responsive** - Works on any screen size
- 🚀 **Lightweight** - Minimal dependencies for fast loading
- 🌓 **Dark Mode** - Automatic dark mode support
- 📊 **Workflows Tab** - View your saved workflows
- 🤖 **Agents Tab** - See online and offline agents

## Quick Start

### Prerequisites

- Node.js 18+ 
- Backend running on `http://localhost:12000`

### Installation

```bash
cd frontend_light
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### Production Build

```bash
npm run build
npm start
```

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_A2A_API_URL=http://localhost:12000
```

### Default Test Credentials

- Email: `test@example.com`
- Password: `test123`

Or:
- Email: `simon@example.com`  
- Password: `simon123`

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **No additional UI libraries** - Pure Tailwind for minimal bundle size

## Project Structure

```
frontend_light/
├── app/
│   ├── globals.css       # Global styles with Tailwind
│   ├── layout.tsx        # Root layout with metadata
│   └── page.tsx          # Main page component
├── components/
│   ├── LoginForm.tsx     # Login form component
│   ├── Dashboard.tsx     # Main dashboard with tabs
│   ├── WorkflowCard.tsx  # Workflow display card
│   └── AgentCard.tsx     # Agent display card
├── lib/
│   └── api.ts            # API client functions
└── public/
    └── manifest.json     # PWA manifest
```

## Mobile Support

The UI is optimized for mobile devices:

- Touch-friendly tap targets
- Safe area insets for notched devices
- Responsive typography and spacing
- Swipe-friendly layouts
- Bottom indicator for quick stats

## API Endpoints Used

- `POST /api/auth/login` - User authentication
- `GET /api/workflows` - Get user workflows
- `GET /agents` - Get agent registry with health status
