const jwt = require("jsonwebtoken");
require("dotenv").config();

function jwtGenerator(id, role) {
  const payload = {
    id,
    role,
  };

  return jwt.sign(payload, process.env.jwtSecret, { expiresIn: "1hr" });
}

module.exports = jwtGenerator;
