import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

const app = express();
const port = 4000;

// Configurações básicas
app.use(cors({ origin: "*" }));
dotenv.config({ path: "./config/.env" });

app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir o front-end
app.use(express.static(path.join(__dirname, "../../Front-End")));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Front-End/Html/Main.html'));
});

const paginas = [
  "Main2", "Main", "Admin", "blog", "diagnosticoEmpresarial",
  "InformacoesBlog", "index", "servicos", "confirmarEmail"
];
paginas.forEach(pagina => {
  app.get(`/${pagina}.html`, (req, res) => {
    res.sendFile(path.join(__dirname, `../../Front-End/Html/${pagina}.html`));
  });
});

// Email apenas para simulação
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "educaempreende2024@gmail.com",
    pass: "ivxq eonm bjvi cngf",
  },
});
function gerarCodigo() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}
const codigosVerificacao = new Map();

app.post("/api/cadastrar", async (req, res) => {
  const { email } = req.body;
  const codigoVerificacao = gerarCodigo();
  codigosVerificacao.set(email, codigoVerificacao);

  try {
    await transporter.sendMail({
      from: "educaempreende2024@gmail.com",
      to: email,
      subject: "Código de Verificação",
      text: `Seu código de verificação é: ${codigoVerificacao}`,
    });
    res.status(200).json({ mensagem: "Código enviado para o e-mail" });
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    res.status(500).json({ mensagem: "Erro ao enviar e-mail." });
  }
});

app.post("/api/verificar-codigo", (req, res) => {
  const { email, codigo } = req.body;
  if (codigo === codigosVerificacao.get(email)) {
    codigosVerificacao.delete(email);
    res.status(200).json({ redirect: "/Main.html" });
  } else {
    res.status(400).json({ mensagem: "Código incorreto" });
  }
});

// Uploads de imagens
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

// Rota de teste para upload de imagem
app.post("/upload", upload.single("imagem"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ mensagem: "Nenhum arquivo enviado" });
  }
  res.status(200).json({ mensagem: "Upload realizado", arquivo: req.file.filename });
});

// Middleware padrão
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Início do servidor
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
});
