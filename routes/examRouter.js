const express = require("express");
const router = express.Router();
const axios = require("axios");
const dotenv = require("dotenv");
const translate = require("google-translate-api-x");

const conn = require("../config/mysql");

dotenv.config();

router.get("/first-exam", (req, res) => {
  const section_1_sql = "select * from tb_exam where ex_section = '1' limit 2; ";
  const section_2_sql = "select * from tb_exam where ex_section = '2' limit 2; ";
  const section_3_sql = "select * from tb_exam where ex_section = '3' limit 2; ";
  const section_4_sql = "select * from tb_exam where ex_section = '4' limit 2 ";

  conn.query(section_1_sql + section_2_sql + section_3_sql + section_4_sql, (err, result) => {
    if (err) {
      console.log("/first-exam - 500 ERROR", err.message);
      res.status(500).end();
    } else {
      const newArr = [...result[0], ...result[1], ...result[2], ...result[3]];
      console.log("GET /first-exam - 200 OK");
      res.send(newArr);
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
    if (err) {
      console.log("GET /recommended-exams - 500 ERROR", err.message);
      res.status(500).end();
    } else {
      console.log("GET /recommended-exams - 200 OK");
      res.send(result);
    }
  });
});

router.post("/solving", (req, res) => {
  const { userId, userAnswer, exIdx, correctEx } = req.body;

  let correctAnswer = "N";

  console.log(userAnswer, correctEx);
  if (userAnswer == Math.floor(correctEx)) {
    correctAnswer = "Y";
  } else {
    const createReviewNote =
      "insert into tb_review_note (user_id, ex_idx, ex_license, user_answer) values (?,?,'빅데이터분석기사',?)";
    conn.query(createReviewNote, [userId, exIdx, userAnswer], (err, result) => {
      console.log(result);
    });
  }

  const sql = "insert into tb_solving (user_answer, user_id, ex_idx, correct_yn) values (?,?,?,?)";
  conn.query(sql, [userAnswer, userId, exIdx, correctAnswer], (err, result) => {
    if (err) {
      console.log("POST /solving - 500 ERROR", err.message);
      res.status(500).end();
    } else {
      console.log("POST /soving - 200 OK\n");
      res.status(200).end();
    }
  });
});

// 기출문제풀이 후 결과(문제결과, 포인트)
router.post("/result", (req, res) => {
  const userId = req.body.userId;
  // #swagger.tags = ['기출문제 API']
  const sql = "select * from tb_solving where user_id = ? order by solving_idx limit 10";
  conn.query(sql, [userId], (err, result) => {
    if (err) {
      console.log("POST /result - 500 ERROR", err.message);
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
          console.log("POST /result - 500 ERROR", err.message);
          res.status(500).end();
        } else {
          console.log("POST /result - 200 OK", userId);
          res.send({ exams: result, point: correct * 3 });
        }
      });
    }
  });
});

// 배치고사 문제풀이 후 결과(문제결과, 포인트)
router.post("/first-result", (req, res) => {
  const userId = req.body.userId;

  // #swagger.tags = ['기출문제 API']
  const sql = "select * from tb_solving where user_id = ? order by solving_idx desc limit 8";
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
          console.log("POST /first-result - 500 ERROR", err.message);
          res.status(500).end();
        } else {
          console.log("POST /first-result - 200 OK");
          // res.send({ exams: result, point: correct * 3 });
          res.send({ point: correct });
        }
      });
    }
  });
});

module.exports = router;
