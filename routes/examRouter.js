const express = require("express");
const router = express.Router();
const axios = require("axios");
const dotenv = require("dotenv");
const translate = require("google-translate-api-x");

const db = require("../config/mysql");
const conn = db.init();

dotenv.config();

router.get("/first-exam", (req, res) => {
  const section_1_sql = "select * from tb_exam where ex_section = '1' limit 10; ";
  const section_2_sql = "select * from tb_exam where ex_section = '2' limit 10; ";
  const section_3_sql = "select * from tb_exam where ex_section = '3' limit 10; ";
  const section_4_sql = "select * from tb_exam where ex_section = '4' limit 10 ";

  conn.query(section_1_sql + section_2_sql + section_3_sql + section_4_sql, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).end();
    } else {
      const sec1 = result[0];
      const sec2 = result[1];
      const sec3 = result[2];
      const sec4 = result[3];
      console.log(sec1, sec2, sec3, sec4);
      res.send({ data: [sec1, sec2, sec3, sec4] });
    }
  });
});

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
  } else {
    const createReviewNote = "insert into tb_review_note (user_id, ex_idx, ex_license) values (?,?,'빅데이터분석기사')";
    conn.query(createReviewNote, [userId, exIdx], (err, result) => {
      console.log(result);
    });
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

// 문제풀이 후 결과(문제결과, 포인트)
router.post("/result", (req, res) => {
  const userId = req.body.userId;
  // #swagger.tags = ['기출문제 API']
  const sql = "select * from tb_solving where user_id = ? order by solving_idx limit 10";
  conn.query(sql, [userId], (err, result) => {
    if (err) {
      res.status(500).end();
    } else {
      let correct = 0;
      for (let i = 0; i < result.length; i++) {
        if (result[i]["correct_yn"] == "Y") {
          correct += 1;
        }
      }
      const add_point = "update tb_user set user_point = tb_user.user_point + ? where user_id = ?";
      conn.query(add_point, [correct * 3, userId], (err, _) => {
        if (err) {
          console.log(err);
          res.status(500).end();
        } else {
          console.log("포인트 지급 완료");
          res.send({ exams: result, point: correct * 3 });
        }
      });
      console.log(correct);
    }
  });
});

module.exports = router;
