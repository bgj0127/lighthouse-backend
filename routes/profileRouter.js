const express = require("express");
const moment = require("moment");
const imageUplaoder = require("../config/imageUploader");
const dotenv = require("dotenv");
const router = express.Router();

const db = require("../config/mysql");
const conn = db.init();

dotenv.config();

router.get("/study-info", (req, res) => {
  const userId = req.query.userId;

  const sql = "select * from tb_study_time where user_id = ? and study_st_dt >= date_sub(curdate(), interval 4 day)";
  conn.query(sql, [userId], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).end();
    } else {
      const realTimeList = Object.values(
        result.reduce((acc, curr) => {
          const date = new Date(curr.study_st_dt).toISOString().split("T")[0];

          const startTime = new Date(curr.study_st_dt);
          const endTime = new Date(curr.study_ed_dt);

          const timeDifferenceInMinutes = Math.floor((endTime - startTime) / 1000 / 60);

          if (!acc[date]) {
            acc[date] = { date, real_study_time: 0, total_study_time: 0 };
          }
          acc[date].real_study_time += parseInt(curr.study_time, 10);
          acc[date].total_study_time += timeDifferenceInMinutes;

          return acc;
        }, {})
      );
      res.send(realTimeList);
    }
  });
});

router.get("/user-profile/:userId", (req, res) => {
  // #swagger.tags = ['유저 프로필 API']
  const userId = req.params.userId;
  const sql = "select user_name, user_image, user_point from tb_user where user_id = ?";
  conn.query(sql, [userId], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send({ message: "server error" });
    }
    res.send(result[0]);
  });
});

router.post("/upload-image", imageUplaoder.single("image"), (req, res) => {
  // #swagger.tags = ['유저 프로필 API']
  /*  #swagger.parameters[''] = {
      in: 'query',
      description: '프로필 이미지 업로드는 반드시 ?directory=profile',
      type:'string'
   } */
  /* #swagger.requestBody = {
    required: true,
    content: {
    "application/json": {
      schema: {
        image: 'file',
        userId: 'string'
      }
      example: {
      }
    }
    }
  }
   */
  res.setHeader("Content-Type", "multipart/form-data");
  const userId = req.body.userId;
  console.log(userId);
  console.log("이미지 업로드");
  const sql = "update tb_user set user_image=? where user_id = ?";
  const data = [`https://lighthouse-project-storage.s3.ap-northeast-2.amazonaws.com/profile/${userId}.png`, userId];
  conn.query(sql, data, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      console.log(result);
    }
  });
  res.send({ message: "success" });
});

module.exports = router;
