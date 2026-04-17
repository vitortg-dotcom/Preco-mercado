// ============================================================
// PREÇO MERCADO - Google Apps Script Backend v1.0
// ============================================================
// INSTRUÇÕES:
// 1. Cole o ID da sua planilha abaixo (está na URL do Sheets)
// 2. Publique como App da Web: Implantar > Nova implantação
//    - Tipo: App da Web
//    - Executar como: Eu
//    - Quem tem acesso: Qualquer pessoa
// 3. Copie a URL gerada e cole no app (ícone ⚙️)
// ============================================================

const SPREADSHEET_ID = '1AnvSgC1HtBCPewZvHqovmrUvn63xaNsDggCfrW1hWv8';

// ============================================================
// ROTEADOR PRINCIPAL
// ============================================================

function doPost(e) { return handleRequest(e); }
function doGet(e)  { return handleRequest(e); }

function handleRequest(e) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    let p = {};
    if (e.postData && e.postData.contents) {
      p = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      p = e.parameter;
    }

    const handlers = {
      addPreco:         () => addPreco(p),
      addPrecos:        () => addPrecosBulk(p.itens, p.supermercado, p.data, p.fonte),
      getProdutos:      () => getProdutos(),
      searchProdutos:   () => searchProdutos(p.query),
      getHistorico:     () => getHistorico(p.produtoId, p.nomeProduto),
      getSupermercados: () => getSupermercados(),
      getRecentes:      () => getRecentes(p.limite),
      scanSefaz:        () => scanSefaz(p.url),
      ocrFoto:          () => ocrFoto(p.imageBase64, p.mimeType),
    };

    const handler = handlers[p.action];
    if (!handler) throw new Error('Ação desconhecida: ' + p.action);

    const result = handler();

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        error: true,
        mensagem: err.message,
        stack: err.stack
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// UTILITÁRIOS DO SHEETS
// ============================================================

function getSheet(nome) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(nome);
}

function getNextId(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 1;
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
    .flat().filter(v => v !== '' && v !== null && !isNaN(v));
  return ids.length === 0 ? 1 : Math.max(...ids) + 1;
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1)
    .filter(row => row[0] !== '' && row[0] !== null)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });
}

function hoje() {
  return Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
}

// ============================================================
// PRODUTOS
// ============================================================

function getProdutos() {
  return { produtos: sheetToObjects(getSheet('Produtos')) };
}

function searchProdutos(query) {
  if (!query || query.trim() === '') return getProdutos();
  const q = query.toLowerCase().trim();
  const todos = sheetToObjects(getSheet('Produtos'));
  return {
    produtos: todos.filter(p =>
      p.nome && p.nome.toString().toLowerCase().includes(q)
    )
  };
}

function encontrarOuCriarProduto(nome, categoria, unidade, codigoBarras) {
  const sheet = getSheet('Produtos');
  const data  = sheet.getDataRange().getValues();
  const nomeN = nome.toString().toLowerCase().trim();

  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    const cb     = data[i][4] ? data[i][4].toString().trim() : '';
    const nomeS  = data[i][1] ? data[i][1].toString().toLowerCase().trim() : '';
    if ((codigoBarras && cb === codigoBarras.toString().trim()) || nomeS === nomeN) {
      return data[i][0];
    }
  }

  const id = getNextId(sheet);
  sheet.appendRow([id, nome.trim(), categoria || '', unidade || 'un', codigoBarras || '', hoje()]);
  return id;
}

// ============================================================
// SUPERMERCADOS
// ============================================================

function getSupermercados() {
  return { supermercados: sheetToObjects(getSheet('Supermercados')) };
}

function encontrarOuCriarSupermercado(nome, cnpj) {
  const sheet = getSheet('Supermercados');
  const data  = sheet.getDataRange().getValues();
  const nomeN = nome.toString().toLowerCase().trim();

  for (let i = 1; i < data.length; i++) {
    if (!data[i][0]) continue;
    const cnpjS = data[i][2] ? data[i][2].toString().trim() : '';
    const nomeS = data[i][1] ? data[i][1].toString().toLowerCase().trim() : '';
    if ((cnpj && cnpjS === cnpj.toString().trim()) || nomeS === nomeN) return;
  }

  const id = getNextId(sheet);
  sheet.appendRow([id, nome.trim(), cnpj || '', '']);
}

// ============================================================
// PREÇOS
// ============================================================

function addPreco(p) {
  if (!p.nomeProduto) throw new Error('nomeProduto é obrigatório');
  if (!p.preco)       throw new Error('preco é obrigatório');
  if (!p.supermercado) throw new Error('supermercado é obrigatório');

  const produtoId = encontrarOuCriarProduto(
    p.nomeProduto, p.categoria, p.unidade, p.codigoBarras
  );

  encontrarOuCriarSupermercado(p.supermercado, p.cnpj);

  const sheet = getSheet('Precos');
  const id    = getNextId(sheet);
  const data  = p.data || hoje();

  sheet.appendRow([
    id,
    produtoId,
    p.nomeProduto.trim(),
    parseFloat(p.preco),
    p.supermercado.trim(),
    data,
    p.fonte || 'manual',
    parseFloat(p.quantidade) || 1,
    p.unidade || 'un'
  ]);

  return { success: true, id, produtoId };
}

function addPrecosBulk(itens, supermercadoDefault, dataDefault, fonteDefault) {
  if (!itens || !Array.isArray(itens)) throw new Error('itens deve ser um array');

  let sucesso = 0;
  const erros = [];

  for (const item of itens) {
    try {
      addPreco({
        nomeProduto:  item.nomeProduto,
        preco:        item.preco,
        supermercado: item.supermercado || supermercadoDefault || 'Supermercado',
        data:         item.data         || dataDefault         || hoje(),
        fonte:        item.fonte        || fonteDefault        || 'manual',
        quantidade:   item.quantidade   || 1,
        unidade:      item.unidade      || 'un',
        categoria:    item.categoria    || '',
        codigoBarras: item.codigoBarras || '',
        cnpj:         item.cnpj         || ''
      });
      sucesso++;
    } catch (err) {
      erros.push({ item: item.nomeProduto, erro: err.message });
    }
  }

  return { success: true, total: itens.length, sucesso, erros };
}

function getHistorico(produtoId, nomeProduto) {
  const sheet = getSheet('Precos');
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return { historico: [] };

  const headers = data[0];
  let rows = data.slice(1).filter(r => r[0] !== '');

  if (produtoId) {
    rows = rows.filter(r => r[1] == produtoId);
  } else if (nomeProduto) {
    const q = nomeProduto.toLowerCase();
    rows = rows.filter(r => r[2] && r[2].toString().toLowerCase().includes(q));
  }

  const historico = rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });

  historico.sort((a, b) => new Date(b.data) - new Date(a.data));
  return { historico };
}

function getRecentes(limite) {
  const sheet = getSheet('Precos');
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return { precos: [] };

  const lim     = parseInt(limite) || 30;
  const headers = data[0];

  const precos = data.slice(1)
    .filter(r => r[0] !== '')
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      return obj;
    });

  precos.sort((a, b) => {
    const da = a.data ? new Date(a.data) : new Date(0);
    const db = b.data ? new Date(b.data) : new Date(0);
    return db - da;
  });

  return { precos: precos.slice(0, lim) };
}

// ============================================================
// SEFAZ - Consulta Nota Fiscal Eletrônica
// ============================================================

function scanSefaz(url) {
  if (!url) return { error: true, mensagem: 'URL não fornecida' };

  try {
    const resp = UrlFetchApp.fetch(url, {
      followRedirects: true,
      muteHttpExceptions: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    const statusCode = resp.getResponseCode();
    if (statusCode !== 200) {
      return {
        error: true,
        mensagem: `Portal SEFAZ retornou erro ${statusCode}. Tente fotografar a nota fiscal.`
      };
    }

    const html = resp.getContentText('UTF-8');

    const prompt = `Você recebeu o HTML de uma Nota Fiscal ao Consumidor (NFC-e) brasileira.
Extraia os dados e retorne APENAS um JSON válido, sem markdown, sem explicações.

Formato esperado:
{
  "supermercado": "Nome do estabelecimento emitente",
  "cnpj": "XX.XXX.XXX/XXXX-XX",
  "data": "YYYY-MM-DD",
  "itens": [
    {
      "nomeProduto": "Descrição completa do produto",
      "quantidade": 1.0,
      "unidade": "UN",
      "preco": 10.50,
      "codigoBarras": "7891234567890"
    }
  ]
}

Regras:
- "preco" = preço UNITÁRIO (Vlr. Unit.), não o total
- "quantidade" = quantidade comprada
- "data" em formato YYYY-MM-DD
- Se não encontrar um campo, use "" ou 0
- Inclua TODOS os itens da nota

HTML da nota (até 25000 chars):
${html.substring(0, 25000)}`;

    const resultado = callGemini(prompt);

    if (resultado.error) return resultado;
    if (!resultado.itens || resultado.itens.length === 0) {
      return {
        error: true,
        mensagem: 'Não foi possível extrair itens da nota. Tente fotografar a nota fiscal.'
      };
    }

    return {
      success: true,
      supermercado: resultado.supermercado || '',
      cnpj: resultado.cnpj || '',
      data: resultado.data || hoje(),
      itens: resultado.itens,
      fonte: 'sefaz'
    };

  } catch (err) {
    return { error: true, mensagem: 'Erro ao consultar SEFAZ: ' + err.message };
  }
}

// ============================================================
// OCR DE FOTO COM GEMINI
// ============================================================

function ocrFoto(imageBase64, mimeType) {
  if (!imageBase64) return { error: true, mensagem: 'Imagem não fornecida' };

  const prompt = `Analise esta imagem de supermercado (pode ser gôndola, etiqueta de preço ou nota fiscal).
Identifique todos os produtos com seus preços.

Retorne APENAS um JSON válido, sem markdown, sem explicações:
{
  "supermercado": "Nome do supermercado se visível, senão string vazia",
  "itens": [
    {
      "nomeProduto": "Nome completo do produto (marca + descrição)",
      "quantidade": 1.0,
      "unidade": "UN",
      "preco": 10.50,
      "codigoBarras": ""
    }
  ]
}

Regras:
- Inclua apenas produtos com preço visível
- "preco" deve ser numérico (ex: 10.50, não "R$ 10,50")
- Para gôndola: foque nas etiquetas de preço
- Para nota fiscal: extraia todos os itens`;

  const resultado = callGemini(prompt, imageBase64, mimeType || 'image/jpeg');

  if (resultado.error) return resultado;
  if (!resultado.itens || resultado.itens.length === 0) {
    return {
      error: true,
      mensagem: 'Não foi possível identificar produtos. Tente novamente com foto mais clara e bem iluminada.'
    };
  }

  return {
    success: true,
    supermercado: resultado.supermercado || '',
    itens: resultado.itens,
    fonte: 'foto'
  };
}

// ============================================================
// GEMINI API
// ============================================================

function callGemini(prompt, imageBase64, mimeType) {
  const config = getConfig();
  const apiKey = config.geminiApiKey;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'SUA_CHAVE_AQUI') {
    throw new Error('Chave da API Gemini não configurada. Adicione na aba "Config" da planilha (linha: geminiApiKey | sua-chave).');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const parts = [];
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } });
  }
  parts.push({ text: prompt });

  const payload = {
    contents: [{ parts }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const raw    = response.getContentText('UTF-8');
  const result = JSON.parse(raw);

  if (result.error) throw new Error('Gemini API: ' + result.error.message);
  if (!result.candidates || !result.candidates[0]) throw new Error('Gemini não retornou candidatos.');

  const text = result.candidates[0].content.parts[0].text;

  try {
    const cleaned = text
      .replace(/^```(?:json)?\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return { parseError: e.message, raw: text };
  }
}

// ============================================================
// CONFIG
// ============================================================

function getConfig() {
  const sheet = getSheet('Config');
  if (!sheet) return {};
  const config = {};
  sheet.getDataRange().getValues().forEach(row => {
    if (row[0]) config[row[0].toString()] = row[1] ? row[1].toString() : '';
  });
  return config;
}
