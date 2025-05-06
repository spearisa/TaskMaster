# Architecture Documentation

## Overview

Appmo is an AI-powered task management platform that combines traditional task management capabilities with advanced AI features. The application enables users to create, manage, and delegate tasks, use AI-generated suggestions for productivity, and participate in a task marketplace where users can bid on tasks. The system includes a mobile app alongside the web interface, and integrates with various third-party services such as OpenAI, Anthropic, Stripe, and Zoom.

## System Architecture

Appmo follows a modern full-stack JavaScript/TypeScript architecture with a clear separation between client and server components.

### High-Level Components

1. **Frontend**: React-based web application using modern React patterns and Tailwind CSS
2. **Backend**: Node.js Express server providing RESTful APIs
3. **Database**: PostgreSQL database accessed via Drizzle ORM
4. **Mobile App**: React Native application for iOS and Android
5. **Authentication**: Custom session-based authentication system
6. **AI Integration**: Connections to OpenAI and Anthropic for AI-powered features
7. **Payment Processing**: Stripe integration for marketplace transactions
8. **Communication**: WebSocket for real-time messaging and notifications

### Architecture Diagram (Conceptual)

```
┌─────────────────┐        ┌───────────────────┐      ┌───────────────────┐
│   Client Side   │        │    Server Side    │      │   External APIs   │
│                 │        │                   │      │                   │
│  - React UI     │◄─────► │  - Express APIs   │◄────►│  - OpenAI/Claude  │
│  - React Query  │        │  - WebSockets     │      │  - Stripe         │
│  - Mobile App   │        │  - Authentication │      │  - SendGrid       │
└─────────────────┘        └─────────┬─────────┘      │  - Zoom           │
                                     │                 │  - Hugging Face   │
                                     ▼                 └───────────────────┘
                           ┌───────────────────┐
                           │     Database      │
                           │                   │
                           │  - PostgreSQL     │
                           │  - Drizzle ORM    │
                           └───────────────────┘
```

## Key Components

### Frontend Architecture

The frontend is built using React and TypeScript with a component-based architecture:

1. **UI Framework**: Uses Radix UI components with Tailwind CSS for styling
2. **State Management**: TanStack React Query for server state and local React state for UI
3. **Routing**: Uses Wouter for lightweight client-side routing
4. **Internationalization**: Supports multiple languages via i18n
5. **UI Components**: Structured using a combination of page components and reusable UI components

Key files:
- `client/src/App.tsx`: Main application component defining routes
- `client/src/hooks/use-auth.tsx`: Authentication hook for session management
- Client-side pages are organized in `client/src/pages/`

### Backend Architecture

The backend is built with Node.js and Express:

1. **API Endpoints**: RESTful API endpoints organized by functionality
2. **Database Access**: Drizzle ORM for type-safe database access
3. **Authentication**: Custom authentication middleware using Express sessions
4. **WebSockets**: Real-time communication for chat functionality
5. **AI Services**: Integration with OpenAI and Anthropic APIs

Key files:
- `server/index.ts`: Server entry point
- `server/routes.ts`: API route definitions
- `server/auth.ts`: Authentication logic
- `server/db.ts`: Database connection and configuration
- `server/openai-service.ts`: OpenAI integration for AI features

### Database Schema

The database uses a PostgreSQL schema with the following main tables:

1. **users**: User accounts and profile information
2. **tasks**: Task details, assignments, and metadata
3. **task_templates**: Reusable task templates
4. **task_bids**: Marketplace bidding on tasks
5. **direct_messages**: User-to-user messaging
6. **conversations**: Grouping of direct messages
7. **app_listings**: Marketplace application listings
8. **api_keys**: API access tokens for programmatic access

Key schema file: `shared/schema.ts`

### Mobile Application

The mobile app is built with React Native:

1. **Navigation**: React Navigation for screen management
2. **State Management**: React Query for data fetching and caching
3. **Authentication**: Shared authentication logic with the web app
4. **Offline Support**: Local data caching for offline access
5. **Push Notifications**: Native notifications for task reminders

Key files:
- `mobile/TaskManagerApp/App.tsx`: Mobile app entry point
- `mobile/TaskManagerApp/src/navigation/RootNavigator.tsx`: Screen navigation
- `mobile/TaskManagerApp/src/hooks/useAuth.tsx`: Mobile auth integration

## Data Flow

### Authentication Flow

1. User submits credentials (username/password)
2. Server validates credentials and creates a session
3. Session ID is stored in a cookie
4. Subsequent requests include the cookie for authentication
5. Protected routes check session validity through middleware

### Task Management Flow

1. User creates a task through the UI
2. Frontend sends task data to the API
3. Server validates and stores the task in the database
4. Real-time updates are sent to connected clients via WebSockets
5. Tasks can be filtered, sorted, and organized in various views

### AI Assistant Flow

1. User requests AI suggestions or delegates a task
2. Server formats the request and calls OpenAI/Claude API
3. AI response is processed and formatted
4. Results are returned to the frontend for display
5. User can act on suggestions or further refine requests

### Marketplace Flow

1. Users can publish tasks with budgets and accept bids
2. Other users can browse public tasks and submit bids
3. Task owners can select winning bids
4. Payment is processed through Stripe integration
5. Task ownership/assignment is updated accordingly

## External Dependencies

### AI Services

- **OpenAI API**: Used for task suggestions, content generation, and AI delegation
- **Anthropic Claude API**: Alternative AI model for certain tasks
- **Hugging Face API**: Provides access to ML models for specialized AI features

### Payment Processing

- **Stripe**: Handles secure payment processing for marketplace transactions

### Communication

- **SendGrid**: Email notifications for task updates and reminders
- **Zoom API**: Integration for scheduling and joining video meetings for tasks

### Development and Deployment

- **Vite**: Frontend build tool and development server
- **Drizzle ORM**: Database access and migration management
- **Replit**: Deployment and hosting platform

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

1. **Build Process**:
   - Frontend: Vite builds static files for production
   - Backend: ESBuild compiles TypeScript server code
   - Combined build artifacts are deployed together

2. **Database**:
   - PostgreSQL database provisioned through Replit
   - Drizzle manages schema migrations

3. **Environment Configuration**:
   - Environment variables for API keys and service credentials
   - Different configurations for development and production

4. **Scaling Strategy**:
   - Configured for autoscaling through Replit deployment settings
   - Defined port configurations for multi-service deployment

5. **Mobile Deployment**:
   - Mobile app built separately using Expo and EAS
   - Distribution through App Store and Google Play

## Security Considerations

1. **Authentication**: Session-based authentication with secure cookie handling
2. **Data Protection**: Server-side validation for all inputs
3. **API Security**: Protected routes require authentication
4. **Payment Security**: Stripe handles payment information, not stored locally
5. **Admin Features**: Separate authentication for administrative functions

## Future Architecture Considerations

1. **Scalability**: Current design supports moderate scale, but may need adjustment for high traffic
2. **Microservices**: Consider splitting into separate services for distinct functions (AI, marketplace, etc.)
3. **Caching**: Add Redis or similar for improved performance under load
4. **Infrastructure as Code**: Implement deployment automation for consistency
5. **Analytics**: Add dedicated analytics service for usage tracking and metrics