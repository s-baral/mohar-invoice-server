const router = require("express").Router();
const pool = require("../db");
const jwtGenerator = require("../utils/jwtGenerator");
const validInfo = require("../middleware/validInfo");
const authorization = require("../middleware/authorization");
const USER_ROLES = require("../utils/constants");

router.get("/:card_number", authorization(USER_ROLES.ALL), async (req, res) => {
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
});

module.exports = router;
