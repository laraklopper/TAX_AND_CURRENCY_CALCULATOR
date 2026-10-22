# APPLICATION PROGRAMMING INTERFACE(API)




## TABLE OF CONTENTS
1. [OVERVIEW]
2. [APPLICATION API TYPES]()
3. 
  - [3.1. Auth Routes]()
  - [3.2. User Routes](#1-user-routes-users)
  - [Tax Routes](#3-tax-routes-apitax)
  - [Provisional Tax Routes](#4-provisional-tax-routes-provisional)
  - [Interest Routes](#6-interest-routes-apiinterest)
  - [Export Routes](#7-export-routes-export)
  - [Currency Routes](#5-currency-routes-api)
4. [References](#9-references)


## 1. OVERVIEW

An API (Application Programming Interface) is a set of rules that allows different software applications to communicate with each other. It provides a structured way for one application to request data or functionality from another application. HTTP defines a set of request methods to indicate the purpose of the request and what is expected if the request is successful. 

### 1.1. API KEYS

### 1.2. API MEDIA TYPES

A media type (formerly known as a Multipurpose Internet Mail Extensions or MIME type) describe the format of data sent or received by an API.

All endpoints in the application except `/export` use `application/json` as the media type. The request `Content-Type` header indicates the media type used in the request.

## 2. APPLICATION API TYPES

### 2.1. REST API's

A `REST`  API is an API that follows REST principles that allows communication between clients and servers using standard HTTP methods. 
REST servers don’t store client session state. Each request is treated as new. The client must send everything the server needs — including auth — with every request. 

| **HTTP Verb** | **CRUD Operation** | **Description** |
|--------|-------|------|
| POST | CREATE | Used to submit data about a specific entity to the server |
| GET | READ | Used to fetch information from the database |
| PUT | UPDATE | Full replacement update of a resource on the database |
| DELETE | DELETE | Deletes a specific resource |

The application uses `PATCH` requests instead of `PUT` requests for updating resources/documents in the database because all update requests only partially update a resource/document in the database.

### 2.2. EXTERNAL API's 

The application integrates external APIs via server-side proxy routes:

The application uses *Frankfurter* as an external API for exchange rate and currency data. It does not require an `API key`. Frankfurter is a free exchange rates API for 223 currencies from 105 central banks and official sources. Rates update daily and go back to 1948. In JavaScript *Frankfurter* convert rates with the built-in fetch and format any currency with `Intl`, in the browser or Node.

## 3. APPLICATION API ENDPOINTS

All APIs require a JWT `Authorization: Bearer <token>` in the header except `/auth/login`, `/auth/register`. The 

### 3.1. Auth Routes (`/auth`)

- auth endpoints : mounted at `/auth` by app.js

| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| POST | /register | Create new user | No | Built |
| POST | /login | Authenticate, return JWT | No | Built |
| PATCH | /setAdmin | Upgrade a logged In user to admin status |Built |
| POST | /refresh | Refresh access token | No (refresh token) | Not built |
| POST | /logout | Invalidate refresh token | Yes | Not built |

- [authRoutes.js](../server/routes/authRoutes.js)

### 3.2. User Routes (`/users`)
| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| GET | /me | Get current user profile | Yes | Built |
| GET |/fetchUsers| Fetch all users | Yes | Built |
| PATCH | /editUser | update user details | Yes | Built |
| PATCH |/editPassword | Edit user password |Yes| Built |
| DELETE | /deleteUser/:id | Delete a user (admin only) | Yes (admin) | Built |

- [userRoutes.js](../server/routes/userRoutes.js)

### 3.3. Tax Routes (`/api/tax`)

| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| GET | /config | Available tax years + active year's brackets/rebates/thresholds | Yes | Built |
| POST | /calculate | Calculate tax (returns result, doesn't save) | Yes | Built |
| POST | /save | Save a calculation to user history | Yes | Built |
| GET | /history | Get user's saved tax calculations, newest first (see history note) | Yes | Built |
| DELETE | /history/:id | Delete a saved calculation | Yes | Built |

- [taxRoutes.js](../server/routes/taxRoutes.js)

### 3.4. Provisional Tax Routes (`/provisional`)

- Provisional tax `(IRP6)` endpoints, mounted at /provisional by app.js.

| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| POST | /calculate | Calculate one IRP6 payment (returns result, doesn't save) | Yes | Built |
| POST | /save | Save a calculation to user history | Yes | Built |
| GET | /history | Get user's saved provisional tax calculations, newest first | Yes | Built |
| DELETE | /history/:id | Delete a saved calculation | Yes | Built |

- [provisionalTaxRoutes.js](../server/routes/provisionalTaxRoutes.js)

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
### 3.5. Interest Routes (`/api/interest`)

- Interest calculator endpoints, mounted at `/interest` by app.js.

| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| POST | /calculate | Calculate simple/compound interest (annual or monthly periods) | Yes | Built |
| POST | /save | Save calculation | Yes | Built |
| GET | /history | Get saved interest calculations, newest first (see history note) | Yes | Built |
| DELETE | /history/:id | Delete saved calculation | Yes | Built |


### 3.6. Export Routes (`/export`)

- Export Routes: mounted at `/export` by app.js

| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| GET | /taxHistory?format= | Download saved tax calculations as a file | Yes | Built |
| GET | /interestHistory?format= | Download saved interest calculations as a file | Yes | Built |
| GET | /currencyHistory?format= | Download saved conversions as a file | Yes | Built |

Exports return a file, not JSON. The requests export the file as excel csv or xlsx file.

### 3.7.  VAT Routes (`/vat`)

- VAT endpoints, mounted at /vat by app.js.

| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
|POST|/calculate |Works out the VAT on one amount (saves nothing)| Yes ||
| POST | /save | Saves a calculation to the logged in user's history | Yes | |
| GET |/history | Fetches all the saved VAT calculations| Yes | |
| DELETE | /history/:id | Removes one of the logged in user's saved calculations| Yes ||
- [vatRoutes.js](../server/routes/vatRoutes.js)

### 3.7. Currency Routes (`/api`)

- Currency endpoints, mounted at `/api` by app.js.

The `/api` route endpoint is uses *Frankfurter* to fetch live currency conversion rates. 

| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| GET | /currencies | Every currency the converter can offer, as `{ code, name, symbol }` | Yes | Built |
| GET | /rates?base=ZAR | Get latest exchange rates | No | Not built |
| GET | /convert?from=&to=&amount= | Convert amount between currencies (returns a quote, doesn't save) | Yes | Built |
| POST | /save | Save a conversion to history | Yes | Built |
| GET | /history | Get user's saved conversions, newest first (see history note) | Yes | Built |
| DELETE | /history/:id | Delete a saved conversion | Yes | Built |

- [apiRoutes.js](../server/routes/apiRoutes.js)
---

## 4. REFERENCES


- https://www.geeksforgeeks.org/node-js/rest-api-introduction/
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
- https://api.frankfurter.dev/v2/rates
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PATCH
- https://frankfurter.dev/
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Type