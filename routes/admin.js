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

    const token = jwtGenerator(admin.rows[0].admin_id, USER_ROLES.ADMIN);
    res.json({ status: "AK", data: token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
/*
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
*/
router.post("/pos", authorization(USER_ROLES.ADMIN), async (req, res) => {
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

router.get("/pos", authorization(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const pos = await pool.query("SELECT * FROM pos");
    res.json({ status: "AK", data: pos.rows });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

router.get(
  "/pos/:pos_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { pos_id } = req.params;
      const pos = await pool.query("SELECT * FROM pos WHERE pos_id = $1", [
        pos_id,
      ]);

      if (pos.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "POS not found in database. Invalid POS.",
        });
      }
      res.json({ status: "AK", data: pos.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

router.put(
  "/pos/:pos_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
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
  }
);

// Commission
//Get all commission
router.get("/commission", authorization(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const commission = await pool.query("SELECT * FROM commission");
    res.json({ status: "AK", data: commission.rows });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//Post new commission
router.post(
  "/commission",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
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
  }
);

//get Single commission

router.get(
  "/commission/:commission_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { commission_id } = req.params;
      const commission = await pool.query(
        "SELECT * FROM commission WHERE commission_id = $1",
        [commission_id]
      );

      if (commission.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Commission not found in database. Invalid commission.",
        });
      }

      res.json({ status: "AK", data: commission.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Update Commission

router.put(
  "/commission/:commission_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
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
  }
);

// Penalty Reason
//Get all penalty reasons from table penalty-reasons
router.get(
  "/penalty_reason",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const penalty_reason = await pool.query("SELECT * FROM penalty_reason");
      res.json({ status: "AK", data: penalty_reason.rows });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Post new penalty_reason with penalty amount
router.post(
  "/penalty_reason",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { issue, penalty_amount } = req.body;

      const penalty_reason = await pool.query(
        "INSERT INTO penalty_reason (issue, penalty_amount) VALUES ($1, $2) RETURNING * ",
        [issue, penalty_amount]
      );
      res.json({ status: "AK", data: penalty_reason.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//get Single penalty reason from database

router.get(
  "/penalty_reason/:penalty_reason_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { penalty_reason_id } = req.params;
      const penalty_reason = await pool.query(
        "SELECT * FROM penalty_reason WHERE penalty_reason_id = $1",
        [penalty_reason_id]
      );
      res.json({ status: "AK", data: penalty_reason.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Update penalty_reason in database

router.put(
  "/penalty_reason/:penalty_reason_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { penalty_reason_id } = req.params;
      const { issue, penalty_amount } = req.body;
      const checkpenaltyreason = await pool.query(
        "SELECT * FROM penalty_reason WHERE penalty_reason_id = $1",
        [penalty_reason_id]
      );

      if (checkpenaltyreason.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "penalty reason not found",
        });
      }
      const penalty_reason = await pool.query(
        "UPDATE penalty_reason SET issue = $1, penalty_amount = $2 WHERE penalty_reason_id = $3 RETURNING *",
        [issue, penalty_amount, penalty_reason_id]
      );
      console.log(penalty_reason.rows[0]);
      res.json({
        status: "AK",
        data: penalty_reason.rows[0],
      });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

// Card Information
//Get all Card information from table card_info
router.get("/card_info", authorization(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const card_info = await pool.query("SELECT * FROM card_info");
    res.json({ status: "AK", data: card_info.rows });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//Post new card number/ information into the table card_info
router.post("/card_info", authorization(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const { card_number, remarks } = req.body;

    const checkCard = await pool.query(
      "SELECT * FROM card_info WHERE card_number = $1",
      [card_number]
    );

    if (checkCard.rows.length != 0) {
      return res.json({
        status: "NAK",
        data: "The card number already exist",
      });
    }

    const card_info = await pool.query(
      "INSERT INTO card_info (card_number, remarks) VALUES ($1, $2) RETURNING * ",
      [card_number, remarks]
    );
    res.json({ status: "AK", data: card_info.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//get Single card information from database card_info

router.get(
  "/card_info/:card_number",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { card_number } = req.params;
      const card_info = await pool.query(
        "SELECT * FROM card_info WHERE card_number = $1",
        [card_number]
      );
      if (card_info.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Card Number not found in database. Invalid Card Number.",
        });
      }
      res.json({ status: "AK", data: card_info.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Update card information in database card_info

router.put(
  "/card_info/:card_number",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { card_number } = req.params;
      const { remarks } = req.body;
      const checkCard = await pool.query(
        "SELECT * FROM card_info WHERE card_number = $1",
        [card_number]
      );

      if (checkCard.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Card not found",
        });
      }
      const card_info = await pool.query(
        "UPDATE card_info SET card_number = $1, remarks = $2 WHERE card_number = $3 RETURNING *",
        [card_number, remarks, card_number]
      );
      console.log(card_info.rows[0]);
      res.json({
        status: "AK",
        data: card_info.rows[0],
      });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

router.delete(
  "/card_info/:card_number",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { card_number } = req.params;
      const card_info = await pool.query(
        "DELETE FROM card_info WHERE card_number = $1",
        [card_number]
      );
      res.json({ status: "AK", data: "The card info has been deleted." });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

// Card Types information
//Get all Card information from table card_info
router.get("/card_type", authorization(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const card_type = await pool.query("SELECT * FROM card_type");
    res.json({ status: "AK", data: card_type.rows });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//Post new card type/ information into the table card_type
router.post("/card_type", authorization(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const { card_type_id, card_type } = req.body;

    const checkCardtype = await pool.query(
      "SELECT * FROM card_type WHERE card_type_id = $1 OR card_type = $2",
      [card_type_id]
    );

    if (checkCardtype.rows.length != 0) {
      return res.json({
        status: "NAK",
        data: "The card type already exist",
      });
    }

    const card_type_info = await pool.query(
      "INSERT INTO card_type (card_type) VALUES ($1) RETURNING * ",
      [card_type]
    );
    res.json({ status: "AK", data: card_type_info.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//get Single card type information from database card_type

router.get(
  "/card_type/:card_type_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { card_type_id } = req.params;
      const card_type = await pool.query(
        "SELECT * FROM card_type WHERE card_type_id = $1",
        [card_type_id]
      );

      if (card_type.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Card_type not found in database. Invalid Card_type.",
        });
      }
      res.json({ status: "AK", data: card_type.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Update card type information in database card_type

router.put(
  "/card_type/:card_type_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { card_type_id } = req.params;
      const { card_type } = req.body;
      const checkCardtype = await pool.query(
        "SELECT * FROM card_type WHERE card_type_id = $1",
        [card_type_id]
      );

      /*

    if (checkCardtype.rows.length === 0) {
      return res.json({
        status: "NAK",
        data: "Card type not found",
      });
    }

    */
      if (checkCardtype.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Card type Not found",
        });
      }

      if (checkCardtype.rows.length != 0) {
        return res.json({
          status: "NAK",
          data: "Card type already exist",
        });
      }

      const card_type_info = await pool.query(
        "UPDATE card_type SET card_type = $1 WHERE card_type_id = $2 RETURNING *",
        [card_type, card_type_id]
      );
      console.log(card_type_info.rows[0]);
      res.json({
        status: "AK",
        data: card_type_info.rows[0],
      });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Delete card type information
router.delete(
  "/card_type/:card_type_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { card_type_id } = req.params;
      const card_type = await pool.query(
        "DELETE FROM card_type WHERE card_type_id = $1",
        [card_type_id]
      );
      res.json({ status: "AK", data: "The card type has been deleted." });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//CRUD for Load agent
router.post(
  "/load-agent",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      //1. Destructure the req.body (name, address, email, username, password, pos_id)
      const {
        name,
        address,
        email,
        username,
        password,
        pos_id,
        pan,
        citizenship_number,
        participants_id,
      } = req.body;

      const checkpos = await pool.query(
        "SELECT pos_id FROM pos WHERE pos_id = $1",
        [pos_id]
      );

      //check POS

      if (checkpos.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "POS not found in database",
        });
      }
      const pos = await pool.query(
        "SELECT pos_id FROM load_agent WHERE pos_id = $1",
        [pos_id]
      );

      if (pos.rows.length != 0) {
        return res.json({
          status: "NAK",
          data: "POS device already used for load agent.",
        });
      }

      const pos1 = await pool.query(
        "SELECT pos_id FROM inspector WHERE pos_id = $1",
        [pos_id]
      );

      if (pos1.rows.length != 0) {
        return res.json({
          status: "NAK",
          data: "POS device already used for inspector.",
        });
      }
      //2. check if user exist (if user exists then throw error)

      const loadagents = await pool.query(
        "SELECT * FROM load_agent WHERE load_agent_email = $1 OR load_agent_username = $2 OR load_agent_pan = $3 OR load_agent_citizenship_number = $4",
        [email, username, pan, citizenship_number]
      );

      if (loadagents.rows.length != 0) {
        return res.json({ status: "NAK", data: "User already exist" });
      }

      //res.json(loadagents.rows);

      //3. Bcrypt the user password
      const saltRound = 10;
      const salt = await bcrypt.genSalt(saltRound);
      const bcryptPassword = await bcrypt.hash(password, salt);

      //4. enter the new user inside our database

      const newLoadagents = await pool.query(
        "INSERT INTO load_agent (load_agent_name, load_agent_address, load_agent_email, load_agent_username, load_agent_password, pos_id, load_agent_pan, load_agent_citizenship_number, participants_id ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING * ",
        [
          name,
          address,
          email,
          username,
          bcryptPassword,
          pos_id,
          pan,
          citizenship_number,
          participants_id,
        ]
      );

      //res.json(newLoadagents.rows[0]);

      //5. generate our jwt token
      //console.log(newLoadagents);
      //const token = jwtGenerator(newLoadagents.rows[0].load_agent_id);

      res.json({ data: newLoadagents.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Get all load agents
router.get("/load-agent", authorization(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const load_agent = await pool.query("SELECT * FROM load_agent");
    res.json({ status: "AK", data: load_agent.rows });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//Get single load agent
router.get(
  "/load-agent/:load_agent_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { load_agent_id } = req.params;
      const load_agent = await pool.query(
        "SELECT * FROM load_agent WHERE load_agent_id = $1",
        [load_agent_id]
      );

      if (load_agent.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Load agent not found in database. Invalid Load agent.",
        });
      }
      res.json({ status: "AK", data: load_agent.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

router.put(
  "/load-agent/:load_agent_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { load_agent_id } = req.params;
      const { name, address, participants_id } = req.body;
      const checkLoadagent = await pool.query(
        "SELECT * FROM load_agent WHERE load_agent_id = $1",
        [load_agent_id]
      );
      //console.log(checkLoadagent.rows);
      if (checkLoadagent.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "load agent not found",
        });
      }

      const load_agent = await pool.query(
        "UPDATE load_agent SET load_agent_name = $1, load_agent_address = $2, participants_id = $3 WHERE load_agent_id = $4 RETURNING *",
        [name, address, participants_id, load_agent_id]
      );
      //console.log(load_agent.rows[0]);
      res.json({
        status: "AK",
        data: "Information has been updated",
      });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Get card-sales details of loadagent
router.get(
  "/load-agent/card-sales-details/:load_agent_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { load_agent_id } = req.params;
      const load_agent = await pool.query(
        "SELECT card_sales.card_sales_id, customer.customer_name, card_type.card_type, customer.card_number, card_sales.acquired_commission, card_sales.tds_for_commission, card_sales.vat_for_commission, card_sales.transaction_date FROM card_sales INNER JOIN customer ON customer.customer_id = card_sales.customer_id INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id WHERE load_agent_id = $1",
        [load_agent_id]
      );
      res.json({ status: "AK", data: load_agent.rows });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);
//Get card-reload details of loadagent
router.get(
  "/load-agent/card-reload-details/:load_agent_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { load_agent_id } = req.params;
      const load_agent = await pool.query(
        "SELECT card_reload.card_reload_id, customer.customer_name, card_type.card_type, customer.card_number, card_reload.acquired_commission, card_reload.tds_for_commission, card_reload.vat_for_commission, card_reload.transaction_date FROM card_reload INNER JOIN customer ON customer.customer_id = card_reload.customer_id INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id WHERE load_agent_id = $1",
        [load_agent_id]
      );
      res.json({ status: "AK", data: load_agent.rows });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//CRUD for Inspector
router.post("/inspector", authorization(USER_ROLES.ADMIN), async (req, res) => {
  try {
    //1. Destructure the req.body (name, address, email, username, password, pos_id)
    const {
      name,
      address,
      email,
      username,
      password,
      pos_id,
      pan,
      citizenship_number,
    } = req.body;

    const checkpos = await pool.query(
      "SELECT pos_id FROM pos WHERE pos_id = $1",
      [pos_id]
    );
    //check POS

    if (checkpos.rows.length === 0) {
      return res.json({
        status: "NAK",
        data: "POS not found in database",
      });
    }
    const pos = await pool.query(
      "SELECT pos_id FROM load_agent WHERE pos_id = $1",
      [pos_id]
    );

    if (pos.rows.length != 0) {
      return res.json({
        status: "NAK",
        data: "POS device already assigned for load agent.",
      });
    }

    const pos1 = await pool.query(
      "SELECT pos_id FROM inspector WHERE pos_id = $1",
      [pos_id]
    );

    if (pos1.rows.length != 0) {
      return res.json({
        status: "NAK",
        data: "POS device already assigned for inspector.",
      });
    }

    //2. check if user exist (if user exists then throw error)

    const inspector = await pool.query(
      "SELECT * FROM inspector WHERE inspector_email = $1 OR inspector_username = $2 OR inspector_pan = $3 OR inspector_citizenship_number = $4",
      [email, username, pan, citizenship_number]
    );

    if (inspector.rows.length != 0) {
      return res.json({
        status: "NAK",
        data:
          "User with the given information/s (email,username, pan, citizenship) already exist",
      });
    }

    //res.json(inspector.rows);

    //3. Bcrypt the user password
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    //4. enter the new user inside our database

    const newInspector = await pool.query(
      "INSERT INTO inspector (inspector_name, inspector_address, inspector_email, inspector_username, inspector_password, pos_id, inspector_pan, inspector_citizenship_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING * ",
      [
        name,
        address,
        email,
        username,
        bcryptPassword,
        pos_id,
        pan,
        citizenship_number,
      ]
    );

    //res.json(newInspector.rows[0]);

    //5. generate our jwt token
    //console.log(newLoadagents);
    //const token = jwtGenerator(newLoadagents.rows[0].load_agent_id);

    //res.json({ data: newInspector.rows[0] });
    res.json({ status: "AK", data: "Inspector Successfully Created." });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//Get all inspectors
router.get("/inspector", authorization(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const inspector = await pool.query(
      "SELECT inspector_id, inspector_name, inspector_address, inspector_email, inspector_username, pos_id, inspector_pan, inspector_citizenship_number FROM inspector"
    );
    res.json({ status: "AK", data: inspector.rows });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//Get single inspector
router.get(
  "/inspector/:inspector_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { inspector_id } = req.params;
      const inspector = await pool.query(
        "SELECT inspector_id, inspector_name, inspector_address, inspector_email, inspector_username, pos_id, inspector_pan, inspector_citizenship_number FROM inspector WHERE inspector_id = $1",
        [inspector_id]
      );

      if (inspector.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Inspector not found in database. Invalid Inspector.",
        });
      }
      res.json({ status: "AK", data: inspector.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

// update inpector
router.put(
  "/inspector/:inspector_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { inspector_id } = req.params;
      const { name, address } = req.body;
      const checkinspector = await pool.query(
        "SELECT * FROM inspector WHERE inspector_id = $1",
        [inspector_id]
      );

      if (checkinspector.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Inspector not found",
        });
      }

      //Check POS
      /*
      const checkpos = await pool.query(
        "SELECT pos_id FROM pos WHERE pos_id = $1",
        [pos_id]
      );

      if (checkpos.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "POS not found in database",
        });
      }
      const pos = await pool.query(
        "SELECT pos_id FROM load_agent WHERE pos_id = $1",
        [pos_id]
      );

      if (pos.rows.length != 0) {
        return res.json({
          status: "NAK",
          data: "POS device already used for load agent.",
        });
      }

      const pos1 = await pool.query(
        "SELECT pos_id FROM inspector WHERE pos_id = $1",
        [pos_id]
      );

      if (pos1.rows.length != 0) {
        return res.json({
          status: "NAK",
          data: "POS device already used for inspector.",
        });
      }
      */
      const inspector = await pool.query(
        "UPDATE inspector SET inspector_name = $1, inspector_address = $2 WHERE inspector_id = $3 RETURNING *",
        [name, address, inspector_id]
      );
      console.log(inspector.rows[0]);
      res.json({
        status: "AK",
        data: "Information has been updated",
      });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Get penalty details of inspector
router.get(
  "/inspector/penalty-details/:inspector_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { inspector_id } = req.params;
      const inspector = await pool.query(
        "SELECT penalty.penalty_id, pos.pos_id, customer.customer_name, card_type.card_type, customer.card_number, penalty_reason.issue,penalty_reason.penalty_amount, penalty.transaction_date FROM penalty INNER JOIN inspector ON inspector.inspector_id = penalty.inspector_id INNER JOIN customer ON customer.customer_id = penalty.customer_id INNER JOIN pos ON pos.pos_id = inspector.pos_id INNER JOIN card_type ON card_type.card_type_id = customer.card_type_id INNER JOIN penalty_reason ON penalty_reason.penalty_reason_id = penalty.penalty_reason_id WHERE penalty.inspector_id = $1",
        [inspector_id]
      );
      res.json({ status: "AK", data: inspector.rows });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

// Participants information
//Get all participants type from table participants
router.get(
  "/participants",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const participants = await pool.query("SELECT * FROM participants");
      res.json({ status: "AK", data: participants.rows });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Post new participants_type into the table participants
router.post(
  "/participants",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { participants_type } = req.body;

      const checkparticipants = await pool.query(
        "SELECT * FROM participants WHERE participants_type = $1",
        [participants_type]
      );

      if (checkparticipants.rows.length != 0) {
        return res.json({
          status: "NAK",
          data: "The card type already exist",
        });
      }

      const participants = await pool.query(
        "INSERT INTO participants (participants_type) VALUES ($1) RETURNING * ",
        [participants_type]
      );
      res.json({ status: "AK", data: participants.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//get Single participants_type from table participants

router.get(
  "/participants/:participants_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { participants_id } = req.params;
      const participants = await pool.query(
        "SELECT * FROM participants WHERE participants_id = $1",
        [participants_id]
      );

      if (participants.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Participants not found in database. Invalid Participant.",
        });
      }
      res.json({ status: "AK", data: participants.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Update participants type information in table participants

router.put(
  "/participants/:participants_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { participants_id } = req.params;
      const { participants_type } = req.body;

      const checkparticipants = await pool.query(
        "SELECT * FROM participants WHERE participants_id = $1",
        [participants_id]
      );
      /*

    if (checkCardtype.rows.length === 0) {
      return res.json({
        status: "NAK",
        data: "Card type not found",
      });
    }

    */
      if (checkparticipants.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Participants type not found",
        });
      }

      const participants = await pool.query(
        "UPDATE participants SET participants_type = $1 WHERE participants_id = $2 RETURNING *",
        [participants_type, participants_id]
      );

      res.json({
        status: "AK",
        data: "Successfully Updated",
      });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Get all amc types
router.get("/amc-type", authorization(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const amc_type = await pool.query("SELECT * FROM amc_types");
    res.json({ status: "AK", data: amc_type.rows });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//CRU for Merchants

//Get all merchants
router.get("/merchants", authorization(USER_ROLES.ADMIN), async (req, res) => {
  try {
    const merchant = await pool.query("SELECT * FROM merchants");
    res.json({ status: "AK", data: merchant.rows });
  } catch (err) {
    console.error(err.message);
    res.json({ status: "NAK", data: "Server Error" });
  }
});

//Get single merchant
router.get(
  "/merchants/:merchant_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { merchant_id } = req.params;
      const merchant = await pool.query(
        "SELECT * FROM merchants WHERE merchant_id = $1",
        [merchant_id]
      );

      if (merchant.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Merchant not found in database. Invalid Merchant.",
        });
      }
      res.json({ status: "AK", data: merchant.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

// update merchants
router.put(
  "/merchants/:merchant_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { merchant_id } = req.params;
      const {
        contact_person,
        contact_number,
        email,
        city,
        applications,
        full_address,
        total_terminals,
        total_sim,
      } = req.body;
      const checkmerchants = await pool.query(
        "SELECT * FROM merchants WHERE merchant_id = $1",
        [merchant_id]
      );

      if (checkmerchants.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Merchant not found",
        });
      }
      const merchant = await pool.query(
        "UPDATE merchants SET contact_person = $1, contact_number = $2, email = $3, city = $4, applications = $5, full_address = $6, total_terminals = $7, total_sim = $8 WHERE merchant_id = $9 RETURNING *",
        [
          contact_person,
          contact_number,
          email,
          city,
          applications,
          full_address,
          total_terminals,
          total_sim,
          merchant_id,
        ]
      );
      console.log(merchant.rows[0]);
      res.json({
        status: "AK",
        data: "Information has been updated",
      });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//CRU for Finance Admin
router.post(
  "/finance-admin",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      //1. Destructure the req.body (name, address, email, username, password)
      const {
        name,
        address,
        contact_number,
        email,
        username,
        password,
        pan,
        citizenship_number,
      } = req.body;

      //2. check if user exist (if user exists then throw error)

      const finance_admin = await pool.query(
        "SELECT * FROM finance_admin WHERE finance_admin_email = $1 OR finance_admin_username = $2 OR finance_admin_contact_number = $3 OR finance_admin_pan = $4 OR finance_admin_citizenship_number = $5",
        [email, username, contact_number, pan, citizenship_number]
      );

      if (finance_admin.rows.length != 0) {
        return res.json({ status: "NAK", data: "User already exist" });
      }

      //res.json(loadagents.rows);

      //3. Bcrypt the user password
      const saltRound = 10;
      const salt = await bcrypt.genSalt(saltRound);
      const bcryptPassword = await bcrypt.hash(password, salt);

      //4. enter the new user inside our database

      const newFinanceAdmin = await pool.query(
        "INSERT INTO finance_admin (finance_admin_name, finance_admin_address, finance_admin_contact_number, finance_admin_email, finance_admin_username, finance_admin_password, finance_admin_pan, finance_admin_citizenship_number) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING * ",
        [
          name,
          address,
          contact_number,
          email,
          username,
          bcryptPassword,
          pan,
          citizenship_number,
        ]
      );

      res.json({ status: "AK", data: newFinanceAdmin.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Get all finance admins
router.get(
  "/finance-admin",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const finance_admin = await pool.query(
        "SELECT finance_admin_id, finance_admin_name, finance_admin_address, finance_admin_contact_number, finance_admin_email, finance_admin_username, finance_admin_pan, finance_admin_citizenship_number FROM finance_admin"
      );
      res.json({ status: "AK", data: finance_admin.rows });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

//Get single Finance Admin
router.get(
  "/finance-admin/:finance_admin_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { finance_admin_id } = req.params;
      const finance_admin = await pool.query(
        "SELECT finance_admin_id, finance_admin_name, finance_admin_address, finance_admin_contact_number, finance_admin_email, finance_admin_username, finance_admin_pan, finance_admin_citizenship_number FROM finance_admin WHERE finance_admin_id = $1",
        [finance_admin_id]
      );

      if (finance_admin.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Finance Admin not found in database. Invalid Finance Admin.",
        });
      }
      res.json({ status: "AK", data: finance_admin.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

router.put(
  "/finance-admin/:finance_admin_id",
  authorization(USER_ROLES.ADMIN),
  async (req, res) => {
    try {
      const { finance_admin_id } = req.params;
      const { name, address, pan } = req.body;
      const checkFinanceAdmin = await pool.query(
        "SELECT * FROM finance_admin WHERE finance_admin_id = $1",
        [finance_admin_id]
      );

      if (checkFinanceAdmin.rows.length === 0) {
        return res.json({
          status: "NAK",
          data: "Finance Admin not found",
        });
      }
      const updatefinance_admin = await pool.query(
        "UPDATE finance_admin SET finance_admin_name = $1, finance_admin_address = $2, finance_admin_pan = $3 WHERE finance_admin_id = $4 RETURNING *",
        [name, address, pan, finance_admin_id]
      );
      const finance_admin = await pool.query(
        "SELECT finance_admin_id, finance_admin_name, finance_admin_address, finance_admin_contact_number, finance_admin_email, finance_admin_username, finance_admin_pan, finance_admin_citizenship_number FROM finance_admin WHERE finance_admin_id = $1",
        [finance_admin_id]
      );
      res.json({
        status: "AK",
        data: "Information has been updated",
        data: finance_admin.rows[0],
      });
    } catch (err) {
      console.error(err.message);
      res.json({ status: "NAK", data: "Server Error" });
    }
  }
);

module.exports = router;
