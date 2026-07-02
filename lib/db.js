import mysql from "mysql2/promise";

let pool;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "yourhost",
      port: process.env.DB_PORT || portnumber,
      user: process.env.DB_USER || "username",
      password: process.env.DB_PASSWORD || "password",
      database: process.env.DB_NAME || "dbname",
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}
