# SECURITY
---
## TABLE OF CONTENTS
1. [OVERVIEW](#1-overview)
    - [1.1. THIRD PARTY PACKAGES](#11-third-party-packages)
    - [1.2. CUSTOM MIDDLEWARE](#12-custom-middleware)
    - [1.3. SECURITY UTILITIES](#13-security-utilities)
    - [1.4. PROTECTED FRONT-END ROUTES](#14-protected-front-end-routes)
2. [JWT AUTHENTICATION](#2-jwt-authentication)
3. [CROSS ORIGIN RESOURCE SHARING](#3-cross-origin-resource-sharing-cors)
4. [RATE LIMITING](#4-rate-limiting)
5. [PASSWORD SECURITY](#5-password-security)
6. [REFERENCES](#6-references)

- *View [GLOSSARY.md](../GLOSSARY.md) for terminology*

---
## 1. OVERVIEW

The application implements an **in-depth** security strategy using:

- **Third-party packages**: Industry-standard libraries for authentication, hashing, and rate limiting
- **Custom middleware**: Application-specific validation and authorization logic
- **Security utilities**: Utility functions for secure configuration management
- **Protected routes**: protected front end routes for `RBAC`

### 1.1. THIRD PARTY PACKAGES

| _PACKAGE_ | _CLI / TERMINAL_ | _PURPOSE_ | _VERSION_ |
|-----------|-----------------|-----------|-----------|
| JsonWebToken | `npm install jsonwebtoken` | Signs and verifies JWT tokens for stateless authentication |9.0.3 |
| Bcrypt | `npm install bcrypt` | Hashes passwords before storage using bcrypt (salt rounds: 10) | 6.0.0 |
| Helmet | `npm install helmet` | Sets secure HTTP response headers to guard against common web attacks (XSS, clickjacking, MIME sniffing, etc.) | 8.2.0 |
| Express-Rate-Limit | `npm install express-rate-limit` | Limits repeated requests to API endpoints per IP | 8.5.2 |
| cors | `npm install cors` | Cross-Origin Resource Sharing middleware | 2.8.6 |
| dotenv | `npm install dotenv` | Loads environment variables from `.env` file | 17.4.2 |
| Nodemailer | `npm install nodemailer` | Sends password-reset emails via Gmail SMTP | 9.0.1 |

[PACKAGES.md](../docs/PACKAGES.md)

### 1.2. CUSTOM MIDDLEWARE

<!-- JWT A -->
#### checkJwtToken
Verifies the `Authorization: Bearer <token>` header

### `checkAdmin`
Must run AFTER checkJwtToken, which attaches the decoded token to req.user.
The admin flag is re-read from the database rather than trusted from the token:
a token signed before the user's privileges changed would otherwise still grant
admin access until it expired.

#### `hashPassword`
Runs before registration or password-change routes. Reads `req.body.password` (registration) or `req.body.newPassword` (password update), hashes with `bcrypt.hash(value, 10)`, and replaces the plaintext value in `req.body` before the route handler saves it to the database.


#### `checkPassword`
Uses the regex `/^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/` to enforce:
- Minimum 8 characters
- At least one special character

Returns `400` if validation fails.

#### `checkAge`
Parses `dateOfBirth` from `req.body`, calculates the user's age, and enforces:
- Regular users: must be **18 or older**
- Admin users (`admin: true`): must be **16 or older**

Returns `400` if the user is underage or if the date is invalid or in the future.

- REQUEST LIMIT MIDDLEWARE
#### `generalRateLimiter`
Caps traffic at 100 requests per 15 minutes per IP using `express-rate-limit`. Returns `429` with a `retryAfter` value (minutes) when exceeded.

#### `loginRateLimiter`
Caps login attempts at 5 per 15 minutes per IP. Uses `skipSuccessfulRequests: true`, so only failed attempts (4xx/5xx responses) count toward the limit.

#### `passwordUpdateRateLimiter`
Caps password-change attempts at 3 per hour per IP.

#### `registrationRateLimiter`
Caps new account registrations at 3 per hour per IP, to slow down automated/spam account creation.

#### `forgotPasswordRateLimiter`
Rate limiter middleware to limit forgot-password requests to 3 per hour per IP.

### `resetPasswordLimiter`
Rate limiter middleware to limit reset-password requests

[middleware.js](../server/routes/middleware.js)

### 1.3. SECURITY UTILITIES

#### [`ensureJwtSecret.js`](../server/config/ensureJwtSecret.js)

Called once at startup in [server/app.js]('../server/app.js') before any other module loads. It guarantees `JWT_SECRET_KEY` is available:

- **If the key exists in `.env`**: reuses it, no changes made
- **If the key is missing in development**: generates a cryptographically secure 512-bit key (`crypto.randomBytes(64)`), writes it to `.env` (with permissions `0o600`), and sets `process.env.JWT_SECRET_KEY` for the current process
- **If the key is missing in production**: logs a fatal error and calls `process.exit(1)` — the server will not start

#### [mailer.js](../server/utils/mailer.js)

Sends password-reset emails via a Gmail SMTP transport (Nodemailer). The reset email contains a one-time link with the raw reset token; only the hashed token is stored server-side

#### helmet

Helmet.js middleware is used for securing HTTP headers. . It sets up various HTTP headers to prevent attacks like Cross-Site-Scripting(XSS), clickjacking, etc.

#### `.env`

A file which stores all secrets and environment-specific config. The `.env` file is never committed to source control (listed in `.gitignore`)

### 1.4. PROTECTED FRONT-END ROUTES

Client-side `RBAC` is enforced by two wrapper components that gate access to a route's content based on login and admin status. Each wrapper checks `currentUser` (set on login) before rendering its `children`; if the check fails, the user is redirected to `/` instead of seeing the protected page.

[`ProtectedUserRoute.js`](../client/src/protectedRoutes/ProtectedUserRoute.js) - if a user is logged in, render the protected content. Used for any route that just requires being logged in


This component protects routes that require a user to be logged in, regardless of their role.
```js
//ProtectedUserRoute.js
import React from 'react'
// Import React Router components
import { Navigate } from 'react-router-dom'

//ProtectedUserRoute Function Component
export default function ProtectedUserRoute(//Export default ProtectedUserRoute.js Function Component
  {//PROPS PASSED FROM PARENT COMPONENT
        currentUser, 
        children
    }
 ) {
    // If no user is logged in,
  // redirect to the login(landing) page.
  if (!currentUser) {
    return <Navigate to='/'/>
  }
    // If a user is logged in,
  // render the protected content.
  return children
}
```
[`ProtectedAdminRoute.js`](/client/src/protectedRoutes/ProtectedAdminRoute.js) - f there is no logged-in user OR the user is not an admin, redirect to the home page; if the user exists and is an admin, render the protected content. Used for the admin-only Users route.

```js
//ProtectedAdminRoute.js
import React from 'react'
// Import React Router components
import { Navigate } from 'react-router-dom'

//ProtectedAdminRoute
export default function ProtectedAdminRoute(//Export default ProtectedAdminRoute.js Function Component
    {//PROPS PASSED FROM PARENT COMPONENT
        currentUser, 
        children
    }) {

 // If there is no logged-in user OR the user is not an admin,
  // redirect them to the login(landing) page.
    if (!currentUser || !currentUser.admin) {
        return <Navigate to='/'/>
    }
  return children
}

```

## 2. JWT AUTHENTICATION

All api request (function) routes including third-party apis routes require an Authorization: Bearer <token> header. Except in the '/auth' routes. 

## 3. CROSS ORIGIN RESOURCE SHARING (`CORS`)

CORS is an HTTP header that allows the server to indicate what origins(domain, scheme, or port) other than its own from which a browser should permit loading resources.
## 4. RATE LIMITING

Rate limiting controls how many requests a client can make in a certain time period.
All limiters respond with `429 Too Many Requests` and include a `retryAfter` field (in minutes) in the JSON body when the limit is exceeded. 
Uses `express-rate-limit` middleware to limit requests.

## 5. PASSWORD SECURITY

**Validation** (`checkPassword` middleware):
- Minimum 8 characters
- At least one special character from `!@#$%^&*(),.?":{}|<>`
- Applied to both registration (`password`) and password changes (`newPassword`)

**Hashing** (`hashPassword` middleware):
- Uses `bcrypt.hash(password, 10)` — 10 salt rounds
- Runs before the route handler so the plaintext password never reaches the database layer
- Applied to registration and password-update routes
- **PASSWORD HASHING IS NOT USED DURING DEVELOPMENT**

**Storage**: only the bcrypt hash is persisted (registration and password-reset both go through `hashPassword`). The password field is excluded from all query responses by default (`.select('-password')`); it is only fetched when explicitly needed for comparison (`.select('+password')`).

## 6. REFERENCES

- https://www.npmjs.com/package/jsonwebtoken
- https://www.npmjs.com/package/helmet
- https://www.npmjs.com/package/express-rate-limit
- https://www.geeksforgeeks.org/node-js/node-js-securing-apps-with-helmet-js/
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS