# PACKAGES

## TABLE OF CONTENTS
1. [NODE PACKAGE MANAGER (NPM)](#1-node-package-manager-npm)
   - 1.1. [NPM COMMANDS](#11-npm-commands)
2. [APPLICATION PACKAGES](#2-application-packages)
   - 2.1. [SERVER-SIDE (BACK-END)](#21-server-side-back-end)
   - 2.2. [CLIENT-SIDE (FRONT-END)](#22-client-side-front-end)
3. [PROJECT SCRIPTS](#3-project-scripts)
   - 3.1. [SERVER SCRIPTS](#31-server-scripts)
   - 3.2. [CLIENT SCRIPTS](#32-client-scripts)

## 1. NODE PACKAGE MANAGER (NPM)

NPM (Node Package Manager) is the default package manager for Node.js. It is used to install, manage, and share JavaScript packages. Each layer of this application (client and server) has its own `package.json` file that lists its dependencies.

### 1.1. NPM COMMANDS

| **COMMAND** | **PURPOSE** |
|---|---|
| `npm init` | Initialises a new Node.js project and creates a package.json file interactively, which stores metadata and dependencies for the project. |
| `npm install` | Installs all the dependencies listed in the package.json file for your project. This command reads the package.json and installs the necessary packages in a folder called node_modules. |
| `npm install <package_name>` | Installs a specific package as a project dependency. For example, `npm install express` installs the Express framework. |
| `npm install <package_name> --save-dev` | Installs a package as a development dependency. Development dependencies are used during the development process but are not required in the production environment. The `--save-dev` flag saves the package in the devDependencies section of the package.json file. |
| `npm uninstall <package_name>` | Uninstalls a package from the project. |
| `npm update` | Updates all the packages in your project to their latest versions, respecting the version range specified in package.json. |
| `npm update <package_name>` | Updates a specific package to its latest version. |
| `npm outdated` | Checks for outdated packages in your project. |
| `npm run <script_name>` | Executes a script defined in the scripts section of the package.json file. Common scripts include start, test, and build. |
| `npm publish` | Publishes your package to the npm registry, making it available for others to install and use. |
| `npm search <package_name>` | Searches the npm registry for packages matching the given name. |
| `npm info <package_name>` | Displays detailed information about a package. |
| `npm test` | Tests a package. |
| `npm stop` | Stops a package. |
| `node -v` | Check if Node.js & npm are installed correctly (e.g. v20.11.0). |
| `npm -v` | Check the version of npm. |

---

## 2. APPLICATION PACKAGES

### 2.1. SERVER-SIDE (BACK-END)

Installed from the `server` directory.

| _PACKAGE_ | _CLI / TERMINAL_ | _PURPOSE_ | _VERSION_ |
|-----------|-----------------|-----------|-----------|
| bcrypt | `npm install bcrypt` | Password hashing and encryption | ^6.0.0 |
| cors | `npm install cors` | Cross-Origin Resource Sharing middleware | ^2.8.6 |
| csv-parser | `npm install csv-parser` | Streaming CSV file parser | ^3.2.1 |
| csv-stringify | `npm install csv-stringify` | CSV file generation and serialisation | ^6.8.3 |
| dotenv | `npm install dotenv` | Loads environment variables from `.env` file | ^17.4.2 |
| express | `npm install express` | Web application framework | ^5.2.1 |
| express-rate-limit | `npm install express-rate-limit` | Rate limiting middleware for Express | ^8.6.2 |
| helmet | `npm install helmet` | Sets secure HTTP response headers | ^8.3.0 |
| jsonwebtoken | `npm install jsonwebtoken` | JSON Web Token creation and verification | ^9.0.3 |
| mongoose | `npm install mongoose` | MongoDB object modelling (ODM) | ^9.9.1 |
| mongoose-autopopulate | `npm install mongoose-autopopulate` | Auto-populates Mongoose document references | ^1.2.1 |
| nodemailer | `npm install nodemailer` | Sends transactional emails via SMTP (password reset) | ^9.0.5 |
| nodemon | `npm install nodemon` | Automatically restarts server on file changes | ^3.1.14 |
| supertest | `npm install supertest` | HTTP server testing library | ^7.2.2 |
| xlsx | `npm install xlsx` | Excel and spreadsheet file parsing and generation | ^0.18.5 |

### 2.2. CLIENT-SIDE (FRONT-END)

Installed from the `client` directory. The client was bootstrapped with Create React App, so `react-scripts` provides the build, development server and test runner.

| _PACKAGE_ | _CLI / TERMINAL_ | _PURPOSE_ | _VERSION_ |
|-----------|-----------------|-----------|-----------|
| @testing-library/dom | `npm install @testing-library/dom` | Core DOM querying utilities used by the other Testing Library packages | ^10.4.1 |
| @testing-library/jest-dom | `npm install @testing-library/jest-dom` | Custom Jest matchers for asserting on DOM state (e.g. `toBeInTheDocument`) | ^6.9.1 |
| @testing-library/react | `npm install @testing-library/react` | Renders and queries React components in tests | ^16.3.2 |
| @testing-library/user-event | `npm install @testing-library/user-event` | Simulates real user interactions (typing, clicking) in tests | ^13.5.0 |
| bootstrap | `npm install bootstrap` | CSS framework providing the base styling and grid system | ^5.3.8 |
| lucide-react | `npm install lucide-react` | Icon set delivered as React components | ^1.31.0 |
| mathjs | `npm install mathjs` | Parses and evaluates mathematical expressions for the general calculator | ^15.2.0 |
| react | `npm install react` | Core UI library for building the component tree | ^19.2.8 |
| react-bootstrap | `npm install react-bootstrap` | Bootstrap components rebuilt as React components | ^2.10.10 |
| react-dom | `npm install react-dom` | Renders React components into the browser DOM | ^19.2.8 |
| react-router-dom | `npm install react-router-dom` | Client-side routing and navigation between pages | ^7.18.2 |
| react-scripts | `npm install react-scripts` | Create React App tooling (dev server, Webpack build, Jest test runner) | 5.0.1 |
| recharts | `npm install recharts` | Charts and graphs for visualising calculation results | ^3.10.1 |
| web-vitals | `npm install web-vitals` | Measures Core Web Vitals performance metrics | ^2.1.4 |

---

## 3. PROJECT SCRIPTS

Scripts are run with `npm run <script_name>` from the directory that owns the `package.json`.

### 3.1. SERVER SCRIPTS

| _SCRIPT_ | _COMMAND_ | _PURPOSE_ |
|---|---|---|
| `npm start` | `nodemon app.js` | Starts the Express server and restarts it automatically on file changes. |

### 3.2. CLIENT SCRIPTS

| _SCRIPT_ | _COMMAND_ | _PURPOSE_ |
|---|---|---|
| `npm start` | `react-scripts start` | Starts the development server on `http://localhost:3000`, proxying API requests to `http://localhost:3001`. |
| `npm run build` | `react-scripts build` | Creates an optimised production build in the `build` folder. |
| `npm test` | `react-scripts test` | Runs the test suite in watch mode. |
| `npm run eject` | `react-scripts eject` | Permanently exposes the underlying build configuration. This cannot be undone. |

