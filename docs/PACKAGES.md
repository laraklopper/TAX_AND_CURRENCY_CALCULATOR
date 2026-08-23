## PACKAGES

## TABLE OF CONTENTS

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

### 2.1 SERVER-SIDE(BACK-END)

| _PACKAGE_ | _CLI / TERMINAL_ | _PURPOSE_ | _VERSION_ |
|-----------|-----------------|-----------|-----------|
| bcrypt | `npm install bcrypt` | Password hashing and encryption | 6.0.0 |
| cors | `npm install cors` | Cross-Origin Resource Sharing middleware | 2.8.6 |
| csv-parser | `npm install csv-parser` | Streaming CSV file parser | 3.2.1 |
| csv-stringify | `npm install csv-stringify` | CSV file generation and serialisation | 6.7.0 |
| dotenv | `npm install dotenv` | Loads environment variables from `.env` file | 17.4.2 |
| express | `npm install express` | Web application framework | 5.2.1 |
| express-rate-limit | `npm install express-rate-limit` | Rate limiting middleware for Express | 8.5.2 |
| helmet | `npm install helmet` | Sets secure HTTP response headers | 8.2.0 |
| jsonwebtoken | `npm install jsonwebtoken` | JSON Web Token creation and verification | 9.0.3 |
| mongoose | `npm install mongoose` | MongoDB object modelling (ODM) | 9.6.3 |
| mongoose-autopopulate | `npm install mongoose-autopopulate` | Auto-populates Mongoose document references | 1.2.1 |
| nodemailer | `npm install nodemailer` | Sends transactional emails via SMTP (password reset) | 9.0.1 |
| nodemon | `npm install nodemon` | Automatically restarts server on file changes | 3.1.14 |
| supertest | `npm install supertest` | HTTP server testing library | 7.2.2 |
| xlsx | `npm install xlsx` | Excel and spreadsheet file parsing and generation | 0.18.5 |

### 2.2 CLIENT-SIDE(FRONT-END)