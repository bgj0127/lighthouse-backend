const express = require("express");
const moment = require("moment");
const dotenv = require("dotenv");
const router = express.Router();
const conn = require("../config/mysql");
const os = require("os");
const { default: axios } = require("axios");

const jetsonUrl = "http://192.168.219.43:8000";

dotenv.config();

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      // IPv4, 내부 네트워크가 아닌 주소를 필터링
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "IP 주소를 찾을 수 없습니다.";
}
const getExam = async (userId) => {
  const response = await axios
    .get(`${jetsonUrl}/test?userId=${userId}`)
    .then((res) => {
      // console.log(res.data);
      return res.data;
    })
    .catch((err) => {
      console.log(err);
    });
  return response;
};

router.get("/check-body", async (req, res) => {
  try {
    const response = await axios({
      url: `${jetsonUrl}/check`,
      method: "GET",
      responseType: "stream",
    });

    res.setHeader("Content-Type", "image/jpeg");
    response.data.pipe(res);
    console.log("GET /check-body - 200 OK");
  } catch (e) {
    console.error("Error fetching image:", e.message);
    console.log("GET /check-body - 500 ERROR");
    res.status(500).json({ e: "Failed to fetch image" });
  }
});

router.post("/start-study", (req, res) => {
  const { userId } = req.body;
  const st_dt = moment().format();

  // task.start();

  const sql = "insert into tb_study_time (user_id, study_st_dt) values (?,?)";
  conn.query(sql, [userId, st_dt], (err, result) => {
    if (err) {
      console.log("POST /start-study - 500 ERROR", err.message);
      res.status(500).end();
    } else {
      console.log("POST /start-study - 200 OK");
      res.status(200).send({ serverIP: getLocalIP() }).end();
    }
  });
});

router.post("/start-detect", async (req, res) => {
  const { userId } = req.body;

  let p = [];
  let isP = 0;
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      getExam(userId)
        .then((response) => {
          console.log("res >>", response);
          p.push(response["isStudy"]);
          isP = p.reduce((pre, cur) => {
            return pre + cur;
          }, 0);
          // 그냥 테스트용으로 만든 조건문
          if (p.length == 4 && isP == 0) {
            console.log("공부 안하고 있대요~");
            axios.post("http://localhost:3080/study/update-time", { userId: userId });
            res.status(200).end();
          } else if (p.length == 4 && isP > 0) {
            res.status(200).end();
          }
        })
        .catch((err) => {
          console.log(err.message);
        });
    }, i * 5000);
  }
});

router.post("/end-study", (req, res) => {
  const { userId } = req.body;
  const ed_dt = moment().format();

  // task.stop();

  const sql =
    "update tb_study_time join(select max(study_st_dt) as latest_start from tb_study_time where user_id = ?) as subquery on tb_study_time.study_st_dt = subquery.latest_start set study_ed_dt = ?";
  const data = [userId, ed_dt];
  conn.query(sql, data, (err, result) => {
    if (err) {
      console.log("POST /end-study - 500 ERROR", err.message);
      res.status(500).end();
    } else {
      console.log("POST /end-study - 200 OK");
      res.status(200).end();
    }
  });
});

router.post("/update-time", (req, res) => {
  // 유저아이디, 시작시간, 끝시간, 쉰 시간(초) 배열
  const { userId } = req.body;

  const update_time =
    "update tb_study_time join(select max(study_st_dt) as latest_start from tb_study_time where user_id = ?) as subquery on tb_study_time.study_st_dt = subquery.latest_start set tb_study_time.rest_sec = ifnull(tb_study_time.rest_sec,0) + 20";
  conn.query(update_time, [userId], (err, result) => {
    if (err) {
      console.log("POST /update-time - 500 ERROR", err.message);
      res.status(500).end();
    } else {
      console.log("POST /update-time - 200 OK", `USER: ${userId}`, result.info);
      res.status(200).end();
    }
  });
});

module.exports = router;
