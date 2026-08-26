# SECURITY

#### 
- 
---
## TABLE OF CONTENTS

---
## OVERVIEW

The application implements an **in-depth** security strategy using:

- **Third-party packages**: Industry-standard libraries for authentication, hashing, and rate limiting
- **Custom middleware**: Application-specific validation and authorization logic
- **Security utilities**: Utility functions for secure configuration management
- **Protected routes**: protected front end routes for `RBAC`

**SECURITY GOALS**

- Protect user credentials (Hash passwords using bcrypt middleware - **NOT USED DURING DEVELOPMENT**)
- Authenticate requests securely (JWT)
- Restrict access based on roles (RBAC: admin vs user)
- Reduce common web vulnerabilities (security headers, CORS rules)
- Keep secrets out of source control (dotenv)
- Enforce strong passwords at registration and password updates
- Limit API calls using express-rate-limit
- Support secure, time-limited password-reset links via email (hashed token + expiry)

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

### 1.2. CUSTOM MIDDLEWARE

### 1.3. SECURITY UTILITIES

#### [`ensureJwtSecret.js`](../server/config/ensureJwtSecret.js)

Called once at startup in [server/app.js]('../server/app.js') before any other module loads. It guarantees `JWT_SECRET_KEY` is available:

- **If the key exists in `.env`**: reuses it, no changes made
- **If the key is missing in development**: generates a cryptographically secure 512-bit key (`crypto.randomBytes(64)`), writes it to `.env` (with permissions `0o600`), and sets `process.env.JWT_SECRET_KEY` for the current process
- **If the key is missing in production**: logs a fatal error and calls `process.exit(1)` — the server will not start

#### [mailer.js](../server/utils/mailer.js)

### `.env`

Stores all secrets and environment-specific config. The `.env` file is never committed to source control (listed in `.gitignore`)

### 1.4. Protected Front End Routes

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
## REFERENCES

- https://www.npmjs.com/package/jsonwebtoken
- https://www.npmjs.com/package/helmet
- https://www.npmjs.com/package/express-rate-limit