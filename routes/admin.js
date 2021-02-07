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
      return res.json({
        status: "NAK",
        data: "Password or username is Incorrect",
      });
    }

    //3. Check if incoming password is the same as the database password

    if (password !== admin.rows[0].admin_password) {
      return res.json({
        status: "NAK",
        data: "Password or username is Incorrect",
      });
    }

    //4. give the token

    const token = jwtGenerator(admin.rows[0].admin_id);
    res.json({ status: "AK", data: token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.post(
  "/register/load-agent",
  authorization,
  validInfo,
  async (req, res) => {
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
      //console.log(newLoadagents);
      //const token = jwtGenerator(newLoadagents.rows[0].load_agent_id);

      res.json({ data: newLoadagents.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

router.post(
  "/register/inspector",
  authorization,
  validInfo,
  async (req, res) => {
    try {
      //1. Destructure the req.body (name, address, email, username, password, pos_id)
      const { name, address, email, username, password, pos_id } = req.body;

      //2. check if user exist (if user exists then throw error)

      const inspector = await pool.query(
        "SELECT * FROM inspector WHERE inspector_email = $1 OR inspector_username = $2",
        [email, username]
      );

      if (inspector.rows.length != 0) {
        return res.status(401).send("User already exist");
      }

      //res.json(loadagents.rows);

      //3. Bcrypt the user password
      const saltRound = 10;
      const salt = await bcrypt.genSalt(saltRound);
      const bcryptPassword = await bcrypt.hash(password, salt);

      //4. enter the new user inside our database

      const newInspector = await pool.query(
        "INSERT INTO inspector (inspector_name, inspector_address, inspector_email, inspector_username, inspector_password, pos_id ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING * ",
        [name, address, email, username, bcryptPassword, pos_id]
      );

      //res.json(newLoadagents.rows[0]);

      //5. generate our jwt token
      //console.log(newLoadagents);
      //const token = jwtGenerator(newLoadagents.rows[0].load_agent_id);

      res.json({ data: newInspector.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

router.post("/pos", authorization, async (req, res) => {
  try {
    const { pos_id, description } = req.body;

    const checkpos = await pool.query("SELECT * FROM pos WHERE pos_id = $1", [
      pos_id,
    ]);

    if (checkpos.rows.length != 0) {
      return res.json({
        status: "NAK",
        data: "The POS number already exist",
      });
    }

    const pos = await pool.query(
      "INSERT INTO pos (pos_id, pos_description) VALUES ($1, $2) RETURNING * ",
      [pos_id, description]
    );
    res.json({ status: "AK", data: pos.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.get("/pos", authorization, async (req, res) => {
  try {
    const pos = await pool.query("SELECT * FROM pos");
    res.json({ status: "AK", data: pos.rows });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.get("/pos/:pos_id", authorization, async (req, res) => {
  try {
    const { pos_id } = req.params;
    const pos = await pool.query("SELECT * FROM pos WHERE pos_id = $1", [
      pos_id,
    ]);
    res.json({ status: "AK", data: pos.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.put("/pos/:pos_id", authorization, async (req, res) => {
  try {
    const { pos_id } = req.params;
    const { new_pos_id, pos_description } = req.body;
    const checkpos = await pool.query("SELECT * FROM pos WHERE pos_id = $1", [
      pos_id,
    ]);

    if (checkpos.rows.length === 0) {
      return res.json({
        status: "NAK",
        data: "POS not found",
      });
    }
    const pos = await pool.query(
      "UPDATE pos SET pos_id = $1, pos_description = $2 WHERE pos_id = $3 RETURNING *",
      [new_pos_id, pos_description, pos_id]
    );
    console.log(pos.rows[0]);
    res.json({
      status: "AK",
      data: pos.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

// Commission
//Get all commission
router.get("/commission", authorization, async (req, res) => {
  try {
    const commission = await pool.query("SELECT * FROM commission");
    res.json({ status: "AK", data: commission.rows });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//Post new commission
router.post("/commission", authorization, async (req, res) => {
  try {
    const { commission_type, commission_percentage, amount } = req.body;

    const checkcommission = await pool.query(
      "SELECT * FROM commission WHERE commission_type = $1",
      [commission_type]
    );

    if (checkcommission.rows.length != 0) {
      return res.json({
        status: "NAK",
        data: "The commission type already exist",
      });
    }

    const commission = await pool.query(
      "INSERT INTO commission (commission_type, commission_percentage, amount) VALUES ($1, $2, $3) RETURNING * ",
      [commission_type, commission_percentage, amount]
    );
    res.json({ status: "AK", data: commission.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//get Single commission

router.get("/commission/:commission_id", authorization, async (req, res) => {
  try {
    const { commission_id } = req.params;
    const commission = await pool.query(
      "SELECT * FROM commission WHERE commission_id = $1",
      [commission_id]
    );
    res.json({ status: "AK", data: commission.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//Update Commission

router.put("/commission/:commission_id", authorization, async (req, res) => {
  try {
    const { commission_id } = req.params;
    const { commission_percentage, amount } = req.body;
    const checkcommission = await pool.query(
      "SELECT * FROM commission WHERE commission_id = $1",
      [commission_id]
    );

    if (checkcommission.rows.length === 0) {
      return res.json({
        status: "NAK",
        data: "commission type not found",
      });
    }
    const commission = await pool.query(
      "UPDATE commission SET commission_percentage = $1, amount = $2 WHERE commission_id = $3 RETURNING *",
      [commission_percentage, amount, commission_id]
    );
    console.log(commission.rows[0]);
    res.json({
      status: "AK",
      data: commission.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});
module.exports = router;
