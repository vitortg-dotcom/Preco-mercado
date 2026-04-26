// API layer — calls Apps Script if URL configured, otherwise uses mock data.
// O Apps Script expõe doGet/doPost com actions via ?action=xxx
// Token opcional: configurado em Settings, enviado no body de cada chamada.

window.API = (() => {
  const getUrl   = () => localStorage.getItem('appscript_url')   || '';
  const setUrl   = (u) => localStorage.setItem('appscript_url',  u || '');
  const getToken = () => localStorage.getItem('appscript_token') || '';
  const setToken = (t) => localStorage.setItem('appscript_token', t || '');
  const isConfigured = () => !!getUrl();

  const simulate = (data, ms = 400) => new Promise(r => setTimeout(() => r(data), ms));

  async function call(action, payload = {}) {
    const url = getUrl();
    if (!url) {
      return handleMock(action, payload);
    }
    // Inclui token no body se configurado
    const token = getToken();
    const body  = token ? { token, ...payload } : { ...payload };
    try {
      const resp = await fetch(url + '?action=' + encodeURIComponent(action), {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      if (data && data.error) throw new Error(data.mensagem || 'Erro no servidor');
      return data;
    } catch (err) {
      console.warn('API call failed, falling back to mock:', err);
      return handleMock(action, payload);
    }
  }

  // -------- Mock implementations --------
  const state = {
    produtos:      [...window.MOCK_PRODUTOS],
    precos:        [...window.MOCK_PRECOS],
    supermercados: [...window.MOCK_SUPERMERCADOS],
    lista:         [...window.MOCK_LISTA_COMPRAS],
  };

  function handleMock(action, payload) {
    switch (action) {
      case 'list_produtos':      return simulate(state.produtos);
      case 'list_precos':        return simulate(state.precos);
      case 'list_supermercados': return simulate(state.supermercados);
      case 'list_lista':         return simulate(state.lista);

      case 'add_preco': {
        const id  = 'pr' + (state.precos.length + 1);
        const rec = { id, ...payload };
        state.precos.unshift(rec);
        return simulate(rec);
      }
      case 'add_produto': {
        const id  = 'p' + (state.produtos.length + 1);
        const rec = { id, criadoEm: new Date().toISOString().slice(0, 10), ...payload };
        state.produtos.push(rec);
        return simulate(rec);
      }
      case 'add_lista_item': {
        const id  = 'l' + (state.lista.length + 1);
        const rec = { id, comprado: false, ...payload };
        state.lista.push(rec);
        return simulate(rec);
      }
      case 'toggle_lista_item': {
        const it = state.lista.find(x => x.id === payload.id);
        if (it) it.comprado = !it.comprado;
        return simulate(it);
      }
      case 'remove_lista_item': {
        state.lista = state.lista.filter(x => x.id !== payload.id);
        return simulate(true);
      }
      case 'scan_nfe': {
        return simulate({
          supermercado: 'Carrefour Paulista',
          cnpj: '45.543.915/0001-81',
          data: new Date().toISOString().slice(0, 10),
          numeroNota: '000.123.456',
          itens: [
            { nome: 'Leite Integral Italac 1L',     preco: 4.89,  quantidade: 2,     unidade: 'un', codigoBarras: '7898080640017' },
            { nome: 'Pão de Forma Wickbold 500g',   preco: 8.49,  quantidade: 1,     unidade: 'un', codigoBarras: '7896066300016' },
            { nome: 'Café Pilão 500g',              preco: 16.49, quantidade: 1,     unidade: 'un', codigoBarras: '7896089010015' },
            { nome: 'Banana Nanica',                preco: 5.49,  quantidade: 1.250, unidade: 'kg', codigoBarras: '' },
            { nome: 'Tomate Italiano',              preco: 6.99,  quantidade: 0.680, unidade: 'kg', codigoBarras: '' },
            { nome: 'Detergente Ypê Neutro 500ml',  preco: 2.49,  quantidade: 3,     unidade: 'un', codigoBarras: '7896098900116' },
            { nome: 'Iogurte Natural Danone 170g',  preco: 2.99,  quantidade: 4,     unidade: 'un', codigoBarras: '7891025114116' },
          ],
          total: 62.12,
        }, 1200);
      }
      case 'ocr_gondola': {
        return simulate({
          produtos: [
            { nome: 'Arroz Tio João Tipo 1 5kg', preco: 29.90, confianca: 0.94, unidade: '5kg', codigoBarras: '7893500020011' },
            { nome: 'Arroz Camil 5kg',           preco: 27.49, confianca: 0.88, unidade: '5kg', codigoBarras: '' },
            { nome: 'Arroz Prato Fino 5kg',      preco: 31.90, confianca: 0.81, unidade: '5kg', codigoBarras: '' },
          ]
        }, 1500);
      }
      default:
        return simulate({ error: 'unknown action: ' + action });
    }
  }

  return { call, getUrl, setUrl, getToken, setToken, isConfigured };
})();
