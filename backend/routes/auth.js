import express       from 'express';
import bcrypt        from 'bcryptjs';
import jwt           from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// POST /auth/cadastro
router.post('/cadastro', async (req, res) => {
  const { nome, username, senha } = req.body;

  if (!nome || !username || !senha)
    return res.status(400).json({ erro: 'Preencha todos os campos' });

  try {
    const existe = await prisma.usuarios.findUnique({ where: { username } });
    if (existe)
      return res.status(409).json({ erro: 'Username já em uso' });

    const senha_hash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuarios.create({
      data: { nome, username, senha_hash },
      select: { id: true, nome: true, username: true, criado_em: true }
    });

    res.status(201).json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  const { username, senha } = req.body;

  if (!username || !senha)
    return res.status(400).json({ erro: 'Preencha todos os campos' });

  try {
    const usuario = await prisma.usuarios.findFirst({
      where: { username, ativo: true }
    });

    if (!usuario)
      return res.status(401).json({ erro: 'Usuário ou senha inválidos' });

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaCorreta)
      return res.status(401).json({ erro: 'Usuário ou senha inválidos' });

    const token = jwt.sign(
      { id: usuario.id, username: usuario.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, username: usuario.username }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao fazer login' });
  }
});

export default router;