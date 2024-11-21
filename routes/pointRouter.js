const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Point Router" });
});

// 문제풀이 후 결과(점수, 포인트)
router.get("/point-amount", (req, res) => {
  const userId = req.body;
  // 특정 유저 포인트 조회 쿼리문 함수
  res.json({ point: 3711 });
});

router.get("/top-users", (req, res) => {
  // TOP 10 포인트 유저 리턴
  const dummy = [
    {
      user: 1290,
      username: "hel",
      point: 100,
    },
    {
      user: 1240,
      username: "he1l",
      point: 98,
    },
    {
      user: 1190,
      username: "qql",
      point: 93,
    },
    {
      user: 1110,
      username: "hwel",
      point: 90,
    },
    {
      user: 1290,
      username: "hel",
      point: 100,
    },
    {
      user: 1290,
      username: "hel",
      point: 100,
    },
    {
      user: 1290,
      username: "hel",
      point: 100,
    },
    {
      user: 1290,
      username: "hel",
      point: 100,
    },
    {
      user: 1290,
      username: "hel",
      point: 100,
    },
    {
      user: 1290,
      username: "hel",
      point: 100,
    },
  ];
  res.status(200).send(dummy);
});

module.exports = router;
