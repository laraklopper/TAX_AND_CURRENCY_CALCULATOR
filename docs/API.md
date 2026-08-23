# API ENDPOINT PLAN

HTTP defines a set of request methods to indicate the purpose of the request and what is expected if the request is successful

| **HTTP Verb** | **CRUD Operation** | **Description** |
|--------|-------|------|
| POST | CREATE | Used to submit data about a specific entity to the server |
| GET | READ | Used to fetch information from the database |
| PUT | UPDATE | Full replacement update of a resource on the database |
| PATCH | UPDATE | Partial update of a resource on the database |
| DELETE | DELETE | Deletes a specific resource |

## TABLE OF CONTENTS
1. [User Routes](#1-user-routes-users)
2. [Auth Routes]()
3. [Tax Routes](#3-tax-routes-apitax)
4. [Currency Routes](#4-currency-routes-api)
5. [Interest Routes](#5-interest-routes-apiinterest)
6. [Notes](#6-notes)
7. [References](#7-references)

## 1. User Routes (`/users`)
| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| GET | /me | Get current user profile | Yes | Built |
| GET |/fetchUsers| Fetch all users | Yes | Built |
| PATCH | /editUser | update user details | Yes | Built |
| PATCH |/editPassword | Edit user password |Yes| Built |
| DELETE | /deleteUser/:id | Delete a user (admin only) | Yes (admin) | Built |

## 2. Auth Routes (`/auth`)

| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| POST | /register | Create new user | No | Built |
| POST | /login | Authenticate, return JWT | No | Built |
| POST | /refresh | Refresh access token | No (refresh token) | Not built |
| POST | /logout | Invalidate refresh token | Yes | Not built |


## 3. Tax Routes (`/api/tax`)

| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| GET | /config | Available tax years + active year's brackets/rebates/thresholds | Yes | Built |
| POST | /calculate | Calculate tax (returns result, doesn't save) | Yes | Built |
| POST | /save | Save a calculation to user history | Yes | Built |
| GET | /history | Get user's saved tax calculations, newest first (see history note) | Yes | Built |
| DELETE | /history/:id | Delete a saved calculation | Yes | Built |


## 4. Currency Routes (`/api`)
| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| GET | /rates?base=ZAR | Get latest exchange rates | No | Not built |
| GET | /convert?from=&to=&amount= | Convert amount between currencies | Yes | Built |
| POST | /save | Save a conversion to history | Yes | Not built (see note) |
| GET | /history | Get user's saved conversions | Yes | Not built |

## 5. Interest Routes (`/api/interest`)
| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| POST | /calculate | Calculate simple/compound interest (annual or monthly periods) | Yes | Built |
| POST | /save | Save calculation | Yes | Built |
| GET | /history | Get saved interest calculations, newest first (see history note) | Yes | Built |
| DELETE | /history/:id | Delete saved calculation | Yes | Built |
---
## 6. NOTES
**Auth note:** 
 - `/calculate` was planned as a public endpoint, but every calculator page sits behind `ProtectedUserRoute` and the already-implemented
 - `/api/convert` requires a token, so the calculate endpoints follow that same convention and require a JWT.

**`/save` recalculates.** 
Both save endpoints re-run the calculation from the submitted inputs and store their own figures, ignoring any totals sent by the browser. The user is taken from the JWT, never from the request body.

**History is scoped to the token, and capped.** 
`GET /history` and `DELETE /history/:id` on both `/api/tax` and `/api/interest` filter on the user id in the JWT, never on an id from the request, so a user can only read and delete their own records. The delete matches `_id` and `user` in one query, so another user's calculation returns the same 404 as one that does not exist rather than a 403 that would confirm it exists. `GET /history` returns the newest 100 records with the response shape `{ success, total, limit, calculations }` — compare `total` against `calculations.length` to detect a truncated view. Because both schemas set `toJSON: { virtuals: true }`, each returned record also carries its virtuals (`taxableIncome`, `netIncome`, `monthlyTax` for tax; `durationInYears`, `totalCapital` for interest).

**Currency conversions save themselves.** 
`/convert` was planned as a POST with a matching `/save`, but it is implemented as a GET that takes query params and writes the `CurrencyConvert` history record itself as a best-effort side effect. Saving is therefore implicit rather than user-controlled, and a failed write is logged without failing the conversion. A separate `/save` is only needed if the user should choose which conversions are kept.

---

## 7. REFERENCES

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
- https://currencyfreaks.com/
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PATCH
- https://frankfurter.dev/