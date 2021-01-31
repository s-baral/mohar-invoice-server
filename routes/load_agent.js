const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwtGenerator = require("../utils/jwtGenerator");
const validInfo = require("../middleware/validInfo");
const authorization = require("../middleware/authorization");

var Validator = require("jsonschema").Validator;
var v = new Validator();

//login route

router.post("/login", async (req, res) => {
  try {
    //1. destructrue the req.body

    const { username, password } = req.body;

    //2. check if user doesnot exist (if not then we throw error)

    const loadagents = await pool.query(
      "SELECT * FROM load_agent WHERE load_agent_username = $1",
      [username]
    );

    //res.json(loadagents.rows.length);

    if (loadagents.rows.length === 0) {
      return res.json({
        status: "AK",
        data: "Password or username is Incorrect",
      });
    }

    //3. Check if incoming password is the same as the database password

    const validPassword = await bcrypt.compare(
      password,
      loadagents.rows[0].load_agent_password
    );

    if (!validPassword) {
      return res.json({
        status: "AK",
        data: "Password or username is Incorrect",
      });
    }
    //console.log(loadagents.rows);
    //console.log(validPassword);

    //4. give them the token

    const token = jwtGenerator(loadagents.rows[0].load_agent_id);
    res.json({ status: "AK", data: token });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//verification of token

router.get("/is-verify", authorization, async (req, res) => {
  try {
    res.json(true);
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.get("/dashboard", authorization, async (req, res) => {
  try {
    //res.json(req.id);
    const load_agent = await pool.query(
      "SELECT load_agent.load_agent_name, load_agent.load_agent_username, participants.participants_type, load_agent.pos_id FROM load_agent INNER JOIN participants ON participants.participants_id = load_agent.participants_id WHERE load_agent_id = $1",
      [req.id]
    );
    res.json({ status: "AK", data: load_agent.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.get("/card-sales/card-type", authorization, async (req, res) => {
  try {
    const card_type = await pool.query("SELECT * FROM card_type");
    res.json({ status: "AK", data: card_type.rows });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.post("/card-sales/customer", authorization, async (req, res) => {
  try {
    const {
      name,
      address,
      card_number,
      card_type_id,
      contact_number,
    } = req.body;
    //const body = req.body;
    //const name = body.name;

    // Address, to be embedded on Person
    var CustomerSchema = {
      id: "/customer",
      type: "object",
      properties: {
        name: { type: "string" },
        address: { type: "string" },
        card_number: { type: "string" },
        card_type_id: { type: "string" },
        contact_number: { type: "number" },
      },
      required: ["name", "address"],
    };
    v.addSchema(CustomerSchema, "/customer");
    //console.log(v.validate(req.body, CustomerSchema));
    const validation = v.validate(req.body, CustomerSchema);

    if (validation.errors && validation.errors.length > 0) {
      return res.json({
        status: "NAK",
        data: validation.errors[0].stack,
      });
    }
    /*
    if (!v.validate(req.body, CustomerSchema).valid) {
      return res.json({
        status: "NAK",
        data: "Invalid Data",
      });
    } */
    const card = await pool.query(
      "SELECT card_number FROM card_info WHERE card_number = $1",
      [card_number]
    );

    if (card.rows.length === 0) {
      return res.json({
        status: "NAK",
        data: "Invalid Card number. Card mismatch with database.",
      });
    }

    const validCard = await pool.query(
      "SELECT * FROM customer WHERE card_number = $1",
      [card_number]
    );

    if (validCard.rows.length != 0) {
      return res.json({
        status: "NAK",
        data: "Invalid Card. Customer with the card number already exist.",
      });
    }

    const customer = await pool.query(
      "INSERT INTO customer (customer_name, customer_address, card_number, card_type_id, contact_number ) VALUES ($1, $2, $3, $4, $5) RETURNING * ",
      [name, address, card_number, card_type_id, contact_number]
    );
    const customer1 = await pool.query(
      "SELECT customer.customer_name, customer.customer_address, customer.contact_number, customer.card_number, card_type.card_type FROM customer INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id WHERE customer.card_number = $1",
      [card_number]
    );
    res.json({ status: "AK", data: customer1.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.post("/card-sales", authorization, async (req, res) => {
  try {
    const { customer_id, participants_type } = req.body;

    const commission_id = "3d4a072a-c15a-4c01-a522-46b697a6b002";

    const commission_percent = await pool.query(
      "SELECT commission_percentage, amount FROM commission WHERE commission_id = $1",
      [commission_id]
    );
    const amount = await pool.query(
      "SELECT amount FROM commission WHERE commission_id = $1",
      [commission_id]
    );

    const commission_per = commission_percent.rows[0].commission_percentage;
    const amount1 = amount.rows[0].amount;

    console.log(commission_per, amount1);
    /*
    const new_amount = amount;
    //const card_price = new_amount / 1.13
    //const VAT_on_amount = 0.13 * new_amount;
    const VAT_on_amount = 34.5;
    //const VAT_on_card_price = card_price * 0.13;
    //const amount_with_VAT = new_amount - VAT_on_amount;
    const amount_with_VAT = 265.5;

    const card_sales_commission = (commission_per / 100) * new_amount;
    const VAT_on_commission = 0.13 * card_sales_commission;

    const commission_acquired_with_VAT =
      card_sales_commission - VAT_on_commission;

    const tds_amount = 0.015 * commission_acquired_with_VAT;

    const final_commission = commission_acquired_with_VAT + tds_amount;

    const total_VAT_after_deduction_from_commission_VAT =
      VAT_on_amount - VAT_on_commission;
    const amount_after_deducting_commission =
      amount_with_VAT - commission_acquired_with_VAT;

    const final_amount =
      amount_after_deducting_commission +
      total_VAT_after_deduction_from_commission_VAT +
      commission_acquired_with_VAT +
      VAT_on_commission;
    */
    const new_amount = amount1;
    const receipt_amount = new_amount / 1.13;
    const VAT_on_amount = receipt_amount * 0.13;
    const total_amount = receipt_amount + VAT_on_amount;
    const commission_amount = (commission_per / 100) * total_amount;
    let acquired_commission;
    let TDS_for_commission;
    let VAT_for_commission;

    if (participants_type === "VAT-registered Load Agent") {
      acquired_commission = commission_amount / 1.145;
      TDS_for_commission = acquired_commission * 0.015;
      VAT_for_commission = acquired_commission * 0.13;
    } else if (participants_type === "VAT-Not-registered Load Agent") {
      acquired_commission = commission_amount / 1.15;
      TDS_for_commission = acquired_commission * 0.15;
      VAT_for_commission = 0;
    } else if (participants_type === "Mohar CSA") {
      acquired_commission = 0;
      TDS_for_commission = 0;
      VAT_for_commission = 0;
    } else {
      res.json({ status: "NAK", data: "Invalid Participant Type" });
    }
    const amount_after_deducting_commission =
      receipt_amount - acquired_commission;
    const total_VAT_after_deduction_from_commission_VAT =
      VAT_on_amount - VAT_for_commission;
    const final_amount =
      total_VAT_after_deduction_from_commission_VAT +
      amount_after_deducting_commission +
      VAT_for_commission +
      acquired_commission;

    const card_sales = await pool.query(
      "INSERT INTO card_sales_for_VAT (load_agent_id, customer_id, commission_id, receipt_amount, VAT_on_amount, total_amount, acquired_commission, TDS_for_commission, VAT_for_commission, amount_for_mohar, VAT_for_mohar_amount, final_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING * ",
      [
        req.id,
        customer_id,
        commission_id,
        receipt_amount,
        VAT_on_amount,
        total_amount,
        acquired_commission,
        TDS_for_commission,
        VAT_for_commission,
        amount_after_deducting_commission,
        total_VAT_after_deduction_from_commission_VAT,
        final_amount,
      ]
    );
    //console.log(card_sales);
    const card_sales_new = await pool.query(
      "SELECT load_agent.load_agent_name, pos.pos_id, customer.customer_name, customer.contact_number, card_type.card_type, customer.card_number, card_sales_for_VAT.receipt_amount, card_sales_for_VAT.VAT_on_amount, card_sales_for_VAT.total_amount FROM card_sales_for_VAT INNER JOIN load_agent ON load_agent.load_agent_id = $1 INNER JOIN customer ON customer.customer_id = $2 INNER JOIN pos ON pos.pos_id = load_agent.pos_id INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id WHERE card_sales_for_VAT.card_sales_id = $3",
      [req.id, customer_id, card_sales.rows[0].card_sales_id]
    );
    console.log(card_sales_new);
    res.json({ status: "AK", data: card_sales_new.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});
/*

router.post("/card-sales-with-TDS/amount", authorization, async (req, res) => {
  try {
    const { customer_id, amount } = req.body;

    const commission_id = "3d4a072a-c15a-4c01-a522-46b697a6b002";

    const commission_percent = await pool.query(
      "SELECT commission_percentage FROM commission WHERE commission_id = $1",
      [commission_id]
    );

    const commission_per = commission_percent.rows[0].commission_percentage;

    const new_amount = amount;
    const VAT_on_amount = 0.13 * new_amount;
    const amount_with_VAT = new_amount - VAT_on_amount;

    const card_sales_commission = (commission_per / 100) * new_amount;
    const TDS_on_commission = 0.15 * card_sales_commission;

    const commission_acquired_with_TDS =
      card_sales_commission - TDS_on_commission;

    const total_VAT_after_deduction_from_commission_TDS =
      VAT_on_amount - TDS_on_commission;
    const amount_after_deducting_commission =
      amount_with_VAT - commission_acquired_with_TDS;

    const final_amount =
      amount_after_deducting_commission +
      total_VAT_after_deduction_from_commission_TDS +
      commission_acquired_with_TDS +
      TDS_on_commission;

    const card_sales = await pool.query(
      "INSERT INTO card_sales_for_TDS (load_agent_id, customer_id, commission_id, receipt_amount, VAT_on_amount, total_amount, acquired_commission, TDS_for_commission, amount_for_mohar, VAT_for_mohar_amount, final_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING * ",
      [
        req.id,
        customer_id,
        commission_id,
        amount_with_VAT,
        VAT_on_amount,
        new_amount,
        commission_acquired_with_TDS,
        TDS_on_commission,
        amount_after_deducting_commission,
        total_VAT_after_deduction_from_commission_TDS,
        final_amount,
      ]
    );
    res.json({ status: "AK", data: card_sales.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});
*/

router.post("/card-reload", authorization, async (req, res) => {
  try {
    const { customer_id, card_number, participants_type, amount } = req.body;

    const commission_id = "0b98cd67-ba55-43d2-a996-ef0d71f6f864";

    const customer = await pool.query(
      "SELECT * FROM customer WHERE card_number = $1 AND customer_id = $2",
      [card_number, customer_id]
    );
    if (customer.rows.length === 0) {
      return res.json({
        status: "NAK",
        data: "Invalid Card/ Card number doesnot match with customer id",
      });
    }

    const commission_percent = await pool.query(
      "SELECT commission_percentage FROM commission WHERE commission_id = $1",
      [commission_id]
    );

    const commission_per = commission_percent.rows[0].commission_percentage;

    const service_charge = (commission_per / 100) * amount;
    const reload_amount = amount - service_charge;

    const commission_amount = (commission_per / 100) * amount;
    let acquired_commission;
    let TDS_for_commission;
    let VAT_for_commission;

    if (participants_type === "VAT-registered Load Agent") {
      acquired_commission = commission_amount / 1.145;
      TDS_for_commission = acquired_commission * 0.015;
      VAT_for_commission = acquired_commission * 0.13;
    } else if (participants_type === "VAT-Not-registered Load Agent") {
      acquired_commission = commission_amount / 1.15;
      TDS_for_commission = acquired_commission * 0.15;
      VAT_for_commission = 0;
    } else {
      acquired_commission = 0;
      TDS_for_commission = 0;
      VAT_for_commission = 0;
    }

    const total_amount =
      acquired_commission + TDS_for_commission + VAT_for_commission;

    const reload = await pool.query(
      "INSERT INTO card_reload_for_VAT (load_agent_id, customer_id, commission_id, reload_amount, service_charge, total_amount, acquired_commission, VAT_for_commission, TDS_for_commission, final_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING * ",
      [
        req.id,
        customer_id,
        commission_id,
        reload_amount,
        service_charge,
        amount,
        acquired_commission,
        VAT_for_commission,
        TDS_for_commission,
        total_amount,
      ]
    );

    res.json({ status: "AK", data: reload.rows[0] });
    //res.json(customer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

/*

router.post("/card-reload-for-TDS/amount", authorization, async (req, res) => {
  try {
    const { customer_id, card_number, amount } = req.body;

    const commission_id = "0b98cd67-ba55-43d2-a996-ef0d71f6f864";

    const customer = await pool.query(
      "SELECT * FROM customer WHERE card_number = $1 and customer_id = $2",
      [card_number, customer_id]
    );
    if (customer.rows.length === 0) {
      return res.json({
        status: "NAK",
        data: "Invalid Card/ Card number doesnot match with customer id",
      });
    }

    const commission_percent = await pool.query(
      "SELECT commission_percentage FROM commission WHERE commission_id = $1",
      [commission_id]
    );

    const commission_per = commission_percent.rows[0].commission_percentage;

    const service_charge = (commission_per / 100) * amount;
    const reload_amount = amount - service_charge;

    const commission = (commission_per / 100) * amount;
    const TDS_on_commission = 0.15 * commission;

    const acquired_commission = commission - TDS_on_commission;

    const total_amount = acquired_commission + TDS_on_commission;

    const reload = await pool.query(
      "INSERT INTO card_reload_for_TDS (load_agent_id, customer_id, commission_id, reload_amount, service_charge, total_amount, acquired_commission, TDS_for_commission, final_amount) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING * ",
      [
        req.id,
        customer_id,
        commission_id,
        reload_amount,
        service_charge,
        amount,
        acquired_commission,
        TDS_on_commission,
        total_amount,
      ]
    );

    res.json({ status: "AK", data: reload.rows[0] });
    //res.json(customer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});
*/

module.exports = router;
