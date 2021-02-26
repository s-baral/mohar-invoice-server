const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwtGenerator = require("../utils/jwtGenerator");
const validInfo = require("../middleware/validInfo");
const authorization = require("../middleware/authorization");
const USER_ROLES = require("../utils/constants");

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

    const token = jwtGenerator(
      inspector.rows[0].inspector_id,
      USER_ROLES.INSPECTOR
    );
    res.json({ status: "AK", data: token });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.get(
  "/dashboard",
  authorization(USER_ROLES.INSPECTOR),
  async (req, res) => {
    try {
      //res.json(req.id);
      const inspector = await pool.query(
        "SELECT inspector.inspector_id, inspector.inspector_name, inspector.inspector_username, inspector.inspector_address, inspector.inspector_email, inspector.inspector_pan, inspector.inspector_citizenship_number, inspector.pos_id FROM inspector WHERE inspector.inspector_id = $1",
        [req.id]
      );
      res.json({ status: "AK", data: inspector.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

router.get(
  "/customer/:card_number",
  authorization(USER_ROLES.INSPECTOR),
  async (req, res) => {
    try {
      const { card_number } = req.params;

      const customer = await pool.query(
        "SELECT customer.customer_id, customer.customer_name, customer.customer_address, customer.card_number, card_type.card_type, customer.contact_number FROM customer INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id WHERE customer.card_number = $1",
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
  }
);

router.get(
  "/penalty-issue-rate",
  authorization(USER_ROLES.INSPECTOR),
  async (req, res) => {
    try {
      const penalty = await pool.query("SELECT * FROM penalty_reason");

      res.json({ status: "AK", data: penalty.rows });
      //res.json(customer.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

router.post(
  "/penalty",
  authorization(USER_ROLES.INSPECTOR),
  async (req, res) => {
    try {
      const { customer_id, penalty_reason_id } = req.body;

      const penalty = await pool.query(
        "INSERT INTO penalty (inspector_id, customer_id, penalty_reason_id) VALUES ($1, $2, $3) RETURNING * ",
        [req.id, customer_id, penalty_reason_id]
      );

      const penalty_new = await pool.query(
        "SELECT inspector.inspector_name, pos.pos_id, customer.customer_name, customer.contact_number, card_type.card_type, customer.card_number, penalty_reason.issue, penalty_reason.penalty_amount, penalty.transaction_date FROM penalty INNER JOIN inspector ON inspector.inspector_id = $1 INNER JOIN customer ON customer.customer_id = $2 INNER JOIN pos ON pos.pos_id = inspector.pos_id INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id INNER JOIN penalty_reason ON penalty_reason.penalty_reason_id = $3 WHERE penalty.penalty_id = $4",
        [req.id, customer_id, penalty_reason_id, penalty.rows[0].penalty_id]
      );

      res.json({ status: "AK", data: penalty_new.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Get penalty details of inspector
router.get(
  "/penalty-details",
  authorization(USER_ROLES.INSPECTOR),
  async (req, res) => {
    try {
      const inspector = await pool.query(
        "SELECT penalty.penalty_id, pos.pos_id, customer.customer_name, card_type.card_type, customer.card_number, penalty_reason.issue,penalty_reason.penalty_amount, penalty.transaction_date FROM penalty INNER JOIN inspector ON inspector.inspector_id = penalty.inspector_id INNER JOIN customer ON customer.customer_id = penalty.customer_id INNER JOIN pos ON pos.pos_id = inspector.pos_id INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id INNER JOIN penalty_reason ON penalty_reason.penalty_reason_id = penalty.penalty_reason_id WHERE penalty.inspector_id = $1",
        [req.id]
      );
      res.json({ status: "AK", data: inspector.rows });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

module.exports = router;
