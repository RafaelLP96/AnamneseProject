import express from 'express';
import multer   from 'multer';
import { PrismaClient } from '@prisma/client';
import supabase from '../src/storage.js';

const prisma  = new PrismaClient();
const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage() });

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
      where: { registrado_por: req.usuario.id },
      orderBy: { data_consulta: 'desc' },
      select: {
        id: true,
        nome_social: true,
        identidade_genero: true,
        data_consulta: true,
        data_proxima_consulta: true,
        criado_em: true
      }
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

// POST /prontuarios/:id/fotos
router.post('/:id/fotos', upload.single('foto'), async (req, res) => {
  if (!req.file)
    return res.status(400).json({ erro: 'Nenhuma foto enviada' });

  const ext     = req.file.originalname.split('.').pop();
  const caminho = `${req.params.id}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('fotos-prontuarios')
    .upload(caminho, req.file.buffer, { contentType: req.file.mimetype });

  if (error) {
    console.error('Supabase upload error:', error);
    return res.status(500).json({ erro: 'Erro ao fazer upload', detalhes: error.message });
  }

  const { data, error: signedUrlError } = await supabase.storage
    .from('fotos-prontuarios')
    .createSignedUrl(caminho, 3600);

  if (signedUrlError) {
    console.error('Supabase signed URL error:', signedUrlError);
    return res.status(500).json({ erro: 'Erro ao gerar URL de download', detalhes: signedUrlError.message });
  }

  const prontuario = await prisma.prontuarios.findUnique({
    where: { id: req.params.id }
  });

  const fotosAtuais = prontuario.dados?.fotos ?? [];

  await prisma.prontuarios.update({
    where: { id: req.params.id },
    data: {
      dados: {
        ...prontuario.dados,
        fotos: [...fotosAtuais, { caminho, descricao: req.body.descricao ?? '' }]
      }
    }
  });

  res.status(201).json({ url: data.signedUrl, caminho });
});

// GET /prontuarios/:id/fotos
router.get('/:id/fotos', async (req, res) => {
  try {
    const prontuario = await prisma.prontuarios.findUnique({
      where: { id: req.params.id }
    });

    const fotos = prontuario?.dados?.fotos ?? [];

    const urls = await Promise.all(fotos.map(async (foto) => {
      const { data } = await supabase.storage
        .from('fotos-prontuarios')
        .createSignedUrl(foto.caminho, 3600);
      return { ...foto, url: data.signedUrl };
    }));

    res.json(urls);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar fotos' });
  }
});

export default router;