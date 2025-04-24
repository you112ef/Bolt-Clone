# Bolt

Bolt is an AI-powered web application builder that transforms user prompts into functional web applications.

## Project Structure

The project is organized using a modular architecture with clear separation of concerns between the Frontend and Backend:

### Backend Structure

```
Backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── environment.ts # Environment variables and configuration
│   │   └── index.ts       # Main application entry point
│   ├── routes/           # API route handlers
│   │   ├── chat.ts       # Chat API endpoint
│   │   └── template.ts   # Template API endpoint
│   ├── services/         # Business logic services
│   │   └── ai.service.ts # AI service for Gemini integration
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts      # Type definitions for the application
│   ├── defaults/         # Default templates
│   │   ├── node.ts       # Node.js project template
│   │   └── react.ts      # React project template
│   ├── prompts.ts        # AI prompts for system instructions
│   ├── constants.ts      # Application constants
│   ├── stripindents.ts   # Utility for string formatting
│   └── index.ts          # Main application entry point
```

### Frontend Structure

```
Frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── context/          # React context for state management
│   │   └── AppContext.tsx # Application context provider
│   ├── hooks/            # Custom React hooks
│   ├── pages/            # Application pages
│   │   ├── Home.tsx      # Landing page
│   │   └── Builder.tsx   # Website builder page
│   ├── services/         # Service modules
│   │   └── api.ts        # API service for backend communication
│   ├── styles/           # CSS and styling files
│   │   └── main.css      # Main CSS file
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── config.ts         # Application configuration
│   ├── steps.ts          # Step parsing logic
│   ├── main.tsx          # Main application entry point
│   └── App.tsx           # Root component
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install Backend dependencies
cd Backend
npm install

# Install Frontend dependencies
cd ../Frontend
npm install
```

3. Set up environment variables:
   - Create a `.env` file in the Backend directory with your Gemini API key:

```
GEMINI_API_KEY=your_api_key_here
```

### Running the Application

#### Backend

```bash
cd Backend
npm run start
```

#### Frontend

```bash
cd Frontend
npm run dev
```

## Features

- AI-powered website generation
- Interactive code editor
- Live preview
- Step-by-step guidance
- Project download capability
- WebContainer technology for browser-based execution

## Technologies Used

- Frontend: React, TypeScript, Tailwind CSS, Vite
- Backend: Node.js, Express, TypeScript
- AI: Google Gemini API
- WebContainer for browser-based execution 
