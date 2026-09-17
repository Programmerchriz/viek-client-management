# VIEK Client Management

## Overview

A React/Vite frontend and Express REST API for managing clients and projects.

The application supports login, viewing clients, adding clients, deleting clients, viewing projects, and filtering projects by client.

## Bugs Identified

- The frontend expected `result.clients`, but the API returned clients under `data`.
- Client deletion failed because route IDs were strings while stored IDs were numbers.
- Project filtering failed for the same string/number mismatch.
- The add-client request did not include `Content-Type: application/json`.
- `projects` was initially undefined, causing `.map()` rendering errors.
- Frontend fetch failures and malformed responses were not handled safely.
- Client input and route parameters were insufficiently validated.
- New client IDs could be duplicated after deletion.
- The login response exposed the demo user's password.
- The backend error handler exposed internal error details.
- `App.jsx` used JSX without importing `React`, causing a browser runtime error.
- The browser requested a missing `favicon.ico`, this did not affect application functionality.

## Root Causes

The frontend and backend did not use consistent response and data types. HTML form controls and URL parameters produced string IDs, while the backend stored numeric IDs.

The frontend assumed that all requests succeeded and returned valid JSON. This caused crashes when responses were missing, malformed, or unsuccessful.

Backend validation only checked whether values existed. It did not validate data types, email formats, or numeric IDs.

The login endpoint returned the complete user object, including the password. The fixed demo token and plaintext password were part of the simplified authentication implementation.

A JSX runtime error occurred because `React` was not imported in `App.jsx`.

## Solutions

- Updated the frontend to read clients from `result.data`.
- Converted and validated client IDs before comparing them.
- Added the JSON content type to add-client requests.
- Initialized projects with an empty array.
- Added safe request, response, and error handling in the frontend.
- Added separate loading effects for clients and projects.
- Added frontend and backend validation for names, emails, and IDs.
- Generated new client IDs from the highest existing ID.
- Removed the password from successful login responses.
- Restricted CORS to the local frontend origins.
- Replaced detailed backend error responses with consistent generic JSON errors.
- Imported `React` in `App.jsx` so JSX renders correctly.

## Testing

The backend was started with:

```bash
cd server
npm install
npm start
```

The frontend was started with:

```bash
cd client
npm install
npm run dev
```

## During debugging, the following API behaviors were checked:

- Valid login
- Invalid login
- Missing authentication
- Client retrieval
- Client creation
- Invalid client input
- Client deletion
- Nonexistent and malformed client IDs
- Project retrieval
- Project filtering
- Malformed JSON responses
The browser flow was also checked for login rendering, client loading, project rendering, and runtime errors.

## Security

The following security improvements were made:
- Passwords are no longer returned in login responses.
- Client input and route parameters are validated on the server.
- CORS is restricted to the local frontend origins.
- Internal server error details are not returned to clients.

The application still uses simplified demo authentication. The demo password is stored in plaintext in memory, the token is fixed, and the token is stored in localStorage.

A production system should use hashed passwords, environment-managed secrets, expiring signed tokens or secure sessions, stronger authentication controls, and additional protection against XSS and CSRF.

## Reflection

The most difficult issues to investigate were the API response mismatch and the ID type mismatches. They required tracing data from the frontend request through the Express route and comparing the actual response values with the frontend's expectations.

The debugging approach was to inspect the complete project, reproduce the failures, trace the frontend/backend data flow, fix the root causes, and test both successful and failed requests.

The remaining limitations are related to the simplified demo authentication model. It is suitable for the assessment but not for production.
