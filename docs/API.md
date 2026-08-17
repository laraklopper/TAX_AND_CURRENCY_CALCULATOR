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
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /calculate | Calculate tax (returns result, doesn't save) | No |
| POST | /save | Save a calculation to user history | Yes |
| GET | /history | Get user's saved tax calculations | Yes |
| DELETE | /history/:id | Delete a saved calculation | Yes |

### Currency Routes (`/api/currency`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | /rates?base=ZAR | Get latest exchange rates | No |
| POST | /convert | Convert amount between currencies | No |
| POST | /save | Save a conversion to history | Yes |
| GET | /history | Get user's saved conversions | Yes |

### Interest Routes (`/api/interest`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | /calculate | Calculate simple/compound interest | No |
| POST | /save | Save calculation | Yes |
| GET | /history | Get saved interest calculations | Yes |
| DELETE | /history/:id | Delete saved calculation | Yes |

---

## REFERENCES

- https://currencyfreaks.com/