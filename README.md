# Welcome to React Router!

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## 📁 Folder Structure

```
app/
  components/   # Reusable UI components (buttons, cards, etc.)
  pages/        # Top-level pages/views (Home, Dashboard, etc.)
  services/     # API calls and data-fetching logic
  mock/         # Mock/sample data for development
  routes/       # Route definitions and route-based components
  welcome/      # Welcome page assets (logos, etc.)
  app.css       # Global styles
  root.tsx      # Main app entry/root component
  routes.ts     # Route configuration
public/         # Static assets (favicon, etc.)
```

- `components/`: Place for all reusable UI components.
- `pages/`: Main pages/views for each route.
- `services/`: API service layer (mocked for now).
- `mock/`: Sample/mock data for development before backend integration.
- `routes/`: Route definitions and route-based components.
- `welcome/`: Assets for the welcome page (logos, etc.).
- `app.css`: Global CSS (Tailwind, etc.).
- `root.tsx`: Main app entry/root component.
- `routes.ts`: Route configuration.
- `public/`: Static assets (favicon, etc.).

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.
