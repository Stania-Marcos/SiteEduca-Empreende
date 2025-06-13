import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import mysql from 'mysql2/promise';
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.mjs";
import uploads from "./config/multer.mjs";
import conexao from "./config/server.mjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
const router = express.Router();
const app = express();
const port = 4000;

// Configuração para CORS (Permite acesso de qualquer origem)
app.use(cors({ origin: "*" }));
dotenv.config({ path: "./config/.env" });
const SECRET_KEY = process.env.JWT_SECRET;
app.use(
  cors({
    origin: "http://127.0.0.1:5500",
  })
);

// Configuração para o Express lidar com JSON e URL-encoded
app.use(bodyParser.json());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Obtém o diretório do arquivo atual
app.use("/uploads", express.static(path.join(__dirname, "src", "uploads")));


//ACESSANDO OS ARQUIVOS DO FRONT POR ROTAS GET 
app.use(express.static(path.join(__dirname, '../../Front-End')));

app.get('/Main2.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Front-End/Html/Main2.html'));
});
app.get('/Main.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Front-End/Html/Main.html'));
});
app.get('/Admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Front-End/Html/Admin.html'));
});
app.get('/blog.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Front-End/Html/blog.html'));
});
app.get('/diagnosticoEmpresarial.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Front-End/Html/diagnosticoEmpresarial.html'));
});
app.get('/InformacoesBlog.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Front-End/Html/InformacoesBlog.html'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Front-End/Html/index.html'));
});
app.get('/servicos.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Front-End/Html/servicos.html'));
});
app.get('/confirmarEmail.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Front-End/Html/confirmarEmail.html'));
});


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "elianerufinoeliane@gmail.com",
    pass: "rsbd yfmy dtie fmkq",
  },
});

function gerarCodigo() {
  return Math.floor(1000 + Math.random() * 9000).toString(); // 4 dígitos
}

/**
 * Armazenamento temporário dos códigos de verificação em memória.
 * Em produção, use o banco de dados!
 */
const codigosVerificacao = new Map();

// Função para salvar o código na memória
function salvarCodigo(email, codigo) {
  codigosVerificacao.set(email, codigo);
}

// Função para pegar o código salvo
function pegarCodigoSalvo(email) {
  return codigosVerificacao.get(email);
}

// Função para limpar todos os códigos da memória
function limparCodigos() {
  codigosVerificacao.clear();
}

// Função para ativar o usuário no banco de dados
async function ativarUsuario(email) {
  await conexao.query("UPDATE usuarios SET ativo = 1 WHERE email = ?", [email]);
}

// Modifique a rota de cadastro para limpar a memória antes de salvar o novo código
app.post("/api/cadastrar", async (req, res) => {
  const { nome, sobrenome, email, senha } = req.body;

  try {
    const [rows] = await conexao.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(400).json({ mensagem: "E-mail já está cadastrado." });
    }

    const senha_hash = await bcrypt.hash(senha, 10);

    await conexao.query(
      "INSERT INTO usuarios (nome, sobrenome, email, senha_hash, ativo) VALUES (?, ?, ?, ?, 0)",
      [nome, sobrenome, email, senha_hash]
    );

    const codigoVerificacao = gerarCodigo();

    // Limpa todos os códigos antigos antes de salvar o novo
    limparCodigos();
    salvarCodigo(email, codigoVerificacao);

    await transporter.sendMail({
      from: "seuemail@gmail.com",
      to: email,
      subject: "Código de Verificação",
      text: `Seu código de verificação é: ${codigoVerificacao}`,
    });

    return res.status(200).json({ mensagem: "Código enviado para o e-mail" });

  } catch (err) {
    console.error("Erro ao cadastrar ou enviar e-mail:", err);
    return res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
});

// Rota para verificar o código
app.post("/api/verificar-codigo", async (req, res) => {
  const { email, codigo } = req.body;

  const codigoSalvo = pegarCodigoSalvo(email);

  if (codigo === codigoSalvo) {
    await ativarUsuario(email);
    codigosVerificacao.delete(email); // Remove o código após uso
    // Redireciona para Main.html
    res.status(200).json({ redirect: "/Main.html" });
  } else {
    res.status(400).json({ mensagem: "Código incorreto" });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: "E-mail e senha são obrigatórios." });
  }

  try {
    const [rows] = await conexao.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
    }

    const usuario = rows[0];
    if (!usuario.ativo) {
      return res.status(403).json({ mensagem: "Usuário não verificado. Confirme seu e-mail." });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ mensagem: "E-mail ou senha inválidos." });
    }

    // Apenas retorna o caminho para redirecionar
    res.status(200).json({ mensagem: "Login bem-sucedido", redirect: "/Main.html" });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ mensagem: "Erro interno do servidor." });
  }
});



// Rota para receber e cadastrar sugestões

app.post('/sugestao', async (req, res) => {
  const { nome, email, categoria, conteudo } = req.body;

  console.log("📥 Dados recebidos no backend:");
  console.log("Nome:", nome);
  console.log("Email:", email);
  console.log("Categoria:", categoria);
  console.log("Conteúdo:", conteudo);

  if (!nome || !conteudo) {
    console.warn("⚠️ Nome e conteúdo são obrigatórios!");
    return res.status(400).json({ mensagem: 'Nome e conteúdo são obrigatórios.' });
  }

  try {
    const sql = `INSERT INTO BlogSugestoes (nome_usuario, email, categoria, conteudo) VALUES (?, ?, ?, ?)`;
    const [result] = await conexao.execute(sql, [nome, email, categoria, conteudo]);

    console.log(" Sugestão inserida com sucesso, ID:", result.insertId);
    res.status(201).json({ mensagem: 'Sugestão enviada com sucesso!', id: result.insertId });
  } catch (err) {
    console.error(" Erro ao inserir no banco:", err.message);
    res.status(500).json({ mensagem: 'Erro ao salvar sugestão.' });
  }
});

// Garantir que a pasta de uploads existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}


// Configurar armazenamento com multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Pasta onde a imagem será salva
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage }); 

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // Servir imagens publicamente

// Rota para criar um novo post
app.post('/criar-post', upload.single('imagem'), async (req, res) => {
  console.log(" ROTA /criar-post ACIONADA");

  console.log(" req.body:", req.body);
  console.log(" req.file:", req.file);

  const { titulo, categoria, conteudo } = req.body;
  const imagem = req.file ? req.file.filename : null;

  if (!titulo || !categoria || !conteudo || !imagem) {
    console.warn(" Campos ausentes:");
    console.warn("titulo:", titulo);
    console.warn("categoria:", categoria);
    console.warn("conteudo:", conteudo);
    console.warn("imagem:", imagem);
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  const query = `INSERT INTO blog (titulo, categoria, imagem, conteudo) VALUES (?, ?, ?, ?)`;

  try {
    const [result] = await conexao.execute(query, [titulo, categoria, imagem, conteudo]);
    console.log("✅ Post inserido com sucesso, ID:", result.insertId);
    res.status(200).json({ message: 'Post criado com sucesso!' });
  } catch (err) {
    console.error(' Erro ao inserir post no banco:', err.message);
    res.status(500).json({ error: 'Erro ao criar o post.' });
  }
});

//Envia os posts cadatrados para o front
app.get('/api/blog', async (req, res) => {
  try {
    const [rows] = await conexao.execute('SELECT titulo,categoria,imagem,conteudo,data_publicacao FROM blog ORDER BY data_publicacao DESC');
    console.log('Posts do blog recebidos do banco de dados:');
    rows.forEach((row, idx) => {
      console.log(`Post ${idx + 1}:`, row);
    });
    res.status(200).json(rows);
  } catch (err) {
    console.error('Erro ao buscar posts do blog:', err.message);
    res.status(500).json({ error: 'Erro ao buscar posts do blog.' });
  }
});






app.use("/api/usuarios", userRoutes);

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logout bem-sucedido" });
});
app.post(
  "/uploads",
  uploads.single("logo"),
  uploads.single("media"),
  uploads.single("fotoPerfil"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }
    res
      .status(200)
      .json({ message: "Arquivo enviado com sucesso", file: req.file });
  }
);
// Rota para o dashboard
app.get("/dashboard", (req, res) => {
  // Pegue o token do cookie ou da query
  const token = req.cookies.authToken || req.query.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Não autorizado. Token não encontrado." });
  }

  try {
    // Decodifique o token
    const decoded = jwt.verify(token, SECRET_KEY);
    res.send(
      "<h1>Bem-vindo ao Dashboard</h1><p>Seu e-mail foi confirmado!</p>"
    );
  } catch (error) {
    res.status(401).json({ message: "Token inválido ou expirado." });
  }
});
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Inicia o servidor
app.listen(port, (erro) => {
  if (erro) {
    console.log("Falha ao iniciar o servidor");
  } else {
    console.log(`Servidor iniciado com sucesso na porta ${port}`);
  }
});
