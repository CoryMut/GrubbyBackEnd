# GrubbyBackEnd
Node and Express Back End for https://beta.grubbythegrape.com/


Hello!

This repository contains the back-end for the Grubby the Grape website, hosted at https://beta.grubbythegrape.com/.

The back-end was made using Node and Express and features routes for viewing and uploading comics as well as basic user routes for creating users.

SOme routes require authentication/authorization (such as for uploading comics) that use httpOnly cookies while the user routes use tokens for convenience on the front-end.

The comics are stored in CDN hosted by DigitalOcean and the API is also hosted on DigitalOcean using the App Platform service.

Back-End Stack:
- PostgreSQL
- Node.js
- Express
- DigitalOcean Spaces
- Hosted using DigitalOcean App Platform
