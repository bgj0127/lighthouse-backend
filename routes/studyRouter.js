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
    .get(`http://192.168.219.51:8000/test`, {
      userId: userId,
    })
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
  "*/20 * * * * *",
  () => {
    let p = [];
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const t = moment().format();
        getExam("hello")
          .then((res) => {
            p.push(res);
            console.log("DATA : ", p);
            if (
              p.length == 5 &&
              p.reduce((pre, cur) => {
                return pre + cur;
              }, 0) <= 3
            ) {
              console.log("SLEEP!!");
            }
            // console.log(t, p);
          })
          .catch((err) => {
            console.log(err.message);
          });
      }, i * 3000);
    }
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
  const { userId, stTime, edTime } = req.body;

  const st_dt = moment(stTime, "YYYYMMDD HH:mm:ss");
  const ed_dt = moment(edTime, "YYYYMMDD HH:mm:ss");
  const restTimes = [1, 4, 73, 42, 10];

  const restTimeSum = restTimes.reduce((acc, cur) => {
    return acc + cur;
  }, 0);

  console.log(st_dt, ed_dt);

  const realStudy = Math.floor((ed_dt.diff(st_dt, "minute") * 60 - restTimeSum) / 60);
  const sql = "insert into tb_study_time (user_id, study_st_dt, study_ed_dt, study_time) values (?,?,?,?)";
  conn.query(sql, [userId, st_dt.format(), ed_dt.format(), realStudy], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).end();
    } else {
      console.log(result);
      res.status(200).end();
    }
  });
  res.send({ realStudy });
});

module.exports = router;
