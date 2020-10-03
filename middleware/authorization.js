const jwt = require("jsonwebtoken");
require("dotenv").config();

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
