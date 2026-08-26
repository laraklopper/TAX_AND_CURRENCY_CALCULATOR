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
4. [Provisional Tax Routes](#4-provisional-tax-routes-provisional)
5. [Currency Routes](#5-currency-routes-api)
6. [Interest Routes](#6-interest-routes-apiinterest)
7. [Export Routes](#7-export-routes-export)
8. [Notes](#8-notes)
9. [References](#9-references)

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


## 4. Provisional Tax Routes (`/provisional`)

| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| POST | /calculate | Calculate one IRP6 payment (returns result, doesn't save) | Yes | Built |
| POST | /save | Save a calculation to user history | Yes | Built |
| GET | /history | Get user's saved provisional tax calculations, newest first (see history note) | Yes | Built |
| DELETE | /history/:id | Delete a saved calculation | Yes | Built |

There is deliberately **no `/config` here**: provisional tax is worked out from
the same brackets, rebates and thresholds as income tax, so the client reads its
tax year dropdown from `GET /tax/config`. A second endpoint serving the same
list would be a second place for it to go stale.

`POST /calculate` and `POST /save` take the same body:

```js
{
  period,                  // 'first' | 'second' | 'third'
  taxYear,                 // e.g. '2025-2026'
  estimatedTaxableIncome,  // the estimate for the WHOLE year of assessment
  age,
  employeesTax,            // optional, defaults to 0
  foreignTaxCredits,       // optional, defaults to 0
  medicalCredits,          // optional, defaults to 0
  priorPayments,           // optional, defaults to 0; must be 0 for 'first'
  basicAmount              // optional, null when the taxpayer has no assessment
}
```

## 5. Currency Routes (`/api`)
| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| GET | /currencies | Every currency the converter can offer, as `{ code, name, symbol }` | Yes | Built |
| GET | /rates?base=ZAR | Get latest exchange rates | No | Not built |
| GET | /convert?from=&to=&amount= | Convert amount between currencies (returns a quote, doesn't save) | Yes | Built |
| POST | /save | Save a conversion to history | Yes | Built |
| GET | /history | Get user's saved conversions, newest first (see history note) | Yes | Built |
| DELETE | /history/:id | Delete a saved conversion | Yes | Built |

## 6. Interest Routes (`/api/interest`)
| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| POST | /calculate | Calculate simple/compound interest (annual or monthly periods) | Yes | Built |
| POST | /save | Save calculation | Yes | Built |
| GET | /history | Get saved interest calculations, newest first (see history note) | Yes | Built |
| DELETE | /history/:id | Delete saved calculation | Yes | Built |
---
## 7. Export Routes (`/export`)
| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| GET | /taxHistory?format= | Download saved tax calculations as a file | Yes | Built |
| GET | /interestHistory?format= | Download saved interest calculations as a file | Yes | Built |
| GET | /currencyHistory?format= | Download saved conversions as a file | Yes | Built |

---
## 8. NOTES
**Auth note:** 
 - `/calculate` was planned as a public endpoint, but every calculator page sits behind `ProtectedUserRoute` and the already-implemented
 - `/api/convert` requires a token, so the calculate endpoints follow that same convention and require a JWT.

**`/save` recalculates.** 
All three save endpoints re-run the calculation from the submitted inputs and store their own figures, ignoring any totals sent by the browser. `/api/tax/save` and `/api/interest/save` recompute the maths; `/api/save` fetches its own exchange rate from the provider rather than storing the `rate` the browser sends. The user is taken from the JWT, never from the request body, and `fullName` is read from the database.

**History is scoped to the token, and capped.** 
`GET /history` and `DELETE /history/:id` on `/api/tax`, `/api/interest` and `/api` all filter on the user id in the JWT, never on an id from the request, so a user can only read and delete their own records. The delete matches `_id` and `user` in one query, so another user's record returns the same 404 as one that does not exist rather than a 403 that would confirm it exists. `GET /history` returns the newest 100 records with the response shape `{ success, total, limit, calculations }` — or `{ success, total, limit, conversions }` on `/api` — so compare `total` against the array's length to detect a truncated view. Because all three schemas set `toJSON: { virtuals: true }`, each returned record also carries its virtuals (`taxableIncome`, `netIncome`, `monthlyTax` for tax; `durationInYears`, `totalCapital` for interest; `convertedAmount` for currency).

A conversion history is READ-ONLY apart from the delete: nothing is refetched from Frankfurter, so each record reports the rate its own save fetched rather than being repriced at today's rate.

All three histories are now read by a saved-calculations list in the client — `CurrencyCalculations.js` on the converter page, `TaxCalculations.js` and `InterestCalculations.js` on the calculators page. The three share their behaviour through `client/src/utils/useCalculationsList.js` and their formatting through `client/src/utils/formatCalculations.js`, so a change to how a history is loaded, deleted or displayed applies to all three at once.

**`/provisional` follows the same two rules.**
`POST /provisional/save` recalculates from the submitted inputs and reads
`fullName` off the user record, and both history routes filter on the user id in
the JWT with the same single-query delete, so everything said above about
`/save` and about history applies to it unchanged. Its `GET /history` answers
`{ success, total, limit, calculations }`, each record carrying the
`totalCredits`, `overpaid` and `remainingForYear` virtuals. What it does **not**
have yet is a saved-calculations list in the client: `ProvTaxCalculations.js` is
still a stub, so provisional tax records can be written and read back through the
API but are not yet displayed on the CALCULATIONS page or offered as an export.

**The currency list comes from the provider, not from an array.**
Both currency routes go through [server/utils/currencyService.js](../server/utils/currencyService.js), the only module that talks to Frankfurter. `GET /currencies` serves what Frankfurter reports it supports (165 codes) with the response shape `{ success, live, total, currencies }`, and `/convert` validates `from` and `to` against that same list, so the codes the browser can pick and the codes the server accepts cannot drift apart. The list is cached in memory for 24 hours; each conversion fetches its own rate, so a rate written to history is the rate that was quoted. `live` is `false` when the list came from the offline snapshot in [server/dataArrays/currencies.js](../server/dataArrays/currencies.js), which is used only while the provider is unreachable. A `/convert` response also carries `date`, the day Frankfurter published the rate — except when `from` and `to` match, which short-circuits at a rate of 1 without calling out.

**Currency conversions are saved by the user, not by `/convert`.** 
`/convert` was planned as a POST with a matching `/save`. It is implemented as a GET that takes query params, and it used to write the `CurrencyConvert` history record itself as a best-effort side effect — so every conversion was kept whether the user wanted it or not. Now that the converter has a SAVE CALCULATION button, that implicit write has been removed: `/convert` only quotes, and `POST /api/save` is the only thing that writes a record. `/save` takes `{ amount, from, to }` as JSON, validates the codes against the same supported list as `/convert`, fetches its own rate, and responds `201` with `{ success, message, saved }` — where `saved` carries the record's `convertedAmount` virtual. A conversion between a currency and itself is stored at a rate of 1, matching the short-circuit in `/convert`.

`GET /api/history` and `DELETE /api/history/:id` are now built, so the currency calculations panel on the converter page reads and removes saved conversions through them. The client had been calling `DELETE /api/delete/:id`, which never existed; the delete lives under `/history/:id` to match `/api/tax` and `/api/interest`.

**Exports return a file, not JSON.**
The three `/export` routes answer with the file itself — `text/csv` or the XLSX media type, both sent as a `Content-Disposition: attachment` download — so only a failure comes back as JSON. `?format=` takes `csv` or `xlsx` and defaults to `csv`; anything else is a 400. Like the histories, an export is scoped to the user id in the JWT, and the figures are read straight off the saved documents (including their virtuals) rather than being recalculated, so a file says exactly what the calculator said when the record was saved. Where a history is capped at the newest 100 for the list on screen, an export takes the user's whole history up to a 5000-record ceiling, which is logged when it is hit. A user with nothing saved gets a 404 with a message rather than a file containing only headers, so an empty download cannot be mistaken for a broken one.

The client side of this is one shared component, [client/src/components/ExportForm.js](../client/src/components/ExportForm.js), rendered under each of the three saved-calculation lists with a `type` prop of `interest`, `tax` or `currency` that picks the endpoint and the filename. It reads the response as a blob and hands it to a temporary anchor to trigger the download. The filename is rebuilt client-side rather than read from `Content-Disposition`: the API is a different origin, so the browser will not expose that header to JavaScript unless the server lists it in `Access-Control-Expose-Headers`.

---

## 9. REFERENCES

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
- https://api.frankfurter.dev/v2/rates
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PATCH
- https://frankfurter.dev/