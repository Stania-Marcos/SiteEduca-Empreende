import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import mysql from 'mysql2/promise';
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
const router = express.Router();
const app = express();
const port = 4000;

// Configuração para CORS (Permite acesso de qualquer origem)


// Configuração para o Express lidar com JSON e URL-encoded

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




// Inicia o servidor
app.listen(port, (erro) => {
  if (erro) {
    console.log("Falha ao iniciar o servidor");
  } else {
    console.log(`Servidor iniciado com sucesso na porta ${port}`);
  }
});
