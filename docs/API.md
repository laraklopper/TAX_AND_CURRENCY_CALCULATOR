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
| GET | /currencies | Every currency the converter can offer, as `{ code, name, symbol }` | Yes | Built |
| GET | /rates?base=ZAR | Get latest exchange rates | No | Not built |
| GET | /convert?from=&to=&amount= | Convert amount between currencies (returns a quote, doesn't save) | Yes | Built |
| POST | /save | Save a conversion to history | Yes | Built |
| GET | /history | Get user's saved conversions, newest first (see history note) | Yes | Built |
| DELETE | /history/:id | Delete a saved conversion | Yes | Built |

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
All three save endpoints re-run the calculation from the submitted inputs and store their own figures, ignoring any totals sent by the browser. `/api/tax/save` and `/api/interest/save` recompute the maths; `/api/save` fetches its own exchange rate from the provider rather than storing the `rate` the browser sends. The user is taken from the JWT, never from the request body, and `fullName` is read from the database.

**History is scoped to the token, and capped.** 
`GET /history` and `DELETE /history/:id` on `/api/tax`, `/api/interest` and `/api` all filter on the user id in the JWT, never on an id from the request, so a user can only read and delete their own records. The delete matches `_id` and `user` in one query, so another user's record returns the same 404 as one that does not exist rather than a 403 that would confirm it exists. `GET /history` returns the newest 100 records with the response shape `{ success, total, limit, calculations }` — or `{ success, total, limit, conversions }` on `/api` — so compare `total` against the array's length to detect a truncated view. Because all three schemas set `toJSON: { virtuals: true }`, each returned record also carries its virtuals (`taxableIncome`, `netIncome`, `monthlyTax` for tax; `durationInYears`, `totalCapital` for interest; `convertedAmount` for currency).

A conversion history is READ-ONLY apart from the delete: nothing is refetched from Frankfurter, so each record reports the rate its own save fetched rather than being repriced at today's rate.

All three histories are now read by a saved-calculations list in the client — `CurrencyCalculations.js` on the converter page, `TaxCalculations.js` and `InterestCalculations.js` on the calculators page. The three share their behaviour through `client/src/utils/useCalculationsList.js` and their formatting through `client/src/utils/formatCalculations.js`, so a change to how a history is loaded, deleted or displayed applies to all three at once.

**The currency list comes from the provider, not from an array.**
Both currency routes go through [server/utils/currencyService.js](../server/utils/currencyService.js), the only module that talks to Frankfurter. `GET /currencies` serves what Frankfurter reports it supports (165 codes) with the response shape `{ success, live, total, currencies }`, and `/convert` validates `from` and `to` against that same list, so the codes the browser can pick and the codes the server accepts cannot drift apart. The list is cached in memory for 24 hours; each conversion fetches its own rate, so a rate written to history is the rate that was quoted. `live` is `false` when the list came from the offline snapshot in [server/dataArrays/currencies.js](../server/dataArrays/currencies.js), which is used only while the provider is unreachable. A `/convert` response also carries `date`, the day Frankfurter published the rate — except when `from` and `to` match, which short-circuits at a rate of 1 without calling out.

**Currency conversions are saved by the user, not by `/convert`.** 
`/convert` was planned as a POST with a matching `/save`. It is implemented as a GET that takes query params, and it used to write the `CurrencyConvert` history record itself as a best-effort side effect — so every conversion was kept whether the user wanted it or not. Now that the converter has a SAVE CALCULATION button, that implicit write has been removed: `/convert` only quotes, and `POST /api/save` is the only thing that writes a record. `/save` takes `{ amount, from, to }` as JSON, validates the codes against the same supported list as `/convert`, fetches its own rate, and responds `201` with `{ success, message, saved }` — where `saved` carries the record's `convertedAmount` virtual. A conversion between a currency and itself is stored at a rate of 1, matching the short-circuit in `/convert`.

`GET /api/history` and `DELETE /api/history/:id` are now built, so the currency calculations panel on the converter page reads and removes saved conversions through them. The client had been calling `DELETE /api/delete/:id`, which never existed; the delete lives under `/history/:id` to match `/api/tax` and `/api/interest`.

---

## 7. REFERENCES

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
- https://api.frankfurter.dev/v2/rates
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PATCH
- https://frankfurter.dev/