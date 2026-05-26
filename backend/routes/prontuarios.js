import express from 'express';
import multer   from 'multer';
import PDFDocument from 'pdfkit';
import { PrismaClient } from '@prisma/client';
import supabase from '../src/storage.js';

const prisma  = new PrismaClient();
const router  = express.Router();
const upload  = multer({ storage: multer.memoryStorage() });

// POST /prontuarios
router.post('/', async (req, res) => {
  const { nome_social, identidade_genero, data_consulta, data_proxima_consulta, dados } = req.body;

  console.log('POST /prontuarios:');
  console.log('- usuario.id:', req.usuario?.id);
  console.log('- nome_social:', nome_social);
  console.log('- identidade_genero:', identidade_genero);
  console.log('- data_consulta:', data_consulta);

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

    console.log('- Prontuário criado com ID:', prontuario.id);
    res.status(201).json(prontuario);
  } catch (err) {
    console.error('- Erro ao salvar:', err);
    res.status(500).json({ erro: 'Erro ao salvar prontuário' });
  }
});

// GET /prontuarios — lista prontuários do usuário logado
router.get('/', async (req, res) => {
  try {
    console.log('GET /prontuarios - usuario.id:', req.usuario?.id);

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

    console.log('Prontuários encontrados:', prontuarios.length);
    res.json(prontuarios);
  } catch (err) {
    console.error('Erro ao buscar prontuários:', err);
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

    if (prontuario.registrado_por !== req.usuario.id)
      return res.status(403).json({ erro: 'Acesso negado' });

    res.json(prontuario);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar prontuário' });
  }
});

// GET /prontuarios/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  try {
    const prontuario = await prisma.prontuarios.findUnique({
      where: { id: req.params.id },
      include: {
        usuarios: {
          select: { nome: true, username: true }
        }
      }
    });

    if (!prontuario)
      return res.status(404).json({ erro: 'Prontuário não encontrado' });

    if (prontuario.registrado_por !== req.usuario.id)
      return res.status(403).json({ erro: 'Acesso negado' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prontuario-${prontuario.nome_social}.pdf"`);

    const doc   = new PDFDocument({ margin: 50, size: 'A4' });
    const dados = prontuario.dados || {};
    doc.pipe(res);

    // helpers
    const secao = (titulo) => {
      doc.moveDown(0.8);
      doc.fontSize(13).fillColor('#0163a1').text(titulo);
      doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor('#cccccc').lineWidth(1).stroke();
      doc.moveDown(0.4);
    };

    const campo = (label, valor) => {
      if (valor === undefined || valor === null || valor === '') return;
      doc.fontSize(10)
        .fillColor('#0163a1').text(`${label}: `, { continued: true })
        .fillColor('#333333').text(String(valor));
    };

    // Cabeçalho
    doc.fontSize(18).fillColor('#0163a1').text('Prontuário Eletrônico de Enfermagem', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#888888').text('Cuidado integral e humanizado para pessoas trans', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#81d994').lineWidth(2).stroke();
    doc.moveDown(1);

    // 1. Identificação
    secao('1. Identificação');
    campo('Nome social',          prontuario.nome_social);
    campo('Nome civil',           dados.nome_civil);
    campo('Pronome',              dados.pronome);
    campo('Identidade de gênero', prontuario.identidade_genero);
    campo('Idade',                dados.idade);
    campo('Contato',              dados.contato);
    campo('Data da consulta',     prontuario.data_consulta
      ? new Date(prontuario.data_consulta).toLocaleDateString('pt-BR') : '');
    campo('Próxima consulta',     prontuario.data_proxima_consulta
      ? new Date(prontuario.data_proxima_consulta).toLocaleDateString('pt-BR') : '');
    campo('Profissional responsável', prontuario.usuarios?.nome || prontuario.usuarios?.username || '');

    // 2. Queixa principal e HDA
    if (dados.queixa_principal || dados.hda) {
      secao('2. Queixa Principal e HDA');
      campo('Queixa principal', dados.queixa_principal);
      campo('HDA',              dados.hda);
    }

    // 3. Hormonioterapia
    if (dados.tempo_hormonio || dados.med_hormonio_tempo) {
      secao('3. Hormonioterapia');
      campo('Tempo de uso', dados.tempo_hormonio || dados.med_hormonio_tempo);
    }

    // Demais campos
    const ignorar = new Set([
      'nome_civil', 'pronome', 'idade', 'contato', 'nome_social',
      'identidade', 'identidade_genero', 'data_consulta', 'data_proxima_consulta',
      'fotos', 'queixa_principal', 'hda', 'tempo_hormonio', 'med_hormonio_tempo'
    ]);

    const restantes = Object.entries(dados).filter(
      ([k, v]) => !ignorar.has(k) && v !== '' && v !== null && v !== undefined
    );

    if (restantes.length) {
      secao('Outros dados registrados');
      restantes.forEach(([key, val]) => {
        const label = key.replace(/_/g, ' ');
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          const texto = val.valor !== undefined
            ? `${val.valor}${val.data ? ' (' + new Date(val.data).toLocaleDateString('pt-BR') + ')' : ''}`
            : JSON.stringify(val);
          campo(label, texto);
        } else if (Array.isArray(val)) {
          campo(label, val.join(', '));
        } else {
          campo(label, val);
        }
      });
    }

    // Fotos
    const fotos = dados.fotos ?? [];
    if (fotos.length) {
      secao('Fotos anexadas');

      // Busca URLs assinadas para cada foto
      for (const foto of fotos) {
        try {
          const { data: signed } = await supabase.storage
            .from('fotos-prontuarios')
            .createSignedUrl(foto.caminho, 60);

          if (!signed?.signedUrl) continue;

          // Baixa a imagem como buffer
          const imgRes  = await fetch(signed.signedUrl);
          const buffer  = Buffer.from(await imgRes.arrayBuffer());
          const descricao = foto.descricao
            ? foto.descricao.replace(/_/g, ' ')
            : 'foto';

          if (foto.descricao) {
            doc.fontSize(9).fillColor('#555555').text(descricao, { align: 'left' });
            doc.moveDown(0.2);
          }

          doc.image(buffer, { width: 200, height: 200, fit: [200, 200] });
          doc.moveDown(0.5);
        } catch (err) {
          console.warn('Erro ao inserir foto no PDF:', err.message);
        }
      }
    }

    // Rodapé
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#eeeeee').lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('#aaaaaa')
      .text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'right' });

    doc.end();

  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    res.status(500).json({ erro: 'Erro ao gerar PDF' });
  }
});

// POST /prontuarios/:id/fotos
router.post('/:id/fotos', upload.single('foto'), async (req, res) => {
  try {
    const prontuario = await prisma.prontuarios.findUnique({ where: { id: req.params.id } });
    if (!prontuario) return res.status(404).json({ erro: 'Prontuário não encontrado' });
    if (prontuario.registrado_por !== req.usuario.id)
      return res.status(403).json({ erro: 'Acesso negado' });

    if (!req.file) return res.status(400).json({ erro: 'Nenhuma foto recebida' });

    const nomeArquivo = req.file.originalname.replace(/\s+/g, '_');
    const caminho = `${prontuario.id}/${Date.now()}-${nomeArquivo}`;

    const { error: uploadError } = await supabase.storage
      .from('fotos-prontuarios')
      .upload(caminho, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Erro ao salvar foto no storage:', uploadError);
      return res.status(500).json({ erro: 'Erro ao salvar foto' });
    }

    const dados = prontuario.dados || {};
    const fotos = Array.isArray(dados.fotos) ? dados.fotos : [];
    const novaFoto = {
      descricao: req.body.descricao || 'foto',
      caminho,
      nome: req.file.originalname,
      tipo: req.file.mimetype,
      enviado_em: new Date().toISOString()
    };

    dados.fotos = [...fotos, novaFoto];

    await prisma.prontuarios.update({
      where: { id: prontuario.id },
      data: { dados }
    });

    res.status(201).json(novaFoto);
  } catch (err) {
    console.error('Erro ao receber foto:', err);
    res.status(500).json({ erro: 'Erro ao processar upload da foto' });
  }
});

// GET /prontuarios/:id/fotos
router.get('/:id/fotos', async (req, res) => {
  try {
    const prontuario = await prisma.prontuarios.findUnique({ where: { id: req.params.id } });
    if (!prontuario) return res.status(404).json({ erro: 'Prontuário não encontrado' });
    if (prontuario.registrado_por !== req.usuario.id)
      return res.status(403).json({ erro: 'Acesso negado' });

    const dados = prontuario.dados || {};
    const fotos = Array.isArray(dados.fotos) ? dados.fotos : [];
    const resultado = [];

    for (const foto of fotos) {
      if (!foto?.caminho) continue;
      try {
        const { data: signed, error: signedError } = await supabase.storage
          .from('fotos-prontuarios')
          .createSignedUrl(foto.caminho, 60);

        if (signedError || !signed?.signedUrl) {
          console.warn('Não foi possível gerar URL assinada para foto:', signedError);
          continue;
        }

        resultado.push({
          ...foto,
          url: signed.signedUrl
        });
      } catch (err) {
        console.warn('Erro ao gerar URL da foto:', err);
      }
    }

    res.json(resultado);
  } catch (err) {
    console.error('Erro ao buscar fotos:', err);
    res.status(500).json({ erro: 'Erro ao buscar fotos' });
  }
});

// PUT /prontuarios/:id
router.put('/:id', async (req, res) => {
  try {
    const { nome_social, identidade_genero, data_consulta, data_proxima_consulta, dados } = req.body;
    const prontuario = await prisma.prontuarios.findUnique({ where: { id: req.params.id } });
    if (!prontuario) return res.status(404).json({ erro: 'Prontuário não encontrado' });
    if (prontuario.registrado_por !== req.usuario.id)
      return res.status(403).json({ erro: 'Acesso negado' });

    // Preserve existing fotos if not provided in update
    const existingDados = prontuario.dados || {};
    const updatedDados = Object.assign({}, dados || {});
    if (!Array.isArray(updatedDados.fotos) && Array.isArray(existingDados.fotos)) {
      updatedDados.fotos = existingDados.fotos;
    }

    const updateData = {
      nome_social: nome_social ?? prontuario.nome_social,
      identidade_genero: identidade_genero ?? prontuario.identidade_genero,
      data_consulta: data_consulta ? new Date(data_consulta) : prontuario.data_consulta,
      data_proxima_consulta: data_proxima_consulta ? new Date(data_proxima_consulta) : prontuario.data_proxima_consulta,
      dados: updatedDados
    };

    const updated = await prisma.prontuarios.update({ where: { id: prontuario.id }, data: updateData });
    res.json(updated);
  } catch (err) {
    console.error('Erro ao atualizar prontuário:', err);
    res.status(500).json({ erro: 'Erro ao atualizar prontuário' });
  }
});

// DELETE /prontuarios/:id
router.delete('/:id', async (req, res) => {
  try {
    const prontuario = await prisma.prontuarios.findUnique({ where: { id: req.params.id } });
    if (!prontuario) return res.status(404).json({ erro: 'Prontuário não encontrado' });
    if (prontuario.registrado_por !== req.usuario.id)
      return res.status(403).json({ erro: 'Acesso negado' });

    const dados = prontuario.dados || {};
    const fotos = Array.isArray(dados.fotos) ? dados.fotos : [];

    // Remover arquivos do storage (se existirem)
    try {
      const caminhos = fotos.map(f => f.caminho).filter(Boolean);
      if (caminhos.length) {
        const { error } = await supabase.storage.from('fotos-prontuarios').remove(caminhos);
        if (error) console.warn('Erro ao remover arquivos do storage:', error.message || error);
      }
    } catch (err) {
      console.warn('Erro ao remover fotos do storage:', err);
    }

    // Deletar registro do banco
    await prisma.prontuarios.delete({ where: { id: prontuario.id } });

    res.json({ sucesso: true });
  } catch (err) {
    console.error('Erro ao excluir prontuário:', err);
    res.status(500).json({ erro: 'Erro ao excluir prontuário' });
  }
});

export default router;