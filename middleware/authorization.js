const jwt = require("jsonwebtoken");
const USER_ROLES = require("../utils/constants");
require("dotenv").config();
/*
module.exports = async (req, res, next) => {
  try {
    const jwtToken = req.header("token");

    if (!jwtToken) {
      return res.status(403).json("Not Authorize");
    }

    const payload = jwt.verify(jwtToken, process.env.jwtSecret);

    req.id = payload.id;
  } catch (err) {
    console.error(err.messsage);
    return res.status(403).json("Not Authorize");
  }
  next();
};
*/

module.exports = function authorization(role) {
  return async (req, res, next) => {
    try {
      const jwtToken = req.header("token");

      if (!jwtToken) {
        return res.json({ status: "NAK", data: "Not Authorize" });
      }

      const payload = jwt.verify(jwtToken, process.env.jwtSecret);

      if (role !== USER_ROLES.ALL && role !== payload.role) {
        return res.json({
          status: "NAK",
          data: "Invalid Credentials",
        });
      }
      req.id = payload.id;
    } catch (err) {
      console.error(err.messsage);
      return res.status(403).json("Not Authorize");
    }
    next();
  };
};
