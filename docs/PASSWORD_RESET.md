# PASSWORD RESET

The password reset flow consists of two steps: the user requests a reset link via the **Forgot Password** form, and then uses that link to submit a new password via the **Reset Password** form. Each step maps to its own frontend page and backend route.

- **NOTE:** The application is not deployed. Both frontend pages call `http://localhost:3001` directly, so the flow only works against a locally running server.
- **NOTE:** No `SMTP_*` variables are set in `server/.env`, so no mail transport is built. The reset link is written to the server console instead of being emailed. See [3.3. In This Application](#33-in-this-application).
- **NOTE:** Passwords are stored and compared in plain text for development, so the reset route assigns the new password as-is. There is no hashing anywhere in this flow.

## TABLE OF CONTENTS

1. [FORGOT PASSWORD](#1-forgot-password)
    - [1.1. Frontend](#11-frontend)
    - [1.2. Backend](#12-backend)
2. [RESET PASSWORD](#2-reset-password)
    - [2.1. Frontend](#21-frontend)
    - [2.2. Backend](#22-backend)
3. [TOKEN STORAGE](#3-token-storage)
4. [NODEMAILER](#4-nodemailer)
    - [4.1. Installation](#41-installation)
    - [4.2. How It Works](#42-how-it-works)
    - [4.3. In This Application](#43-in-this-application)
5. [ENVIRONMENT VARIABLES](#5-environment-variables)
6. [REFERENCES](#6-references)

- *View [GLOSSARY.md](../GLOSSARY.md) for terminology*
----

## 1. FORGOT PASSWORD

### 1.1. Frontend

- [`ForgotPassword.js`](../client/src/pages/ForgotPassword.js)
- Route: `/forgotPassword` — registered in [`App.js`](../client/src/App.js)

The `ForgotPassword` page renders a single email input form. When submitted, `handleSubmit` POSTs the email to `http://localhost:3001/auth/forgotPassword`. The email is trimmed and lowercased before sending so it matches the format stored in the database.

While the request is in flight the input and submit button are disabled and the button label changes to `SENDING...`. Once the request succeeds the email input and submit button are unmounted, so the form cannot be submitted twice, and the "BACK TO LOGIN" link becomes "GO TO LOGIN".

**State variables:**

| Variable | Purpose |
|---|---|
| `email` | Current value of the email input |
| `loading` | Tracks whether the request is running; disables the input and button and drives the `SENDING...` label |
| `successMsg` | Message returned by the backend on a `200`; when set, the input and submit button are hidden |
| `error` | Error message from the backend, or a network error message when `fetch` throws |

### 1.2 Backend

- [`authRoutes.js`](../server/routes/authRoutes.js) — `POST /auth/forgotPassword`
- Mounted at `/auth` in [`app.js`](../server/app.js)
- Middleware: `forgotPasswordLimiter` — 5 requests per 15 minutes per IP

**Request body:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | String | Yes | Lowercased and trimmed by the route before the lookup |

**What it does:**

1. Rejects the request if `email` is missing or is not a string.
2. Normalises the email (lowercase + trim) and looks the user up with `User.findOne`.
3. If no user matches, it still returns the **same** `200` response. Confirming that an address exists would turn the endpoint into a way of harvesting valid account emails.
4. Generates a raw token with `crypto.randomBytes(32).toString('hex')`. This raw value is only ever sent in the email.
5. Stores the **SHA-256 hash** of the token in `resetPasswordToken` and an expiry of `now + RESET_TOKEN_TTL_MINUTES` (default 60) in `resetPasswordExpiry`. Saved with `validateBeforeSave: false`, because `password` is `select: false` and so is absent from the document — a full validation would fail on the required `password` field even though it was never touched.
6. Builds the reset URL as `` `${CLIENT_URL}/resetPassword/${resetToken}` `` (default client URL `http://localhost:3000`). This path must match the frontend route in `App.js`.
7. Calls `sendPasswordResetEmail`. If the send throws, both reset fields are cleared before responding, so a failed send does not leave a live token on the account that nobody can use.

**Responses:**

| Status | When |
|----|-------|
| 200 | `{ message: 'If that email is registered, a reset link has been sent.' }` — returned whether or not the email is registered |
| 400 | `email` is missing or is not a string |
| 429 | More than 5 requests in 15 minutes from the same IP |
| 502 | The reset email could not be sent; the stored token and expiry are cleared first |
| 500 | Unexpected server error |

----

## 2. RESET PASSWORD

### 2.1. Frontend

- [`PasswordReset.js`](../client/src/pages/PasswordReset.js)
- Route: `/resetPassword/:token` — registered in [`App.js`](../client/src/App.js)

The `PasswordReset` page is reached via the link in the reset email. The raw token is read from the URL using `useParams` (`/resetPassword/:token`). The form collects a new password and a confirmation field.

Before the request is sent, the component checks client-side that the two password fields match and shows an inline error if they don't. No request is made until they do. The token is then posted to `http://localhost:3001/auth/resetPassword/${token}` with the new password in the body.

The page does **not** call the `GET /auth/resetPassword/:token` validity check before rendering the form; an invalid or expired token is only reported after the form is submitted.

**State variables:**

| Variable | Purpose |
|---|---|
| `password` | Current value of the new password input |
| `confirmPassword` | Current value of the confirmation input; compared to `password` before any request is made |
| `passwordMsg` | Set on focus and cleared on blur of either password input; shows the "WE WILL NEVER SHARE YOUR PASSWORD" notice |
| `loading` | Tracks whether the request is running; disables both inputs and the button and drives the `RESETTING...` label |
| `successMsg` | Message returned by the backend on a `200` |
| `error` | Client-side mismatch message, backend error message, or a network error message |

On success the form fields are hidden and the user is shown a success message with a "GO TO LOGIN" link.

### 2.2. Backend

- [`authRoutes.js`](../server/routes/authRoutes.js) — `GET /auth/resetPassword/:token` and `POST /auth/resetPassword/:token`
- Middleware on both: `resetPasswordLimiter` — 10 requests per 15 minutes per IP
- Additional middleware on `POST`: [`checkPassword`](../server/routes/middleware.js) — the new password must be at least 8 characters and contain at least one special character

#### GET `/auth/resetPassword/:token`

Checks whether a reset link is still usable before showing the form. It hashes the supplied token, looks for a user whose `resetPasswordToken` matches **and** whose `resetPasswordExpiry` is still in the future, and reports only whether that link is live. It does not consume the token. This route is currently unused by the frontend.

**Responses:**

| Status | When |
|----|-------|
| 200 | `{ valid: true, message: 'Reset token is valid' }` |
| 400 | `{ valid: false }` — the token is missing, or it does not match a live, unexpired reset |
| 429 | More than 10 requests in 15 minutes from the same IP |
| 500 | `{ valid: false }` — unexpected server error |

#### POST `/auth/resetPassword/:token`

**Request body:**

| Field | Type | Required | Notes |
|---|---|---|---|
| `password` | String | Yes | The new password; validated by `checkPassword` before the handler runs |

The token is taken from the URL parameter, not the body.

**What it does:**

1. `checkPassword` runs first and rejects a weak or missing password before the handler is reached.
2. Rejects the request if the token parameter is missing or is not a string.
3. Looks up the user by the **hashed** token and an unexpired `resetPasswordExpiry`. `password`, `resetPasswordToken` and `resetPasswordExpiry` are all `select: false` on the schema, so all three are explicitly requested with `.select('+password +resetPasswordToken +resetPasswordExpiry')`.
4. If nothing matches, the link is treated as invalid — an expired token is treated as no token at all.
5. Rejects a "reset" that sets the password to the current one.
6. Assigns the new password, then clears `resetPasswordToken` and `resetPasswordExpiry`. The token is single use: clearing both fields means the same link cannot be replayed.
7. Saves with `user.save()`, which runs the schema validators on the new password.

**Responses:**

| Status | When |
|----|-------|
| 200 | `{ message: 'Password reset successfully. You can now log in.' }` |
| 400 | Password missing or too weak (`checkPassword`), token missing, token invalid or expired, new password matches the current one, or a Mongoose validation error |
| 429 | More than 10 requests in 15 minutes from the same IP |
| 500 | Unexpected server error |

----

## 3. TOKEN STORAGE

The reset state lives on the user document in [`userSchema.js`](../server/models/userSchema.js):

| Field | Type | Notes |
|---|---|---|
| `resetPasswordToken` | String | SHA-256 hash of the raw token. `select: false`, so it must be explicitly requested |
| `resetPasswordExpiry` | Date | When the link stops working. `select: false` |

Only the hash is stored, so a leaked database cannot be used to reset anyone's password — the raw token exists only in the email that was sent. SHA-256 rather than bcrypt is enough here because the token is 256 bits of random data, not a guessable, human-chosen secret.

Both password reset endpoints are unauthenticated and act on an account the caller does not have to prove they own, which is why both are rate limited per IP: this stops the forgot form being used to mail-bomb an address and stops reset tokens being brute forced.

----

## 4. NODEMAILER

Nodemailer is the most popular email sending library for Node.js. It makes sending emails straightforward and secure, with zero runtime dependencies to manage. In this application it is used exclusively to deliver password reset links to users.

### 4.1. Installation

```bash
npm install nodemailer
```

### 4.2. How it Works

Sending an email with Nodemailer requires three steps:

1. **Step 1 — Create a transporter**

The transporter defines *how* the email is sent. This application uses a **generic SMTP host** configured through environment variables, not a named service preset, so the credentials are never hard-coded in the source. The transport is created once and reused: nodemailer pools the connection, so a new one per email would open a new SMTP session every time.

[`mailer.js`](../server/utils/mailer.js)
```js
transporter = nodemailer.createTransport({
    host: smtpHost,//Mail server hostname
    port: smtpPort,//Mail server port
    secure: smtpSecure,// true for implicit TLS (port 465), false for STARTTLS
    // Only send credentials when both were supplied
    auth: smtpUser && smtpPassword
        ? { user: smtpUser, pass: smtpPassword }
        : undefined,
});
```

2. **Step 2 — Compose the message**

The mail options object defines the sender, recipient, subject, and both bodies. `buildResetText` and `buildResetHtml` build the plain text and HTML versions from the recipient's first name, the reset URL and the expiry in minutes. The reset URL passed to the function contains the raw token generated in the `/auth/forgotPassword` route.

3. **Step 3 — Send the email**

`sendPasswordResetEmail` awaits `sendMail` on the pooled transport and resolves to `{ delivered: true }`. Errors are not caught here — they propagate to the caller, which is what lets the `/auth/forgotPassword` route clear the stored token and return a `502`.

[`mailer.js`](../server/utils/mailer.js)
```js
await mailTransport.sendMail({
    from: mailFrom,//Sender address
    to,//Recipient address
    subject: 'Reset your password',//Email subject line
    text,//Plain text body for clients that do not render HTML
    html,//HTML body
});
```

### 4.3. In This Application

The transporter and send function are encapsulated in [`server/utils/mailer.js`](../server/utils/mailer.js), which exports:

| Export | Purpose |
|---|---|
| `sendPasswordResetEmail({ to, resetUrl, firstName, expiryMinutes })` | Sends the reset email. `expiryMinutes` defaults to `60`. Resolves to `{ delivered: boolean }` |
| `smtpConfigured` | `true` when `SMTP_HOST` is set |

**Console fallback:** a transport can only be built when `SMTP_HOST` is configured. Without one the application still runs — `sendPasswordResetEmail` logs the reset link to the console and returns `{ delivered: false }`, so the reset flow stays usable in development without SMTP credentials. Because no `SMTP_*` variables are currently set, this is the active path.

> Never do this in production: the reset link is a one-time credential and server logs are not a private channel.

The module also warns at startup when `SMTP_HOST` is missing, and separately when a host is set but `SMTP_USER`/`SMTP_PASSWORD` are not — in that case it connects to the mail server without authentication.

----

## 5. ENVIRONMENT VARIABLES

Read by [`mailer.js`](../server/utils/mailer.js):

| Environment variable | Purpose |
|---|---|
| `SMTP_HOST` | Mail server hostname. If unset, no transport is built and reset links are logged to the console |
| `SMTP_PORT` | Mail server port. Defaults to `587` (STARTTLS) |
| `SMTP_USER` | Mail account username. Credentials are only sent when both this and `SMTP_PASSWORD` are supplied |
| `SMTP_PASSWORD` | Mail account password or app password |
| `SMTP_SECURE` | `'true'` / `'false'` override for implicit TLS. Defaults to `true` only when the port is `465` |
| `MAIL_FROM` | Sender address. Defaults to `no-reply@taxcurrencycalculator.local` |

Read by [`authRoutes.js`](../server/routes/authRoutes.js):

| Environment variable | Purpose |
|---|---|
| `CLIENT_URL` | Frontend origin used to build the reset link. Defaults to `http://localhost:3000` |
| `RESET_TOKEN_TTL_MINUTES` | How long a reset link stays valid, in minutes. Defaults to `60` |

## 6. REFERENCES
- https://nodemailer.com/
- https://www.npmjs.com/package/nodemailer
- https://nodejs.org/api/crypto.html
- https://www.npmjs.com/package/express-rate-limit
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
- https://api.reactrouter.com/v8/functions/react-router.useParams.html
- https://react.dev/reference/react/useState
</content>
