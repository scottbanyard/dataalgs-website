This is *dataalgs*, a Data Structures and Algorithms website intended as a childrens' learning resource. It revolves around user-created pages and images.

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

- Page Creation for private or public viewing and editing, where a <a href="https://github.com/inacho/bootstrap-markdown-editorMarkdown">Markdown Editor</a> is found on the front-end and a custom Markdown parser within the back-end. The source code for the parser can be found within *markdown.ts*.
- Image Creation using a HTML canvas element where squares, circles, lines, arrows and text are supported.
- Secure HTTPS connection using self-signed certificates generated with <a href="https://www.openssl.org/">OpenSSL</a>.
- Token Authentication using <a href="https://github.com/auth0/node-jsonwebtoken">JSON Web Tokens</a>, encrypted to prevent client-side tampering.
- An embedded database for storing user data using <a href="https://github.com/mapbox/node-sqlite3">sqlite3</a>.  
- Comment System within pages.
- User Account tools such as changing password, deleting your account and changing profile icon.

# API

All documentation for our custom API, created using the <a href="https://expressjs.com/">Express</a> framework, is included using comments within **api.ts**.

# Contributors

* [Scott Banyard](https://github.com/scottbanyard)
* [Chris Beale](https://github.com/factorem)
