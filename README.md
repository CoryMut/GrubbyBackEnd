# Express-Jobly

Optional .env example file, however if the secret key is changed, the fake users I added for convenience will not be able to login.

The password for both fake users is 'password'.

Fake User 1 : 
```json
{
  "username" : "FirstJoblyUser",
  "password" : "password"
}
```
FirstJoblyUser is an admin.

Fake User 2 :
```json
{
  "username" : "NotAnAdmin",
  "password" : "password"
}
```
NotAnAdmin is, shockingly, not an admin.

Use ***npm install*** to get all dependencies. 

Use ***npm run seed*** to seed both the production database and the test database. 

Use ***npm run start*** to start the app. 

User ***npm run test*** to test the app. This uses jest and runs the tests in band. 

Most routes require authentication except for the users routes where only PATCH, and DELETE requests require authentication.

To authenticate, submit a POST request to '/login' with an attached username and password in the body.

If you wish to make a new user, submit a POST request to '/users' like so:
```json
{
  "username" : "NotAnAdmin",
  "password" : "password",
  "first_name" : "Test",
  "last_name" : "User",
  "email" : "testuser@exmaple.com",
  "photo_url" : "optional",
  "is_admin" : false
}
```

Valid credentials to both '/login' and '/register' will result in a token being issued. Attach this token with the key of "_token" to the request body to access protected routes. 

An example to access '/jobs':
```json
{
  "_token" : "$2b$12$BGk58xcbZ6EQf09SnvbypeVmKgXjql1lMOIjDAhxegknIMw.ABmTu"
}
```
