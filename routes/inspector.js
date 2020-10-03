const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwtGenerator = require("../utils/jwtGenerator");
const validInfo = require("../middleware/validInfo");

//register route

router.post("/register", validInfo, async (req, res) => {
  try {
    //1. Destructure the req.body (name, address, email, username, password, pos_id)
    const { name, address, email, username, password, pos_id } = req.body;

    //2. check if user exist (if user exists then throw error)

    const loadagents = await pool.query(
      "SELECT * FROM load_agent WHERE load_agent_email = $1 OR load_agent_username = $2",
      [email, username]
    );

    if (loadagents.rows.length != 0) {
      return res.status(401).send("User already exist");
    }

    //res.json(loadagents.rows);

    //3. Bcrypt the user password
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    //4. enter the new user inside our database

    const newLoadagents = await pool.query(
      "INSERT INTO load_agent (load_agent_name, load_agent_address, load_agent_email, load_agent_username, load_agent_password, pos_id ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING * ",
      [name, address, email, username, bcryptPassword, pos_id]
    );

    //res.json(newLoadagents.rows[0]);

    //5. generate our jwt token
    console.log(newLoadagents);
    const token = jwtGenerator(newLoadagents.rows[0].load_agent_id);

    res.json({ token, data: newLoadagents.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//login route

router.post("/login", validInfo, async (req, res) => {
  try {
    //1. destructrue the req.body

    const { username, password } = req.body;

    //2. check if user doesnot exist (if not then we throw error)

    const loadagents = await pool.query(
      "SELECT * FROM load_agent WHERE load_agent_username = $1",
      [username]
    );

    if (loadagents.rows.length === 0) {
      return res.status(401).send("Password or username is Incorrect");
    }

    //3. Check if incoming password is the same as the database password

    const validPassword = await bcrypt.compare(
      password,
      loadagents.rows[0].load_agent_password
    );

    if (!validPassword) {
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

module.exports = router;
