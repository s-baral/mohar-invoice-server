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

    const inspector = await pool.query(
      "SELECT * FROM inspector WHERE inspector_username = $1",
      [username]
    );

    if (inspector.rows.length === 0) {
      return res.status(401).send("Password or username is Incorrect");
    }

    //3. Check if incoming password is the same as the database password

    const validPassword = await bcrypt.compare(
      password,
      inspector.rows[0].inspector_password
    );

    if (!validPassword) {
      return res.json({
        status: "NAK",
        data: "Password or username is Incorrect",
      });
    }

    //4. give them the token

    const token = jwtGenerator(inspector.rows[0].inspector_id);
    res.json({ status: "AK", data: token });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.get("/dashboard", authorization, async (req, res) => {
  try {
    //res.json(req.id);
    const inspector = await pool.query(
      "SELECT inspector_name FROM inspector WHERE inspector_id = $1",
      [req.id]
    );
    res.json({ status: "AK", data: inspector.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.get("/customer/:card_number", authorization, async (req, res) => {
  try {
    const { card_number } = req.params;

    const customer = await pool.query(
      "SELECT * FROM customer WHERE card_number = $1",
      [card_number]
    );
    if (customer.rows.length === 0) {
      return res.json({
        status: "NAK",
        data: "Invalid Card. Customer does not exist.",
      });
    }

    res.json({ status: "AK", data: customer.rows[0] });
    //res.json(customer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.get("/penalty-issue-rate", authorization, async (req, res) => {
  try {
    const penalty = await pool.query("SELECT * FROM penalty_reason");

    res.json({ status: "AK", data: penalty.rows });
    //res.json(customer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.post("/penalty", authorization, async (req, res) => {
  try {
    const { customer_id, penalty_reason_id } = req.body;

    const penalty = await pool.query(
      "INSERT INTO penalty (inspector_id, customer_id, penalty_reason_id) VALUES ($1, $2, $3) RETURNING * ",
      [req.id, customer_id, penalty_reason_id]
    );

    res.json({ status: "AK", data: penalty.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

module.exports = router;
