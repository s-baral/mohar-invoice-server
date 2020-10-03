const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwtGenerator = require("../utils/jwtGenerator");
const validInfo = require("../middleware/validInfo");
const authorization = require("../middleware/authorization");

//login route

router.post("/login", async (req, res) => {
  try {
    //1. destructrue the req.body

    const { username, password } = req.body;

    //2. check if user doesnot exist (if not then we throw error)

    const admin = await pool.query(
      "SELECT * FROM admin WHERE admin_username = $1",
      [username]
    );

    //res.json(loadagents.rows.length);

    if (admin.rows.length === 0) {
      return res.status(401).send("Password or username is Incorrect");
    }

    //3. Check if incoming password is the same as the database password

    if (password !== admin.rows[0].admin_password) {
      return res.status(401).send("Password or username is Incorrect");
    }
    //console.log(loadagents.rows);
    //console.log(validPassword);

    //4. give them the token

    const token = jwtGenerator(loadagents.rows[0].load_agent_id);
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
