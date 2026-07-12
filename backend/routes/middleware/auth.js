import jwt from 'jsonwebtoken';

export function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token)
    return res.status(401).json({ erro: 'Token não fornecido' });

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET não configurado');
    return res.status(500).json({ erro: 'Configuração de autenticação ausente' });
  }

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch (erro) {
    console.error('Erro ao verificar token:', erro.message);
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}