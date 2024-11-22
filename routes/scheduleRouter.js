const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const router = express.Router();

dotenv.config();

// 자격증 시험일정 조회 출력결과
// docRegStartDt  : 필기시험 원서접수 시작일자
// docRegEndDt    : 필기시험 원서접수 종료일자
// docExamStartDt : 필기시험 시작일자
// docExamEndDt   : 필기시험 종료일자
// docPassDt      : 필기시험 합격자 발표일자
router.get("/list", async (req, res) => {
  // #swagger.tags = ['일정조회 API']
  try {
    await axios
      .get(
        "http://apis.data.go.kr/B490007/qualExamSchd/getQualExamSchdList" +
          `?serviceKey=${process.env.API_KEY}` +
          "&numOfRows=50&pageNo=1&dataFormat=json&implYy=2024&qualgbCd=T&jmCd=7910"
      )
      .then((data) => {
        res.send({ data: data.data.body });
      })
      .catch((err) => {
        console.log(err.message);
      });
  } catch {
    res.status(500).json({ message: "server error" });
  }
});

module.exports = router;
