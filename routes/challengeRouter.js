const express = require("express");
const moment = require("moment");
const challenges = require("../constants/challenges");
const router = express.Router();
const db = require("../config/mysql");
const conn = db.init();

// 신청 가능한 챌린지 목록 조회
router.get("/all-challenges", (req, res) => {
  // #swagger.tags = ['챌린지 API']
  res.send(challenges);
});

router.use("/create-challenge", (req, res, next) => {
  const { userId, challengeId } = req.body;
  const chal_info = challenges.filter((item) => item.id === challengeId)[0];

  const title = chal_info.name;

  const verifySql = `select * from tb_challenge where is_succeed is null and chal_title = ? and user_id = ?`;
  const verifyData = [title, userId];
  conn.query(verifySql, verifyData, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ message: "server error" });
    } else if (result.length > 0) {
      res.status(409).send({ message: "이미 진행중인 챌린지 입니다." });
    } else {
      next();
    }
  });
});

// 특정 챌린지 선택하여 챌린지 진행하기
router.post("/create-challenge", (req, res) => {
  // #swagger.tags = ['챌린지 API']

  const { userId, challengeId } = req.body;
  const chal_info = challenges.filter((item) => item.id === challengeId)[0];

  const now_dt = moment();

  const st_dt = now_dt.format("YYYY-MM-DD");
  const ed_dt = now_dt.add(chal_info.period, "day").format("YYYY-MM-DD");

  const sql =
    "insert into tb_challenge (chal_type, user_id, chal_title, chal_st_dt, chal_ed_dt, chal_desc, chal_point) values (?,?,?,?,?,?,?)";
  const data = [chal_info.type, userId, chal_info.name, st_dt, ed_dt, chal_info.description, chal_info.point];
  conn.query(sql, data, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ message: "server error" });
    } else res.status(200).send({ message: "챌린지 생성" });
  });
});

// 내 챌린지 목록
router.get("/my-challenges/:userId", (req, res) => {
  // #swagger.tags = ['챌린지 API']

  const userId = req.params.userId;

  const sql =
    "select chal_idx, chal_title, chal_desc, chal_point, chal_st_dt, chal_ed_dt from tb_challenge where user_id = ?";
  const data = [userId];
  conn.query(sql, data, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ message: "server error" });
    } else res.status(200).send(result);
  });
});

module.exports = router;
