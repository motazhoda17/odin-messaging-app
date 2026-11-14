# Chatter – Odin Messaging App

A full-stack messaging app built for [The Odin Project – Messaging App](https://www.theodinproject.com/lessons/nodejs-messaging-app) lesson (Full Stack JavaScript path).

Users can sign up, log in (or try it as a guest), message other users one-on-one or in group chats, see who is online, and customize their profile.

- **Front end:** React + Vite + React Router (`client/`)
- **Back end:** Express 5 REST API + Prisma 7 ORM + PostgreSQL (`server/`)
- **Auth:** JSON Web Tokens (JWT) with passwords hashed by bcrypt

## Features

- Sign up / log in with username + password (JWT stored in `localStorage`)
- **"Try it as a guest"** button so recruiters can look around without an account
- Send direct messages to any other user
- Inbox sorted by most recent activity, with last-message preview
- New messages appear automatically (the client polls the API every few seconds – see "Why polling?")
- **Extra credit:** group chats (tick 2+ people on the People page and give the group a name)
- **Extra credit:** online status – a green dot shows users active in the last 2 minutes
- Edit your profile: display name, bio and avatar image URL (with live preview)
- View other users' profiles
- Responsive: on phones the chat list and the open chat are shown one at a time

## Project structure

```
client/                 React app (Vite)
  src/api.js            fetch wrapper that adds the JWT
  src/auth/             AuthContext (who is logged in)
  src/pages/            one component per screen
  src/components/       Avatar, Layout, ProtectedRoute, ...
server/                 Express API
  app.js                entry point, mounts the routers
  routes/               URL -> controller mapping
  controllers/          the request handlers
  middleware/           requireAuth (JWT check), validation helper
  prisma/schema.prisma  database models
  prisma/migrations/    SQL migrations
  prisma/seed.js        demo data
```

## API overview

All routes start with `/api`. Routes marked 🔒 need an `Authorization: Bearer <token>` header.

| Method | Route | What it does |
| ------ | ----- | ------------ |
| POST | `/auth/signup` | Create account → `{ token, user }` |
| POST | `/auth/login` | Log in → `{ token, user }` |
| POST | `/auth/guest` | Log in as the shared guest user |
| GET 🔒 | `/users` | All other users (with `isOnline`) |
| GET 🔒 | `/users/me` | The logged-in user |
| PUT 🔒 | `/users/me` | Update `displayName`, `bio`, `avatarUrl` |
| GET 🔒 | `/users/:id` | One user's public profile |
| GET 🔒 | `/conversations` | My conversations, newest first |
| POST 🔒 | `/conversations` | `{ userIds: [id] }` for a DM, `{ userIds: [a, b], name }` for a group |
| GET 🔒 | `/conversations/:id` | One conversation (members only) |
| GET 🔒 | `/conversations/:id/messages?after=<id>` | Messages, optionally only newer than `after` |
| POST 🔒 | `/conversations/:id/messages` | Send `{ content }` |

## Running it locally

You need **Node.js 20+** and **PostgreSQL**.

### 1. Create a database

```bash
psql postgres
CREATE ROLE chatter WITH LOGIN PASSWORD 'choose-a-password' CREATEDB;
CREATE DATABASE messaging_app OWNER chatter;
\q
```

(`CREATEDB` lets `prisma migrate dev` create its temporary "shadow" database.)

### 2. Set up the API

```bash
cd server
cp .env.example .env      # then edit .env (see below)
npm install               # also runs `prisma generate`
npx prisma migrate dev    # creates the tables
npm run seed              # optional: demo users + chats (password: password123)
npm run dev               # API on http://localhost:3000
```

`server/.env` values:

| Variable | Example | Notes |
| -------- | ------- | ----- |
| `DATABASE_URL` | `postgresql://chatter:choose-a-password@localhost:5432/messaging_app` | your database |
| `JWT_SECRET` | a long random string | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `PORT` | `3000` | |
| `CLIENT_ORIGIN` | `http://localhost:5173` | where the React app runs (CORS) |

### 3. Start the React app

In a second terminal:

```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

In development Vite forwards every `/api/...` request to `localhost:3000` (see `vite.config.js`), so `client/.env` is not needed.

## Deployment notes

The API and the front end are deployed separately.

**Database + API** (e.g. Render, Railway, Koyeb):

1. Create a hosted PostgreSQL database (Neon, Supabase, Render, Railway...) and copy its connection string.
2. Deploy the `server/` folder as a Node web service.
   - Build command: `npm install && npx prisma migrate deploy`
   - Start command: `npm start`
   - Environment variables: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_ORIGIN` (your front-end URL, e.g. `https://chatter.netlify.app`)
3. Optionally run `npm run seed` once (from the host's shell) so the guest account has demo chats.

**Front end** (e.g. Netlify, Vercel, Cloudflare Pages):

- Base directory: `client`, build command: `npm run build`, publish directory: `client/dist`
- Environment variable: `VITE_API_URL=https://your-api.onrender.com`
- `client/public/_redirects` makes Netlify serve `index.html` for every route so React Router links work after a refresh.

## Why polling?

A REST API only answers requests, so it can't "push" a new message to the other person. As the lesson says, real-time tools (WebSockets / Socket.IO) are out of scope, so the client simply asks for new messages every 3 seconds (`?after=<lastMessageId>` keeps each request tiny).

## What I practiced

- Designing a relational data model with a many-to-many join table (`ConversationMember`)
- Prisma 7 with the `@prisma/adapter-pg` driver adapter and `prisma.config.js`
- Stateless authentication with JWTs and bcrypt password hashing
- Protecting API routes with middleware and making sure users can only read their own chats
- Validating input with express-validator and showing errors in React
- React Router nested routes, `<Outlet>` context and protected routes
- Keeping UI in sync with the server by polling, and cleaning up timers in `useEffect`
- Splitting a project into a separately deployed API and front end (CORS, env vars)
