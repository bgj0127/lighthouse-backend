const express = require("express");
const moment = require("moment");
const dotenv = require("dotenv");
const router = express.Router();
const conn = require("../config/mysql");
const os = require("os");
const cron = require("node-cron");
const { default: axios } = require("axios");

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

// test용 axios
const getExam = async (userId) => {
  const response = await axios
    .get(`http://192.168.219.43:8000/test?userId=${userId}`)
    .then((res) => {
      // console.log(res.data);
      return res.data;
    })
    .catch((err) => {
      console.log(err);
    });
  return response;
};

// 반복수행하는 함수
let task = cron.schedule(
  "*/30 * * * * *",
  () => {
    let p = [];
    let userId = "";
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        getExam("dkwjd")
          .then((res) => {
            console.log("res >>", res);
            console.log("res[0] >> ", res[0]);
            console.log("res[1] >> ", res[1]);
            p.push(res["isStudy"]);
            userId = res["userId"];
            // 그냥 테스트용으로 만든 조건문
            if (
              p.length == 5 &&
              p.reduce((pre, cur) => {
                return pre + cur;
              }, 0) == 0
            ) {
              console.log("공부 안하고 있대요~");
              axios.post("http://192.168.219.77:3080/study/update-time", { userId: userId });
            }
          })
          .catch((err) => {
            console.log(err.message);
          });
      }, i * 4000);
    }
    console.log("hellll");
  },
  {
    scheduled: false,
  }
);

router.post("/start-study", (req, res) => {
  const { userId } = req.body;
  const st_dt = moment().format();

  task.start();

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

router.post("/end-study", (req, res) => {
  const { userId } = req.body;
  const ed_dt = moment().format();

  task.stop();

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

  // 20초마다 3초 간격으로 실행시켜서 전부 공부 안하고 있으면 15초 추가하는 쿼리문
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
