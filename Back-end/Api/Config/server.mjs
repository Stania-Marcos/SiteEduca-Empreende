import mysql2 from "mysql2";
import dotenv from "dotenv";
import { parse } from "url";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Lê e destrutura a URL
console.log("DB_URL:", process.env.DB_URL); // ✅ ADICIONE ISSO

const dbUrl = process.env.DB_URL?.trim();
const parsed = new URL(dbUrl); 
// Pega os dados da URL
const host = parsed.hostname;
const user = parsed.username;
const password = parsed.password;
const database = parsed.pathname.replace("/", "");
const port = parsed.port || 3306;

// Cria a conexão
const conexao = mysql2
  .createConnection({
    host,
    user,
    password,
    port,
    database,
    charset: "utf8mb4",
  })
  .promise();

conexao.connect((erro) => {
  if (erro) {
    console.log("Erro ao se conectar com a base de dados", erro.message);
  } else {
    console.log("Conexão com a base de dados realizada com sucesso");
  }
});

export default conexao;
