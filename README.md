# TAX_AND_CURRENCY_CALCULATOR

## OVERVIEW
---
The application is a tax and currency converter calculator. The application is written using MERN stack which is a popular open source JavaScript-based developer friendly web stack. MERN stack uses MongoDB (a NoSQL database), to handle the database, React.js to create the front-end, Express.js to create the backend and uses Node.js as the runtime environment.

All financial (tax and interest) calculations are calculated in terms of South African tax and interest rates
**TARGET USERS**
The target users are `individuals`, `Freelances`, `Small Business owners`, `Students in South Africa who want a quick, reliable all-in-one financial calculator`.



<!-- Target  -->
---
## TABLE OF CONTENTS

1. [HOW TO USE THE APPLICATION](#1-how-to-use-the-application)
2. [HOW TO RUN THE APPLICATION](#2-how-to-run-the-application)
    - 2.1. [Terminal (`CLI`)](#21-terminal-cli)
    - 2.2. [Database Connection](#22-database-connection)
3. [APPLICATION FEATURES](#3-appliction-features)
- View [GLOSSARY.md](GLOSSARY.md) for terminology.
----
## 1. HOW TO USE THE APPLICATION
To use the application users are required to register(sign up) and login subject to certain age restrictions controlled by custom middleware. Users are also able to register as admin users for `RBAC` providing admin users with certain priveliges. To register as an admin user users are also subject to certain age restriction.
 
## 2. HOW TO RUN THE APPLICATION

A proxy server is included in the front-end to allow the front and back-end to run together. The application uses ‘nodemon’ third-party middleware in the backend to allow the application to run the backend and front-end in the command line interface(CLI) or terminal using npm start. 

The folders must, however, be run separately. The server is started (listens) on the port specified in the .env file using app.listen() in the app.js file or defaults to Port 3001.

### 2.1. Terminal (`CLI`)

NPM (Node Package Manager) is the default package manager for Node.js.  

**Server** (`runs on port 3001 by default`):
```bash
 cd server
 npm start
```

**Client** (`runs on port 3000 by default`):
```bash
 cd client
 npm start
```
### 2.2 Database connection

The application is connected to the MongoDB database using mongoose third party middleware in the backend. The code uses `mongoose.connect()` to establish a connection with the MongoDB database.

The MongoDB connection URI is constructed using the database name and MongoDB cluster URL. These are stored in the `.env` file which stores sensitive information.


## 3. APPLICTION FEATURES

### 3.1. 

 **HTTP Verb** | **CRUD Operation** | **Description** |
|--------|-------|------|
| POST | CREATE | Used to submit data about a specific entity to the server |
| GET | READ | Used to fetch information from the database |
| PUT | UPDATE | Full replacement update of a resource on the database |
| PATCH | UPDATE | Partial update of a resource on the database |
| DELETE | DELETE | Deletes a specific resource |

The application also integrates external APIs via server-side proxy routes:

- *Frankfurter* — live currency conversion rates. Free and keyless, aggregating published rates from 84 central banks.

### 3.2. Financial Tools

- **Currency converter** — backed by the live Frankfurter API.
- **Basic calculator** — general arithmetic expression evaluator with full keyboard support.
- **Interest calculator** — simple interest from principal, rate, and time period (months).
- **Tax calculator** — computes tax and total from an amount and tax rate (defaults to the South African 15% VAT rate).

### 3.3. Data Export

Each saved-calculation list (tax, interest, currency conversions) can be downloaded as a **CSV** or an **EXCEL (.xlsx)** file through the `/export` routes. The file is generated on the server from the saved records, so the figures in it are the ones the calculator showed when the record was saved — nothing is recalculated on export. An export covers the user's whole history rather than the newest 100 the list shows on screen.

### 3.4. SECURITY
- All api routes that require authentication expect a `Bearer <token>` value in the Authorization header except the  `/auth`

## REFERENCES
- https://www.jse.co.za/learn-how-to-invest/what-interest
- https://react-bootstrap.netlify.app/
- https://fonts.google.com/
- https://lucide.dev/guide/react/
- https://www.w3schools.com/colors/colors_groups.asp
- https://color.adobe.com/create/color-wheel