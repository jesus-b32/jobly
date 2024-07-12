const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** return signed JWT from user data. */

function createToken(user) {
  console.assert(user.isAdmin !== undefined,
      "createToken passed user without isAdmin property");

  let payload = {
    username: user.username,
    isAdmin: user.isAdmin || false,
  };

  return jwt.sign(payload, SECRET_KEY);
}

const testAdmin = {
  username: "testadmin",
  password: "$2b$12$AZH7virni5jlTTiGgEg4zu3lSvAw68qVEfSIOjJ3RqtbJbdW/Oi5q",
  firstName: "Test",
  lastName: "Admin!",
  email: "joel@joelburton.com",
  isAdmin: true
}

console.log("test admin token: ", createToken(testAdmin));
// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3RhZG1pbiIsImlzQWRtaW4iOnRydWUsImlhdCI6MTcyMDc2MjYyN30.If6zm48R1t28iSJ3MyxVzkScrJBdo-8wMyqMtguYSTQ

module.exports = { createToken };
