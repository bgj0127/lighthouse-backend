const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const db_info = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "campus_24IS_IOT_p3_3",
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  multipleStatements: true,
};

const conn = mysql.createPool(db_info);

module.exports = conn;
