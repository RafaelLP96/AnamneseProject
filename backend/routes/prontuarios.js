import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// POST /prontuarios
router.post('/', async (req, res) => {
  const { nome_social, identidade_genero, data_consulta, data_proxima_consulta, dados } = req.body;

  if (!nome_social || !data_consulta)
    return res.status(400).json({ erro: 'nome_social e data_consulta são obrigatórios' });

  try {
    const prontuario = await prisma.prontuarios.create({
      data: {
        nome_social,
        identidade_genero,
        data_consulta:         new Date(data_consulta),
        data_proxima_consulta: data_proxima_consulta ? new Date(data_proxima_consulta) : null,
        dados:                 dados ?? {},
        registrado_por:        req.usuario.id
      }
    });

    res.status(201).json(prontuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao salvar prontuário' });
  }
});

// GET /prontuarios — lista prontuários do usuário logado
router.get('/', async (req, res) => {
  try {
    const prontuarios = await prisma.prontuarios.findMany({
      where: { registrado_por: req.usuario.id }, // ✅ filtrado pelo usuário
      orderBy: { data_consulta: 'desc' }
    });
    res.json(prontuarios);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar prontuários' });
  }
});

// GET /prontuarios/:id
router.get('/:id', async (req, res) => {
  try {
    const prontuario = await prisma.prontuarios.findUnique({
      where: { id: req.params.id }
    });
    if (!prontuario)
      return res.status(404).json({ erro: 'Prontuário não encontrado' });

    res.json(prontuario);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar prontuário' });
  }
});

// PATCH /prontuarios/:id
router.patch('/:id', async (req, res) => {
  const { nome_social, identidade_genero, data_consulta, data_proxima_consulta, dados } = req.body;

  try {
    const prontuario = await prisma.prontuarios.update({
      where: { id: req.params.id },
      data: {
        ...(nome_social           && { nome_social }),
        ...(identidade_genero     && { identidade_genero }),
        ...(data_consulta         && { data_consulta: new Date(data_consulta) }),
        ...(data_proxima_consulta && { data_proxima_consulta: new Date(data_proxima_consulta) }),
        ...(dados                 && { dados })
      }
    });
    res.json(prontuario);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar prontuário' });
  }
});

// DELETE /prontuarios/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.prontuarios.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao deletar prontuário' });
  }
});

export default router;