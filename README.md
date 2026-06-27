# Vidlik Web

Vidlik Web is the official web application for the Vidlik community project. The application helps Ukrainians in Denmark discover community events, register for activities, and interact with the Vidlik initiative through a modern web interface.

The project is built as a full stack Next.js application with PostgreSQL data storage, Prisma ORM, custom authentication, event management, event registration, and an interactive map experience.

## Screenshot
![Vidlik Web Screenshot](./screenshot.png)

## Project Overview

Vidlik Web provides a public community website and a backend API for managing the core data of the platform.

Main goals:

1. Present the Vidlik initiative to visitors.
2. Show upcoming and past community events.
3. Display event locations on an interactive map.
4. Allow users to create accounts and sign in.
5. Support email verification for registered users.
6. Allow users to register for events.
7. Track event capacity and available seats.
8. Provide admin protected event management.
9. Keep the application ready for deployment on modern hosting platforms.

## Application Modules

1. Includes the landing page, navigation, informational sections, event list, map, join section, and footer.

2. Authentication: registration, login, logout, current session lookup, password hashing, signed session cookies, and email verification.

3. Event listing, event creation, event update, event deletion, location data, geocoding, event capacity, and available seats logic.

4. Event registrations: registration requests, confirmation tokens, duplicate registration protection, and available seats validation.

5. Admin access: role based checks for protected event management routes.

6. Security headers, origin validation, and rate limiting for sensitive API routes.

7. Database layer: Prisma Client with PostgreSQL or Supabase.

8. Testing layer: uses Playwright for end to end authentication tests.

## Technology Stack

Runtime and framework:

1. Node.js
2. Next.js `16.0.3`
3. React `19.2.0`
4. React DOM `19.2.0`
5. TypeScript `5`

Styling and UI:

1. Tailwind CSS `4.1.17`
2. PostCSS `8.5.6`
3. Framer Motion `12.23.24`
4. Lucide React `0.553.0`

Maps and location:

1. Leaflet `1.9.4`
2. React Leaflet `5.0.0`
3. Custom geocoding helper in `lib/geocode.ts`

Database and ORM:

1. PostgreSQL
2. Supabase compatible connection
3. Prisma `7.0.1`
4. Prisma Client `7.0.1`
5. Prisma PostgreSQL adapter `7.1.0`
6. pg `8.16.3`

Authentication and security:

1. bcryptjs `3.0.3`
2. Custom signed session token
3. HTTP only auth cookie
4. Role based access control
5. Security headers in `proxy.ts`
6. Rate limiting in `lib/security.ts`

Email:

1. Resend API
2. Custom email verification token flow

Testing and quality:

1. Playwright `1.56.1`
2. ESLint `9`
3. eslint config next `16.0.3`
4. TypeScript compiler checks

Development utilities:

1. dotenv `17.2.3`
2. cross env `10.1.0`

## Project Structure

## Database Schema

The application uses the following Prisma models:

1. `User`

   Stores user accounts, email, name, password hash, role, points balance, and email verification fields.

2. `Event`

   Stores event content, date, location, coordinates, category, tags, capacity, available seats, and active state.

3. `EventRegistration`

   Stores event registrations and confirmation status.

4. `EventRegistrationRequest`

   Stores pending registration confirmation requests.

5. `Task`

   Stores community tasks that can award points.

6. `UserTask`

   Stores completed tasks for users.

7. `PointsTransaction`

   Stores points history connected to users, tasks, or events.

## Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/postgres?sslmode=require"
AUTH_SECRET="long-random-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
RESEND_API_KEY=""
RESEND_FROM="Vidlik <no-reply@example.com>"
```

Required variables:

1. `DATABASE_URL`

   PostgreSQL or Supabase connection string.

2. `AUTH_SECRET`

   Secret used to sign session tokens.

Optional variables:

1. `NEXT_PUBLIC_APP_URL`

   Public application URL used for verification links.

2. `APP_URL`

   Server side application URL fallback.

3. `RESEND_API_KEY`

   Resend API key for sending verification emails.

4. `RESEND_FROM`

   Sender address for verification emails.

If `RESEND_API_KEY` is not configured, the verification link is printed to the server logs.

Never commit `.env` and never publish real database passwords.

## Local Development

Install dependencies.

```bash
npm install
```

Generate Prisma Client.

```bash
npx prisma generate
```

Start the development server.

```bash
npm run dev
```

Open the application.

```text
http://localhost:3000
```

Authentication:

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `POST /api/auth/logout`
4. `GET /api/auth/me`
5. `GET /api/auth/verify?token=...`

Events:

1. `GET /api/events`
2. `POST /api/events`
3. `PATCH /api/events/:id`
4. `DELETE /api/events/:id`

Event registrations:

1. `POST /api/event-registrations`
2. `GET /api/event-registrations/confirm?token=...`

Admin only event routes require an authenticated user with the `ADMIN` role.
