const router = require("express").Router();
const pool = require("../db");
const jwtGenerator = require("../utils/jwtGenerator");
const validInfo = require("../middleware/validInfo");
const authorization = require("../middleware/authorization");

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

module.exports = router;
