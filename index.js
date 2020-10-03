const express = require("express");
const app = express();
const cors = require("cors");

//middleware

app.use(express.json()); //req.body
app.use(cors());

//Routes//

//register and login routes

app.use("/load_agent", require("./routes/load_agent"));
app.use("/inspector", require("./routes/inspector"));
app.use("/admin", require("./routes/admin"));

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
