const express = require("express");
const dotenv = require("dotenv");
const router = express.Router();
const db = require("../config/mysql");
const conn = db.init();

dotenv.config();

router.get("/reviews", (req, res) => {
  // #swagger.tags = ['오답노트 API']
  const userId = req.query.userId;

  const sql =
    "select review_idx, review_text, is_reviewed, e.ex_license, ex_test, test_img, ex1, ex2, ex3, ex4, correct_ex from tb_review_note as r, tb_exam as e where r.ex_idx = e.ex_idx and user_id = ?";
  conn.query(sql, [userId], (err, result) => {
    console.log(result);
    res.send(result);
  });
});

// 오답노트 작성하는 api
router.post("/memo", (req, res) => {
  // #swagger.tags = ['오답노트 API']

  const { reviewIdx, memo, userId } = req.body;

  const sql = "update tb_review_note set is_reviewed = 'Y', review_text = ? where review_idx = ?";
  conn.query(sql, [memo, reviewIdx], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).end();
    } else {
      console.log("오답노트 작성 성공");
      const add_point = "update tb_user set user_point = tb_user.user_point + 5 where user_id = ?";
      conn.query(add_point, [userId], (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).end();
        } else {
          console.log("포인트 지급 완료");
          res.end();
        }
      });
    }
  });
});

module.exports = router;
