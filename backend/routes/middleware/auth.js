import jwt from 'jsonwebtoken';

export function autenticar(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  console.log('Middleware autenticar:');
  console.log('- Authorization header:', req.headers.authorization?.substring(0, 20) + '...' || 'Não encontrado');
  console.log('- Token extraído:', token ? 'Sim' : 'Não');

  if (!token)
    return res.status(401).json({ erro: 'Token não fornecido' });

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    console.log('- Usuário verificado:', req.usuario.id);
    next();
  } catch (erro) {
    console.error('- Erro ao verificar token:', erro.message);
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}