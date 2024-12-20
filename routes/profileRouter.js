const express = require("express");
const imageUplaoder = require("../config/imageUploader");
const dotenv = require("dotenv");
const router = express.Router();

const conn = require("../config/mysql");

dotenv.config();

router.get("/study-info", (req, res) => {
  const userId = req.query.userId;

  const sql =
    "select * from tb_study_time where user_id = ? and study_st_dt >= date_sub(curdate(), interval 4 day) order by study_st_dt";

  conn.query(sql, [userId], (err, result) => {
    if (err) {
      console.log("GET /study-info 500 ERROR", err.message);
      res.status(500).end();
    } else {
      console.log(result);
      const realTimeList = Object.values(
        result.reduce((acc, curr) => {
          const date = new Date(curr.study_st_dt).toISOString().split("T")[0];
          // 공부가 끝나지 않았을 때 조회하면 0,0으로 반환하도록 예외처리
          if (curr.study_ed_dt == null) {
            acc[date] = { date, real_study_time: 0, total_study_time: 0 };
            return acc;
          }
          console.log(curr.study_ed_dt);
          const startTime = new Date(curr.study_st_dt);
          const endTime = new Date(curr.study_ed_dt);

          const timeDifferenceInMinutes = Math.floor((endTime - startTime) / 1000 / 60);

          if (!acc[date]) {
            acc[date] = { date, real_study_time: 0, total_study_time: 0 };
          }
          acc[date].real_study_time += parseInt(
            timeDifferenceInMinutes - parseInt(curr.rest_sec !== null ? curr.rest_sec : 0, 10) / 60
          );
          acc[date].total_study_time += timeDifferenceInMinutes;
          return acc;
        }, {})
      );
      console.log("GET /study-info 200 OK", realTimeList);
      res.status(200).send(realTimeList);
    }
  });
});

router.get("/user-profile/:userId", (req, res) => {
  // #swagger.tags = ['유저 프로필 API']
  const userId = req.params.userId;
  const sql = "select user_name, user_image, user_point from tb_user where user_id = ?";
  conn.query(sql, [userId], (err, result) => {
    if (err) {
      console.log("GET /user-profile 500 ERROR", err.message);
      res.status(500).send({ message: "server error" });
    }
    console.log("GET /user-profile 200 OK", result[0]);
    res.status(200).send(result[0]);
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
