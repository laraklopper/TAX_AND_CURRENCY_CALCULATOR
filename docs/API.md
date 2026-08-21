# API ENDPOINT PLAN
### Auth Routes (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /register | Create new user | No |
| POST | /login | Authenticate, return JWT | No |
| POST | /refresh | Refresh access token | No (refresh token) |
| POST | /logout | Invalidate refresh token | Yes |
| GET | /me | Get current user profile | Yes |

### Tax Routes (`/api/tax`)
| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| GET | /config | Available tax years + active year's brackets/rebates/thresholds | Yes | Built |
| POST | /calculate | Calculate tax (returns result, doesn't save) | Yes | Built |
| POST | /save | Save a calculation to user history | Yes | Built |
| GET | /history | Get user's saved tax calculations | Yes | Not built |
| DELETE | /history/:id | Delete a saved calculation | Yes | Not built |

### Currency Routes (`/api/currency`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /rates?base=ZAR | Get latest exchange rates | No |
| POST | /convert | Convert amount between currencies | No |
| POST | /save | Save a conversion to history | Yes |
| GET | /history | Get user's saved conversions | Yes |

### Interest Routes (`/api/interest`)
| Method | Endpoint | Description | Auth | Status |
|---|---|---|---|---|
| POST | /calculate | Calculate simple/compound interest (annual or monthly periods) | Yes | Built |
| POST | /save | Save calculation | Yes | Built |
| GET | /history | Get saved interest calculations | Yes | Not built |
| DELETE | /history/:id | Delete saved calculation | Yes | Not built |

> **Auth note:** `/calculate` was planned as a public endpoint, but every
> calculator page sits behind `ProtectedUserRoute` and the already-implemented
> `/api/convert` requires a token, so the calculate endpoints follow that same
> convention and require a JWT.

> **`/save` recalculates.** Both save endpoints re-run the calculation from the
> submitted inputs and store their own figures, ignoring any totals sent by the
> browser. The user is taken from the JWT, never from the request body.

---

## REFERENCES

- https://currencyfreaks.com/