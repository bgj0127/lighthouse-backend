const express = require("express");
const dotenv = require("dotenv");
const router = express.Router();
const db = require("../config/mysql");
const conn = db.init();

dotenv.config();

router.get("/best-users", (req, res) => {
  // #swagger.tags = ['랭킹 API']
  const sql = "select user_name, user_point from tb_user order by user_point desc limit 10";
  conn.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ message: "server error" });
    }
    res.send(result);
  });
});

module.exports = router;
