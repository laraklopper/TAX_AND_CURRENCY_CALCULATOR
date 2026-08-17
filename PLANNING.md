# PLANNING



**OVERVIEW**

The application is full-stack tax and currency calculator which allows users to:
- Calculate South African personal income tax (SARS rates)
- Convert between currencies using live exchange rates
- Calculate simple/compound interest on savings or loans
- Register, log in, and securely save/retrieve their calculation history



## TABLE OF CONTENTS

1. [PROJECT SCOPE](#1-project-scope)
2. [SECURITY]()

## 1. PROJECT SCOPE

The application is written using `MERN` stack, a popular open-source, JavaScript-based, developer-friendly web stack. The `Target users`are: individuals, freelancers, small business owners, and students in South Africa who want a quick, reliable, all-in-one financial calculator.

|GOALS||
|--------|---------|
|Accurate SARS tax calculation for the current tax year, with support for multiple past tax years||
|Real-time currency conversion via a third-party FX API||
|Simple and compound interest calculator||
|Secure authentication (JWT-based) and per-user saved history||
|Clean, responsive UI (mobile-first)||


## 2. Core Features
 
### 2.1 Authentication
- User registration (name, email, password)
- Login with JWT issuance (access token + refresh token)
- Password hashing with bcrypt
- Protected routes (dashboard, saved calculations)
- Password reset via email (optional v1.1 — can stub for v1)
- Logout / token invalidation
### 2.2 Income Tax Calculator (SARS-based)
- Input: annual or monthly taxable income, age bracket, tax year
- Applies SARS progressive tax brackets and rebates
- Displays: gross tax, applicable rebate, net tax payable, effective tax rate, marginal tax rate, bracket breakdown
- Optional: medical scheme tax credit input (number of dependants)
- Selectable tax year (defaults to current year, historical years available)
### 2.3 Currency Converter
- Select base and target currency from a dropdown (ZAR default)
- Fetch live exchange rates from a third-party API
- Cache rates for a short period (e.g. 1 hour) to reduce API calls
- Show conversion result and rate used, with timestamp
### 2.4 Interest Calculator
- Simple interest: Principal, Rate, Time
- Compound interest: Principal, Rate, Time, Compounding frequency (annual, semi-annual, quarterly, monthly, daily)
- Optional: recurring monthly contribution calculator (for savings goals)
- Displays: total interest earned/owed, final amount, year-by-year breakdown table
### 2.5 User Dashboard
- View saved calculations (tax, currency, interest) with timestamps
- Delete/re-run a past calculation
- Basic profile management (update name/email/password)

## 3. API Endpoint Plan

 - All endpoint require an `Authorization: Bearer <token>` header except the '/auth' routes/endpoints.
 
### 3.1. Auth Routes (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /register | Create new user | No |
| POST | /login | Authenticate, return JWT | No |
| POST | /refresh | Refresh access token | No (refresh token) |
| POST | /logout | Invalidate refresh token | Yes |
| GET | /me | Get current user profile | Yes |
 
### 3.2. Tax Routes (`/api/tax`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /calculate | Calculate tax (returns result, doesn't save) | No |
| POST | /save | Save a calculation to user history | Yes |
| GET | /history | Get user's saved tax calculations | Yes |
| DELETE | /history/:id | Delete a saved calculation | Yes |
 
### 3.3. Currency Routes (`/api/currency`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /rates?base=ZAR | Get latest exchange rates | No |
| POST | /convert | Convert amount between currencies | No |
| POST | /save | Save a conversion to history | Yes |
| GET | /history | Get user's saved conversions | Yes |
 
### 3.4. Interest Routes (`/api/interest`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /calculate | Calculate simple/compound interest | No |
| POST | /save | Save calculation | Yes |
| GET | /history | Get saved interest calculations | Yes |
| DELETE | /history/:id | Delete saved calculation | Yes |
 
---
## 4. SECURITY 


### 4.1 SECURITY GOALS
- Hash passwords with bcrypt (min. 10 salt rounds)( stored as plaintext during development)
- Store JWT secret and API keys in environment variables (never commit `.env`)
- Use HTTPS in production
- Validate and sanitize all inputs server-side (express-validator/Joi)
- Rate-limit auth endpoints (express-rate-limit) to prevent brute force
- Use `helmet` middleware for secure HTTP headers
- CORS configured to only allow the deployed frontend origin
- Store refresh tokens as httpOnly cookies, not localStorage
- Never trust client-submitted tax/interest results for anything beyond display — recompute server-side before saving


