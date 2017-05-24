This is *dataalgs*, a Data Structures and Algorithms website intended as a childrens' learning resource. It revolves around user-created pages and images.

The stack for this site is [AngularJS](https://angularjs.org/) client-side, [Node.js](https://nodejs.org/en/) server-side using the [Express.js](https://expressjs.com/) web-application framework, and an embedded SQL Database using [sqlite3](https://github.com/mapbox/node-sqlite3). We have used [TypeScript](https://github.com/Microsoft/TypeScript) throughout all non-Angular code, so as to leverage the advantages offered to programmers by some manner of compile-time type-checking.

# Dependencies

- Node.js server requires [node](https://nodejs.org/en/download/).
- To run the server one must also have the Node.js package ecosystem, **npm**, which is included in the install of node above.
- No Internet required! All libraries are locally included within a dependencies folder.

# Installing

To download and install the website, either:

* Git Clone to a directory: **git clone https://github.com/scottbanyard/dataalgs-website.git**
* Download the ZIP and uncompress.

# Usage

- Open up **terminal**.
- Run the command `npm install` to install all required node modules that the site needs.
- To start the server, run the command `npm start`.
- Access the website via <a href="https://localhost:8080">https://localhost:8080</a>.

# Features

- Page Creation for private or public viewing and editing, where a [Bootstrap Markdown Editor](https://github.com/inacho/bootstrap-markdown-editor) is found on the front-end and a custom Markdown parser in the back-end.
- Image Creation using a HTML canvas element where squares, circles, lines, arrows and text are supported.
- Secure HTTPS connection using self-signed certificates generated with [OpenSSL](https://www.openssl.org/).
- Token Authentication using [JSON Web Tokens](https://github.com/auth0/node-jsonwebtoken), encrypted to prevent client-side tampering.
- An embedded database for storing user data using [sqlite3](https://github.com/mapbox/node-sqlite3).
- Comment System within pages.
- User Account tools such as changing password, deleting your account and changing profile icon.

# API

All documentation for our custom API is included using comments [here](https://github.com/scottbanyard/dataalgs-website/blob/master/scripts/api.ts).

# Contributors

* [Scott Banyard](https://github.com/scottbanyard)
* [Chris Beale](https://github.com/factorem)
