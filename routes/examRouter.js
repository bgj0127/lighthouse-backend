const express = require("express");
const router = express.Router();
const axios = require("axios");
const dotenv = require("dotenv");
const translate = require("google-translate-api-x");

const db = require("../config/mysql");
const conn = db.init();

dotenv.config();

router.get("/recommended-exams", async (req, res) => {
  // #swagger.tags = ['기출문제 API']

  let transText = req.query.q;
  console.log(req.query);
  const text = await translate(transText, { to: "en" });
  const exams = await axios
    .get(`http://localhost:5678/webhook/load-exams?question=${text.text}&section=${req.query.section}`)
    .then((result) => {
      return result.data[0]["data"];
    });
  let exam_idxs = [];
  for (let i = 0; i < exams.length; i++) {
    exam_idxs.push(exams[i]["document"]["metadata"]["ex_idx"]);
  }

  const sql = "select * from tb_exam where ex_idx in (?,?,?,?,?,?,?,?,?,?)";
  conn.query(sql, exam_idxs, (err, result) => {
    res.send(result);
  });
});

router.post("/solving", (req, res) => {
  const { userId, userAnswer, exIdx, correctEx } = req.body;

  let correctAnswer = "N";

  if (userAnswer == correctEx) {
    correctAnswer = "Y";
  }

  const sql = "insert into tb_solving (user_answer, user_id, ex_idx, correct_yn) values (?,?,?,?)";
  conn.query(sql, [userAnswer, userId, exIdx, correctAnswer], (err, result) => {
    if (err) {
      console.log(err);
      res.end();
    } else {
      console.log(result);
      res.end();
    }
  });
});

// 문제풀이 후 결과(점수, 포인트)
router.get("/result", (req, res) => {
  // #swagger.tags = ['기출문제 API']
  res.json({ score: 100, point: 73 });
});

module.exports = router;
