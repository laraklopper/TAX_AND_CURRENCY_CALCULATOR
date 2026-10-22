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
| PATCH | /setAdmin | Upgrade a logged In user to admin status |Built |
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


## 8. REFERENCES

- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
- https://api.frankfurter.dev/v2/rates
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PATCH
- https://frankfurter.dev/