# PASSWORD RESET

The password reset flow consists of two steps: the user requests a reset link via the **Forgot Password** form, and then uses that link to submit a new password via the **Reset Password** form. Each step maps to its own frontend page and backend route.

- **NOTE:** The application is not deployed and forgot password and reset password routes are not active.

## TABLE OF CONTENTS

1. [FORGOT PASSWORD](#1-forgot-password)
    - [1.1. Frontend](#11-frontend)
    - [1.2. Backend](#12-backend)
2. [RESET PASSWORD](#2-reset-password)
    - [2.1. Frontend](#21-frontend)
    - [2.2. Backend](#22-backend)
3. [NODEMAILER](#3-nodemailer)
    - [3.1. Installation](#31-installation)
    - [3.2. How It Works](#32-how-it-works)
    - [3.3. In This Application](#33-in-this-application)
4. [REFERENCES](#4-references)

- *View [GLOSSARY.md](/GLOSSARY.md) for terminology*
----

## 1. FORGOT PASSWORD

### 1.1. Frontend

- [`ForgotPassword.js`](../client/src/pages/ForgotPassword.js)

The `ForgotPassword` page renders a single email input form. When submitted, `handleSubmit` POSTs the email to the backend. The email is trimmed and lowercased before sending so it matches the format stored in the database.

**State variables:**

| Variable | Purpose |
|---|---|

### 1.2 Backend 

- [authRoutes.js](../server/routes/authRoutes.js)

**Request body:**

**What it does:**

**Responses:**

| Status | When |
|----|-------|

## 2. RESET PASSWORD

### 2.1. Frontend

- [`PasswordReset.js`]('../client/src/pages/PasswordReset.js')

The `PasswordReset` page is reached via the link in the reset email. The raw token is read from the URL using `useParams` (`/resetPassword/:token`). The form collects a new password and a confirmation field.

Before the request is sent, the component checks client-side that the two password fields match and shows an inline error if they don't. No request is made until they do.

**State variables:**

| Variable | Purpose |
|---|---|

On success the form fields are hidden and the user is shown a success message with a "GO TO LOGIN" link.

### 2.2. Backend

- [authRoutes.js](../server/routes/authRoutes.js)

**Request body:**

**What it does:**

**Responses:**

| Status | When |
|----|-------|
## 3. NODEMAILER

Nodemailer is the most popular email sending library for Node.js. It makes sending emails straightforward and secure, with zero runtime dependencies to manage. In this application it is used exclusively to deliver password reset links to users.

### 3.1. Installation

```bash
npm install nodemailer
```

### 3.2. How it Works

Sending an email with Nodemailer requires three steps:

1. **Step 1 — Create a transporter**

The transporter defines *how* the email is sent. This application uses Gmail as the `SMTP` service. The credentials are loaded from environment variables so they are never hard-coded in the source.


| Environment variable | Purpose |
|---|---|

2. **Step 2 — Compose the message**

The mail options object defines the sender, recipient, subject, and HTML body. The reset URL passed to the function contains the raw token generated in the `/auth/forgotPassword` route.

`[mailer.js]('../server/utils/mailer.js')`
```js
  await mailTransport.sendMail({
        from: mailFrom,//Sender address
        to,//Recipient address
        subject: 'Reset your password',//Email subject line
        text,//Plain text body for clients that do not render HTML
        html,//HTML body
    });
```
3. **Step 3 — Send the email**

### 3.3. In This Application

The transporter and send function are encapsulated in [`server/utils/mailer.js`](../server/utils/mailer.js).

## 4. REFERENCES
- https://nodemailer.com/
- https://www.npmjs.com/package/nodemailer
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
- https://api.reactrouter.com/v8/functions/react-router.useParams.html
- https://react.dev/reference/react/useState