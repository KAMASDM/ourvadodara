# Our Vadodara News

A modern, real-time news application for Vadodara city built with React, Vite, and Firebase.

## Features

- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔥 **Real-time Data** - Firebase Realtime Database integration
- 🌙 **Dark Mode** - Light and dark theme support
- 🌍 **Multi-language** - Support for Gujarati and English
- 📊 **Interactive Widgets** - Weather, polls, trending topics, events
- 🎨 **Modern UI** - Clean design with TailwindCSS
- 🔔 **Push Notifications** - Real-time news updates
- 📖 **PWA Ready** - Progressive Web App capabilities

## Quick Start

### 1. Environment Setup

Copy the environment example file and add your Firebase configuration:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase project credentials:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Firebase Setup

Visit `http://localhost:5173/?setup=firebase` for guided Firebase setup.

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the frontend. See `.env.example` for required variables.

## Firebase Configuration

The app now uses environment variables for Firebase configuration instead of hardcoded values for better security.

### Required Firebase Services
- **Authentication** - For user login/signup
- **Realtime Database** - For storing news and user data

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
