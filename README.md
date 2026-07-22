# DevChat

A production-ready, real-time chat application built with modern web technologies.

## Tech Stack

| Layer        | Technology                          |
|-------------|--------------------------------------|
| Frontend    | Next.js 15 (App Router), Tailwind CSS v4, Zustand |
| Backend     | Node.js, Express, Socket.io         |
| Database    | PostgreSQL + Prisma ORM             |
| Cache/PubSub| Redis (sessions + Socket.io adapter)|

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Next.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Zustand   │  │ REST API │  │ Socket.io Client  │  │
│  │ Stores    │  │ (fetch)  │  │ (real-time)       │  │
│  └──────────┘  └────┬─────┘  └────────┬──────────┘  │
└──────────────────────┼────────────────┼──────────────┘
                       │   HttpOnly     │  WebSocket
                       │   Cookies      │  (JWT auth)
┌──────────────────────┼────────────────┼──────────────┐
│                  Server (Express)                     │
│  ┌──────────┐  ┌────┴─────┐  ┌────────┴──────────┐  │
│  │ Auth MW  │  │ REST     │  │ Socket.io Server  │  │
│  │ (JWT)    │  │ Routes   │  │ + Redis Adapter   │  │
│  └──────────┘  └────┬─────┘  └────────┬──────────┘  │
└──────────────────────┼────────────────┼──────────────┘
                       │                │
          ┌────────────┴──┐    ┌────────┴───────┐
          │  PostgreSQL   │    │     Redis      │
          │  (Prisma ORM) │    │  (PubSub +     │
          │               │    │   Sessions)    │
          └───────────────┘    └────────────────┘
```

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL + Redis)

## Quick Start

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your JWT_SECRET (generate a random string)
```

### 3. Set Up the Server

```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Server runs at `http://localhost:4000`.

### 4. Set Up the Client

```bash
cd client
npm install
npm run dev
```

Client runs at `http://localhost:3000`.

## Project Structure

```
DevChat/
├── server/                 # Express + Socket.io backend
│   ├── prisma/             # Database schema
│   ├── src/
│   │   ├── config/         # Environment configuration
│   │   ├── lib/            # Prisma & Redis clients
│   │   ├── middleware/     # Auth & error handling
│   │   ├── routes/         # REST API routes
│   │   ├── services/       # Business logic
│   │   └── socket/         # Real-time event handlers
│   └── package.json
│
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # UI components
│   │   ├── lib/            # API & Socket clients
│   │   └── stores/         # Zustand state management
│   └── package.json
│
├── docker-compose.yml      # PostgreSQL + Redis
└── .env.example            # Environment template
```

## Features

- **JWT Authentication** — Secure token storage in HttpOnly cookies
- **Real-Time Messaging** — Socket.io with Redis adapter for horizontal scaling
- **Optimistic Updates** — Instant UI feedback with server reconciliation
- **Cursor-Based Pagination** — Efficient message history loading
- **Connection Resilience** — Auto-reconnect with exponential backoff
- **Typing Indicators** — Real-time typing status broadcasts
- **Room Management** — Create and join chat rooms (Direct & Group)

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT stored in HttpOnly, Secure, SameSite cookies (XSS-immune)
- CORS configured with explicit origin allowlist
- Helmet.js for HTTP security headers
- Input validation on all endpoints
