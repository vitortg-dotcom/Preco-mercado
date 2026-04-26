// Manual add + product detail + lista + settings
const { useState: useS, useEffect: useE, useMemo: useM } = React;

// ============ Manual add form ============
function ManualAdd({ onDone, onCancel }) {
  const [form, setForm] = useS({
    nome: '', preco: '', supermercado: '', data: new Date().toISOString().slice(0,10),
    categoria: 'Mercearia', unidade: 'un', quantidade: 1, codigoBarras: '',
  });
  const [markets, setMarkets] = useS([]);
  const [produtosExist, setProdutosExist] = useS([]);
  const [sug, setSug] = useS([]);

  useE(() => {
    window.API.call('list_supermercados').then(setMarkets);
    window.API.call('list_produtos').then(setProdutosExist);
  }, []);

  useE(() => {
    if (!form.nome || form.nome.length < 2) { setSug([]); return; }
    const q = form.nome.toLowerCase();
    setSug(produtosExist.filter(p => p.nome.toLowerCase().includes(q)).slice(0, 4));
  }, [form.nome, produtosExist]);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const pick = (p) => setForm(f => ({ ...f, nome: p.nome, categoria: p.categoria, unidade: p.unidade, codigoBarras: p.codigoBarras || '' }));

  const save = async () => {
    await window.API.call('add_preco', {
      nomeProduto: form.nome,
      preco: parseFloat(String(form.preco).replace(',', '.')),
      supermercado: form.supermercado,
      data: form.data,
      fonte: 'manual',
      quantidade: form.quantidade,
      unidade: form.unidade,
    });
    onDone({ count: 1, market: form.supermercado });
  };

  const valid = form.nome && form.preco && form.supermercado;

  return (
    <div className="screen-container">
      <div className="topbar">
        <button className="icon-btn" onClick={onCancel}><Icon name="back" size={18}/></button>
        <div className="brand" style={{ fontSize: 15 }}>Adicionar manualmente</div>
        <div style={{width:38}}/>
      </div>
      <div className="screen">
        <div className="field">
          <label>Produto</label>
          <input placeholder="Ex: Leite Integral Italac 1L" value={form.nome}
            onChange={e => set('nome', e.target.value)} />
          {sug.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {sug.map(s => (
                <div key={s.id} onClick={() => pick(s)}
                     style={{ padding: '8px 10px', fontSize: 13, background: 'var(--surface)',
                              borderRadius: 8, marginBottom: 4, cursor: 'pointer',
                              border: '1px solid var(--border)' }}>
                  <strong>{s.nome}</strong>
                  <span className="muted small"> · {s.categoria} · {s.unidade}</span>
                </div>
              ))}
              <div className="hint">Toque para reutilizar um produto existente</div>
            </div>
          )}
        </div>

        <div className="flex g-8">
          <div className="field" style={{ flex: 2 }}>
            <label>Preço (R$)</label>
            <input type="text" inputMode="decimal" placeholder="0,00"
              value={form.preco} onChange={e => set('preco', e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Quantidade</label>
            <input type="number" value={form.quantidade}
              onChange={e => set('quantidade', Number(e.target.value))} />
          </div>
        </div>

        <div className="field">
          <label>Supermercado</label>
          <select value={form.supermercado} onChange={e => set('supermercado', e.target.value)}>
            <option value="">Selecione...</option>
            {markets.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
            <option value="__outro__">+ Outro...</option>
          </select>
        </div>

        <div className="flex g-8">
          <div className="field" style={{ flex: 1 }}>
            <label>Data</label>
            <input type="date" value={form.data} onChange={e => set('data', e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Unidade</label>
            <select value={form.unidade} onChange={e => set('unidade', e.target.value)}>
              <option value="un">un</option>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="L">L</option>
              <option value="ml">ml</option>
              <option value="dz">dúzia</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Categoria</label>
          <select value={form.categoria} onChange={e => set('categoria', e.target.value)}>
            <option>Mercearia</option>
            <option>Laticínios</option>
            <option>Hortifruti</option>
            <option>Padaria</option>
            <option>Bebidas</option>
            <option>Limpeza</option>
            <option>Higiene</option>
            <option>Frios</option>
            <option>Congelados</option>
            <option>Outros</option>
          </select>
        </div>

        <div className="field">
          <label>Código de barras (opcional)</label>
          <input placeholder="0000000000000" value={form.codigoBarras}
            onChange={e => set('codigoBarras', e.target.value)} />
        </div>

        <button className="btn primary block lg" onClick={save} disabled={!valid}>
          <Icon name="check" size={18}/> Salvar
        </button>
      </div>
    </div>
  );
}

// ============ Product detail ============
function ProductDetail({ produtoId, onBack }) {
  const [produto, setProduto] = useS(null);
  const [precos, setPrecos] = useS([]);
  const [tab, setTab] = useS('chart'); // chart | markets | list

  useE(() => {
    Promise.all([
      window.API.call('list_produtos'),
      window.API.call('list_precos'),
    ]).then(([prods, prs]) => {
      setProduto(prods.find(p => p.id === produtoId));
      setPrecos(prs.filter(p => p.produtoId === produtoId));
    });
  }, [produtoId]);

  if (!produto) return <div className="screen"><div className="empty">Carregando...</div></div>;

  const sortedByDate = [...precos].sort((a,b) => a.data.localeCompare(b.data));
  const sortedByPrice = [...precos].sort((a,b) => a.preco - b.preco);
  const min = sortedByPrice[0];
  const max = sortedByPrice[sortedByPrice.length - 1];
  const avg = precos.length ? precos.reduce((a,p) => a+p.preco, 0) / precos.length : 0;
  const last = sortedByDate[sortedByDate.length - 1];
  const prev = sortedByDate[sortedByDate.length - 2];
  const trend = (last && prev) ? ((last.preco - prev.preco) / prev.preco) * 100 : 0;

  // group by market for best/worst bars
  const byMarket = {};
  precos.forEach(p => {
    if (!byMarket[p.supermercado]) byMarket[p.supermercado] = [];
    byMarket[p.supermercado].push(p);
  });
  const marketSummary = Object.entries(byMarket).map(([nome, arr]) => {
    const recent = [...arr].sort((a,b) => b.data.localeCompare(a.data))[0];
    return { nome, preco: recent.preco, data: recent.data, n: arr.length };
  }).sort((a,b) => a.preco - b.preco);

  const cheapest = marketSummary[0]?.preco || 0;
  const dearest = marketSummary[marketSummary.length-1]?.preco || 1;

  return (
    <div className="screen-container">
      <div className="topbar">
        <button className="icon-btn" onClick={onBack}><Icon name="back" size={18}/></button>
        <button className="icon-btn" onClick={() => window.__addToLista(produto.id)}><Icon name="plus" size={18}/></button>
      </div>
      <div className="hero">
        <h1>{produto.nome}</h1>
        <div className="meta">
          <span className="pill primary">{produto.categoria}</span>
          <span className="pill">{produto.unidade}</span>
          {produto.codigoBarras && <span className="pill"><Icon name="barcode" size={11} style={{verticalAlign:-1}}/> {produto.codigoBarras}</span>}
        </div>
      </div>

      <div className="screen" style={{ paddingTop: 12 }}>
        <div className="kpi-row">
          <div className="kpi">
            <div className="label">mais barato</div>
            <div className="val" style={{ color: 'var(--primary)' }}>{min ? fmt.brl(min.preco) : '—'}</div>
            <div className="sub">{min ? fmt.shortMarket(min.supermercado) : ''}</div>
          </div>
          <div className="kpi">
            <div className="label">média</div>
            <div className="val">{fmt.brl(avg)}</div>
            <div className="sub">{precos.length} registros</div>
          </div>
          <div className="kpi">
            <div className="label">tendência</div>
            <div className="val" style={{ color: trend > 1 ? 'var(--accent)' : trend < -1 ? 'var(--primary)' : 'var(--fg)' }}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </div>
            <div className="sub">vs anterior</div>
          </div>
        </div>

        <div className="tabs">
          <button className={tab==='chart'?'active':''} onClick={()=>setTab('chart')}>Gráfico</button>
          <button className={tab==='markets'?'active':''} onClick={()=>setTab('markets')}>Mercados</button>
          <button className={tab==='list'?'active':''} onClick={()=>setTab('list')}>Histórico</button>
        </div>

        {tab === 'chart' && <PriceChart data={sortedByDate} />}

        {tab === 'markets' && (
          <div className="card">
            {marketSummary.map((m, i) => {
              const rank = i === 0 ? 'best' : i === marketSummary.length-1 ? 'worst' : 'mid';
              const pct = dearest === cheapest ? 100 : ((m.preco - cheapest) / (dearest - cheapest)) * 80 + 20;
              return (
                <div key={m.nome} className={`bar-row ${rank}`}>
                  <div>
                    <div className="bar-name">{m.nome}</div>
                    <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontWeight: 600, fontSize: 14 }}>{fmt.brl(m.preco)}</div>
                    <div className="muted" style={{ fontSize: 10.5 }}>{fmt.relDays(m.data)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'list' && (
          <div className="card">
            {sortedByDate.slice().reverse().map(p => (
              <div key={p.id} className="hrow">
                <div>
                  <div className="hname">{p.supermercado}</div>
                  <div className="hsub">
                    <span>{fmt.dateLong(p.data)}</span>
                    <span>·</span>
                    <span className="pill" style={{ fontSize: 10 }}>{p.fonte}</span>
                  </div>
                </div>
                <div className={`hprice ${p.id === min?.id ? 'best' : ''}`}>{fmt.brl(p.preco)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============ Price chart ============
function PriceChart({ data }) {
  if (data.length < 2) {
    return <div className="empty" style={{ padding: 30 }}>Poucos dados para o gráfico.</div>;
  }
  const W = 300, H = 140, pad = 18;
  const prices = data.map(d => d.preco);
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const toX = (i) => pad + (i / (data.length - 1)) * (W - pad*2);
  const toY = (p) => H - pad - ((p - min) / range) * (H - pad*2);
  const pts = data.map((d, i) => [toX(i), toY(d.preco)]);
  const path = pts.map((p, i) => `${i===0?'M':'L'}${p[0]},${p[1]}`).join(' ');
  const area = `${path} L ${pts[pts.length-1][0]},${H-pad} L ${pts[0][0]},${H-pad} Z`;

  return (
    <div className="chart">
      <div className="flex between mb-8 small muted">
        <span>min <span className="mono" style={{color:'var(--primary)'}}>{fmt.brl(min)}</span></span>
        <span>max <span className="mono" style={{color:'var(--accent)'}}>{fmt.brl(max)}</span></span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="var(--primary)" stopOpacity="0.22"/>
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#gg)"/>
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
        {pts.map(([x,y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="var(--surface)" stroke="var(--primary)" strokeWidth="1.5"/>
        ))}
      </svg>
      <div className="flex between small muted mt-8">
        <span>{fmt.date(data[0].data)}</span>
        <span>{fmt.date(data[data.length-1].data)}</span>
      </div>
    </div>
  );
}

// ============ Lista full screen ============
function ListaScreen({ onBack }) {
  const [lista, setLista] = useS([]);
  const [produtos, setProdutos] = useS([]);
  const [precos, setPrecos] = useS([]);
  const [showPicker, setShowPicker] = useS(false);

  const reload = () => Promise.all([
    window.API.call('list_lista'),
    window.API.call('list_produtos'),
    window.API.call('list_precos'),
  ]).then(([l,p,pr]) => { setLista(l); setProdutos(p); setPrecos(pr); });
  useE(() => { reload(); }, []);

  const byProd = useM(() => summarizePrices(precos), [precos]);

  const toggle = async (id) => {
    setLista(s => s.map(x => x.id === id ? { ...x, comprado: !x.comprado } : x));
    await window.API.call('toggle_lista_item', { id });
  };
  const remove = async (id) => {
    setLista(s => s.filter(x => x.id !== id));
    await window.API.call('remove_lista_item', { id });
  };
  const add = async (prod) => {
    const res = await window.API.call('add_lista_item', { produtoId: prod.id, quantidade: 1 });
    setLista(s => [...s, res]);
    setShowPicker(false);
  };

  const itens = lista.map(l => {
    const prod = produtos.find(p => p.id === l.produtoId);
    const sum = byProd.get(l.produtoId);
    return { ...l, prod, sum };
  });
  const pendentes = itens.filter(i => !i.comprado);
  const totalEstimado = pendentes.filter(i => i.sum).reduce((a,i) => a + i.sum.min.preco * (i.quantidade||1), 0);

  // Agrupa por "melhor mercado"
  const byBestMarket = {};
  pendentes.forEach(i => {
    const k = i.sum?.min.supermercado || '— sem histórico —';
    (byBestMarket[k] = byBestMarket[k] || []).push(i);
  });

  return (
    <div className="screen-container">
      <div className="topbar">
        <button className="icon-btn" onClick={onBack}><Icon name="back" size={18}/></button>
        <div className="brand" style={{ fontSize: 15 }}>Lista de compras</div>
        <button className="icon-btn" onClick={() => setShowPicker(true)}><Icon name="plus" size={18}/></button>
      </div>

      <div className="screen">
        <div className="kpi-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="kpi">
            <div className="label">pendentes</div>
            <div className="val">{pendentes.length}</div>
            <div className="sub">de {itens.length} itens</div>
          </div>
          <div className="kpi">
            <div className="label">estimativa</div>
            <div className="val">{fmt.brl(totalEstimado)}</div>
            <div className="sub">no melhor preço</div>
          </div>
        </div>

        {Object.entries(byBestMarket).map(([market, arr]) => {
          const subtotal = arr.filter(i => i.sum).reduce((a,i) => a + i.sum.min.preco * (i.quantidade||1), 0);
          return (
            <div key={market} style={{ marginTop: 14 }}>
              <div className="section-hd">
                <h2><Icon name="store" size={12} style={{verticalAlign: -1}}/> {market}</h2>
                <span className="mono small muted">{fmt.brl(subtotal)}</span>
              </div>
              {arr.map(i => (
                <div key={i.id} className="row">
                  <div className={`check ${i.comprado ? 'on' : ''}`} onClick={() => toggle(i.id)}>
                    {i.comprado && <Icon name="check" size={14}/>}
                  </div>
                  <div className="row-main" onClick={() => i.prod && window.__goto('produto', i.prod.id)}>
                    <div className="row-title">{i.prod?.nome}</div>
                    <div className="row-sub">
                      {i.quantidade > 1 && <span className="pill">{i.quantidade}x</span>}
                      {i.sum && <span>{fmt.brl(i.sum.min.preco)}</span>}
                    </div>
                  </div>
                  <button className="icon-btn" onClick={() => remove(i.id)}><Icon name="trash" size={15}/></button>
                </div>
              ))}
            </div>
          );
        })}

        {itens.filter(i => i.comprado).length > 0 && (
          <div style={{ marginTop: 18, opacity: 0.55 }}>
            <div className="section-hd"><h2>Comprados</h2></div>
            {itens.filter(i => i.comprado).map(i => (
              <div key={i.id} className="row checked">
                <div className="check on" onClick={() => toggle(i.id)}><Icon name="check" size={14}/></div>
                <div className="row-main"><div className="row-title">{i.prod?.nome}</div></div>
                <button className="icon-btn" onClick={() => remove(i.id)}><Icon name="trash" size={15}/></button>
              </div>
            ))}
          </div>
        )}

        {itens.length === 0 && (
          <div className="empty" style={{ padding: 40 }}>
            <div className="emoji">🛒</div>
            Sua lista está vazia.<br/>
            <button className="btn primary mt-12" onClick={() => setShowPicker(true)}>
              <Icon name="plus" size={16}/> Adicionar produto
            </button>
          </div>
        )}
      </div>

      {showPicker && (
        <ProductPicker
          produtos={produtos.filter(p => !lista.some(l => l.produtoId === p.id))}
          byProd={byProd}
          onPick={add}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}

function ProductPicker({ produtos, byProd, onPick, onClose }) {
  const [q, setQ] = useS('');
  const filt = q ? produtos.filter(p => p.nome.toLowerCase().includes(q.toLowerCase())) : produtos;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-grab"/>
        <div className="sheet-head">
          <h3>Adicionar à lista</h3>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18}/></button>
        </div>
        <div className="sheet-body">
          <div className="search" style={{ marginTop: 0 }}>
            <Icon name="search" size={16}/>
            <input placeholder="Buscar produto..." autoFocus value={q} onChange={e => setQ(e.target.value)}/>
          </div>
          {filt.slice(0, 30).map(p => {
            const sum = byProd.get(p.id);
            return (
              <div key={p.id} className="row" onClick={() => onPick(p)}>
                <div className="row-main">
                  <div className="row-title">{p.nome}</div>
                  <div className="row-sub">
                    <span className="pill">{p.categoria}</span>
                    {sum && <span>min {fmt.brl(sum.min.preco)}</span>}
                  </div>
                </div>
                <Icon name="plus" size={16}/>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ Settings ============
function Settings({ onBack }) {
  const [url, setUrl]     = useS(window.API.getUrl());
  const [token, setToken] = useS(window.API.getToken());
  const [saved, setSaved] = useS(false);
  const save = () => {
    window.API.setUrl(url);
    window.API.setToken(token);
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };
  return (
    <div className="screen-container">
      <div className="topbar">
        <button className="icon-btn" onClick={onBack}><Icon name="back" size={18}/></button>
        <div className="brand" style={{ fontSize: 15 }}>Configurações</div>
        <div style={{width:38}}/>
      </div>
      <div className="screen">
        <div className="card mb-12">
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Conexão com Google Sheets</div>
          <div className="small muted mb-12">
            Cole a URL do Web App do seu Google Apps Script. Enquanto vazio, o app usa dados de exemplo.
          </div>
          <div className="field">
            <label>URL do Web App</label>
            <input
              placeholder="https://script.google.com/macros/s/..."
              value={url} onChange={e => setUrl(e.target.value)}
            />
            <div className="hint">
              Publique como Web App com acesso "Qualquer pessoa" e cole a URL aqui.
            </div>
          </div>
          <div className="field" style={{ marginTop: 12 }}>
            <label>Token de acesso (opcional)</label>
            <input
              type="password"
              placeholder="Deixe em branco se não configurou token"
              value={token} onChange={e => setToken(e.target.value)}
            />
            <div className="hint">
              Valor da chave <code>apiToken</code> na aba Config da planilha.
            </div>
          </div>
          <button className="btn primary block" onClick={save} style={{ marginTop: 12 }}>
            <Icon name="check" size={16}/> {saved ? 'Salvo!' : 'Salvar'}
          </button>
        </div>

        <div className="card mb-12">
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Status</div>
          <div className="flex between" style={{ fontSize: 13, marginBottom: 6 }}>
            <span>Modo</span>
            <span className={`pill ${url ? 'primary' : 'accent'}`}>
              {url ? 'Conectado' : 'Dados de exemplo'}
            </span>
          </div>
          <div className="flex between" style={{ fontSize: 13 }}>
            <span>Autenticação</span>
            <span className={`pill ${token ? 'primary' : 'accent'}`}>
              {token ? 'Com token' : 'Sem token'}
            </span>
          </div>
        </div>

        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 10 }}>Estrutura esperada da planilha</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', fontFamily: 'var(--f-mono)', lineHeight: 1.6 }}>
            <div><strong>Produtos:</strong> id | nome | categoria | unidade | codigoBarras | criadoEm</div>
            <div><strong>Precos:</strong> id | produtoId | nomeProduto | preco | supermercado | data | fonte | quantidade | unidade</div>
            <div><strong>Supermercados:</strong> id | nome | cnpj | endereco</div>
            <div><strong>Lista:</strong> id | produtoId | comprado | quantidade</div>
            <div><strong>Config:</strong> chave | valor</div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ManualAdd, ProductDetail, ListaScreen, Settings });
