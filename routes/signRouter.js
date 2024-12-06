const express = require("express");
const conn = require("../config/mysql");
const router = express.Router();

const dotenv = require("dotenv");
dotenv.config();

router.post("/login", (req, res) => {
  // #swagger.description = '로그인'
  // #swagger.tags = ['유저 로그인/회원가입 API']
  const { userId, userPw } = req.body;
  const sql = "select user_name,user_id, is_first from tb_user where user_id = ? and user_pw = sha2(?,256)";
  conn.query(sql, [userId, userPw], (err, result) => {
    if (err) {
      console.log("query is not excuted: " + err);
      res.status(500).send({ message: "server error" });
    }
    if (result.length <= 0) {
      console.log(`로그인 실패:${userId} / ${userPw}`);
      res.status(400).send({ message: "아이디 혹은 비밀번호가 잘못되었습니다." });
    } else {
      console.log(`로그인 성공:${userId} / ${userPw}`);
      res.status(200).send({ userId: result[0].user_id, userName: result[0].user_name, isFirst: result[0].is_first });
    }
  });
});

router.post("/join", (req, res) => {
  // #swagger.description = '회원가입'
  // #swagger.tags = ['유저 로그인/회원가입 API']
  const { userId, userPw, userName, userBirthdate, userEmail, userPhone } = req.body;
  console.log(req.body);
  const sql =
    "insert into tb_user (user_id, user_pw, user_name, user_birthdate, user_email, user_phone, user_point, user_image) values (?,sha2(?,256),?,?,?,?,?,?)";
  const data = [
    userId,
    userPw,
    userName,
    userBirthdate,
    userEmail,
    userPhone,
    0,
    `${process.env.S3_URL}/profile/default_user_image.png`,
  ];
  conn.query(sql, data, (err, result) => {
    if (err) {
      console.log("query is not excuted: " + err);
      res.status(400).send({ code: 400, message: "회원가입 실패" });
      return;
    }
    console.log("회원가입 성공 - 200");
    res.status(200).send({ code: 200, message: "회원가입 완료" });
  });
});

router.get("/checkid", (req, res) => {
  // #swagger.tags = ['유저 로그인/회원가입 API']
  const userId = req.body.userId;
  const sql = "select user_id from tb_user where user_id = ?";
  conn.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("query is not excuted: " + err);
      res.status(500).send({ message: "sever error" });
    }
    if (result.length > 0) {
      res.status(409).send({ message: "존재하는 아이디 입니다." });
    } else {
      res.status(200).send({ message: "사용 가능한 아이디 입니다." });
    }
  });
});

router.get("/id-phone", (req, res) => {
  // #swagger.tags = ['유저 로그인/회원가입 API']
  const { userId, userPhone } = req.body;
  const sql = "select user_id from tb_user where user_id = ? and user_phone = ?";
  const data = [userId, userPhone];
  conn.query(sql, data, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ message: "server error" });
    }
    if (result.length <= 0) {
      console.log(result);
      res.status(400).send({ message: "아이디 혹은 전화번호를 확인해주세요." });
    }
    res.send(result[0]);
  });
});

router.post("/change-password", (req, res) => {
  // #swagger.tags = ['유저 로그인/회원가입 API']
  const { userId, userPw } = req.body;
  const sql = "update tb_user set user_pw=sha2(?,256) where user_id = ?";
  const data = [userPw, userId];
  conn.query(sql, data, (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ message: "server error" });
    }
    console.log(result);
    res.end();
  });
});

module.exports = router;
