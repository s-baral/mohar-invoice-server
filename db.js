const Pool = require("pg").Pool;

const pool = new Pool({
  user: "shaksham",
  password: "shaksham",
  host: "localhost",
  port: 5432,
  database: "mohar_invoice",
});

module.exports = pool;
