const express = require("express");
const moment = require("moment");
const dotenv = require("dotenv");
const router = express.Router();
const db = require("../config/mysql");
const conn = db.init();

dotenv.config();

router.post("/update-time", (req, res) => {
  // 유저아이디, 시작시간, 끝시간, 쉰 시간(초) 배열
  const { userId, stTime, edTime } = req.body;

  const st_dt = moment(stTime, "YYYYMMDD HH:mm:ss");
  const ed_dt = moment(edTime, "YYYYMMDD HH:mm:ss");
  const restTimes = [1, 4, 73, 42, 10];

  const restTimeSum = restTimes.reduce((acc, cur) => {
    return acc + cur;
  }, 0);

  console.log(st_dt, ed_dt);

  const realStudy = Math.floor((ed_dt.diff(st_dt, "minute") * 60 - restTimeSum) / 60);
  const sql = "insert into tb_study_time (user_id, study_st_dt, study_ed_dt, study_time) values (?,?,?,?)";
  conn.query(sql, [userId, st_dt.format(), ed_dt.format(), realStudy], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).end();
    } else {
      console.log(result);
      res.status(200).end();
    }
  });
  res.send({ realStudy });
});

module.exports = router;
