const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DADOS_PATH = path.join(__dirname, 'dados.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// GET /api/dados — carrega todo o JSON
app.get('/api/dados', (req, res) => {
  try {
    const raw = fs.readFileSync(DADOS_PATH, 'utf8');
    const data = JSON.parse(raw);
    res.json(data);
  } catch (e) {
    console.error('Erro lendo dados.json:', e.message);
    res.status(500).json({ error: 'Erro lendo dados.json' });
  }
});

// POST /api/salvar — salva um novo registro
app.post('/api/salvar', (req, res) => {
  try {
    const raw = fs.readFileSync(DADOS_PATH, 'utf8');
    const data = JSON.parse(raw);
    const novoRegistro = req.body;

    // Encontra se já existe registro com essa data e atualiza, senão adiciona
    const idx = data.registros.findIndex(r => r.data === novoRegistro.data);
    if (idx >= 0) {
      data.registros[idx] = { ...data.registros[idx], ...novoRegistro };
    } else {
      data.registros.push(novoRegistro);
      data.registros.sort((a, b) => a.data.localeCompare(b.data));
      data.total_dias = data.registros.length;
    }

    // Atualiza período
    if (data.registros.length > 0) {
      data.periodo.inicio = data.registros[0].data;
      data.periodo.fim = data.registros[data.registros.length - 1].data;
    }

    fs.writeFileSync(DADOS_PATH, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true, message: 'Dados salvos' });
  } catch (e) {
    console.error('Erro salvando:', e.message);
    res.status(500).json({ error: 'Erro ao salvar' });
  }
});

// POST /api/salvar-lote — salva múltiplos registros (pra colar de Excel)
app.post('/api/salvar-lote', (req, res) => {
  try {
    const raw = fs.readFileSync(DADOS_PATH, 'utf8');
    const data = JSON.parse(raw);
    const registros = req.body.registros || [];

    registros.forEach(novoReg => {
      const idx = data.registros.findIndex(r => r.data === novoReg.data);
      if (idx >= 0) {
        data.registros[idx] = { ...data.registros[idx], ...novoReg };
      } else {
        data.registros.push(novoReg);
      }
    });

    data.registros.sort((a, b) => a.data.localeCompare(b.data));
    data.total_dias = data.registros.length;

    if (data.registros.length > 0) {
      data.periodo.inicio = data.registros[0].data;
      data.periodo.fim = data.registros[data.registros.length - 1].data;
    }

    fs.writeFileSync(DADOS_PATH, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true, count: registros.length });
  } catch (e) {
    console.error('Erro salvando lote:', e.message);
    res.status(500).json({ error: 'Erro ao salvar lote' });
  }
});

// DELETE /api/deletar/:data — deleta um registro por data
app.delete('/api/deletar/:data', (req, res) => {
  try {
    const raw = fs.readFileSync(DADOS_PATH, 'utf8');
    const data = JSON.parse(raw);
    const { data: dataStr } = req.params;

    data.registros = data.registros.filter(r => r.data !== dataStr);
    data.total_dias = data.registros.length;

    if (data.registros.length > 0) {
      data.periodo.inicio = data.registros[0].data;
      data.periodo.fim = data.registros[data.registros.length - 1].data;
    }

    fs.writeFileSync(DADOS_PATH, JSON.stringify(data, null, 2), 'utf8');
    res.json({ success: true, message: 'Registro deletado' });
  } catch (e) {
    console.error('Erro deletando:', e.message);
    res.status(500).json({ error: 'Erro ao deletar' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Dashboard rodando em http://localhost:${PORT}`);
  console.log(`📊 Dados: ${DADOS_PATH}`);
});
