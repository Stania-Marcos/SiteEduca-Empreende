import mysql2 from "mysql2";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const conexao = mysql2
  .createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "03082022",
    database: process.env.DB_NAME || "educaempreende",
    port: 3306,
    charset: "utf8mb4",
  })
  .promise();

conexao.connect((erro) => {
  if (erro) {
    console.log("Erro ao se conectar com a base de dados:", erro.message);
  } else {
    console.log("✅ Conexão com a base de dados realizada com sucesso");
  }
});

export default conexao;
