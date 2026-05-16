# Dynamic Web Project

A full-stack flight booking app with a React + Vite frontend and an Express + MongoDB backend.

## Tech Stack

- Frontend: React, Vite, React Router, CSS Modules
- Backend: Node.js, Express, MongoDB (Mongoose)

## Project Overview

This project is a flight booking web app. It lets users browse flights, search by route and date, view details, and book tickets. It also includes basic user auth and admin-style operations for managing flights. The frontend talks to the backend REST API and stores a logged-in user in local storage for authenticated actions.

## What You Can Do (Operations)

User-facing operations:

- Register and log in
- Browse all flights (paginated)
- Search flights by from/to city and date
- View flight details
- Book a ticket for a flight
- View your booked tickets

Admin-style operations (via auth headers):

- Create a new flight
- Update an existing flight
- Delete a flight

## Project Structure

- backend/: Express API, MongoDB models, routes, controllers
- backend/config/db.js: MongoDB connection
- backend/routes/: API route definitions
- backend/controllers/: Request handling logic
- backend/models/: Mongoose schemas
- frontend/: React UI (Vite)
- frontend/src/api.js: API client functions and base URL
- frontend/src/pages/: App pages (login, register, main, flight detail, profile)
- frontend/src/components/: Reusable UI components

## Prerequisites

- Node.js 18+ (or compatible with Vite 8)
- MongoDB connection string

## Setup

1) Install dependencies

Backend:

```
cd backend
npm install
```

Frontend:

```
cd frontend
npm install
```

2) Configure environment

Create a file at backend/.env:

```
MONGODB_URI=your-mongodb-connection-string
PORT=5000
```

3) Run the apps

Backend (dev):

```
cd backend
npm run dev
```

Frontend:

```
cd frontend
npm run dev
```

The frontend expects the API at http://localhost:5000/api.

## API

Health check:

- GET /api/health

Auth headers used for protected routes:

- x-user-username
- x-user-password

## Notes

- The frontend API base URL is defined in frontend/src/api.js.
