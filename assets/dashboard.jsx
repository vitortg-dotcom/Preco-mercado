// Dashboard — 3 variações, selecionáveis via Tweaks
// V1: Lista dos últimos itens + atalhos
// V2: Maior variação entre mercados em destaque
// V3: Dashboard com estatísticas do mês

const { useState, useMemo, useEffect } = React;

function useData() {
  const [produtos, setProdutos] = useState([]);
  const [precos, setPrecos] = useState([]);
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const [p, pr, l] = await Promise.all([
      window.API.call('list_produtos'),
      window.API.call('list_precos'),
      window.API.call('list_lista'),
    ]);
    setProdutos(p); setPrecos(pr); setLista(l);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);
  return { produtos, precos, lista, loading, reload, setLista };
}

// summary per product
function summarizePrices(precos) {
  const byProd = new Map();
  precos.forEach(p => {
    if (!byProd.has(p.produtoId)) byProd.set(p.produtoId, []);
    byProd.get(p.produtoId).push(p);
  });
  const out = new Map();
  byProd.forEach((arr, pid) => {
    const sorted = [...arr].sort((a,b) => a.preco - b.preco);
    const min = sorted[0], max = sorted[sorted.length-1];
    const byDate = [...arr].sort((a,b) => (a.data > b.data ? 1 : -1));
    const last = byDate[byDate.length - 1];
    const variacaoPct = min.preco > 0 ? ((max.preco - min.preco) / min.preco) * 100 : 0;
    out.set(pid, { min, max, last, variacaoPct, n: arr.length, sortedByDate: byDate });
  });
  return out;
}

function DashHeader({ onOpenSearch, query, setQuery }) {
  return (
    <>
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">MP</div>
          <div>Meus Preços</div>
        </div>
        <button className="icon-btn" onClick={() => window.__goto('settings')} aria-label="Configurações">
          <Icon name="settings" size={18} />
        </button>
      </div>
      <div className="screen" style={{ paddingBottom: 110 }}>
        <div className="search" onClick={onOpenSearch}>
          <Icon name="search" size={18} />
          <input
            placeholder="Buscar produto ou mercado..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {/* rest of dashboard rendered by consumer */}
      </div>
    </>
  );
}

// ============ Dashboard (main) ============
function Dashboard({ variant = 'v1' }) {
  const data = useData();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const byProd = useMemo(() => summarizePrices(data.precos), [data.precos]);

  const filtered = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return data.produtos
      .filter(p => p.nome.toLowerCase().includes(q) || (p.categoria||'').toLowerCase().includes(q) || (p.codigoBarras||'').includes(q))
      .slice(0, 12);
  }, [query, data.produtos]);

  return (
    <div className="screen-container">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">M$</div>
          <div>Meus Preços</div>
        </div>
        <button className="icon-btn" onClick={() => window.__goto('settings')} aria-label="Configurações">
          <Icon name="settings" size={18} />
        </button>
      </div>

      <div className="screen">
        {/* Search */}
        <div className="search">
          <Icon name="search" size={18} />
          <input
            placeholder="Buscar produto, mercado, código..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
          {query && (
            <button className="icon-btn" onClick={() => setQuery('')} style={{width: 28, height: 28}}>
              <Icon name="x" size={16} />
            </button>
          )}
        </div>

        {/* Search results */}
        {query.trim() ? (
          <SearchResults results={filtered} byProd={byProd} />
        ) : (
          <>
            {/* Quick actions */}
            <QuickActions />

            {/* Variant content */}
            {variant === 'v1' && <VariantRecent precos={data.precos} produtos={data.produtos} lista={data.lista} setLista={data.setLista} byProd={byProd} />}
            {variant === 'v2' && <VariantDeals produtos={data.produtos} byProd={byProd} lista={data.lista} setLista={data.setLista} />}
            {variant === 'v3' && <VariantStats precos={data.precos} produtos={data.produtos} byProd={byProd} lista={data.lista} setLista={data.setLista} />}
          </>
        )}
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="quick">
      <button className="primary-action" onClick={() => window.__goto('scan_qr')}>
        <div className="ico"><Icon name="qr" size={22} /></div>
        <div className="label">Nota fiscal</div>
        <div className="sub">Escanear QR</div>
      </button>
      <button className="accent" onClick={() => window.__goto('scan_photo')}>
        <div className="ico"><Icon name="camera" size={22} /></div>
        <div className="label">Gôndola</div>
        <div className="sub">Foto</div>
      </button>
      <button className="neutral" onClick={() => window.__goto('manual')}>
        <div className="ico"><Icon name="plus" size={22} /></div>
        <div className="label">Manual</div>
        <div className="sub">Digitar</div>
      </button>
    </div>
  );
}

// --- V1: Itens recentes ---
function VariantRecent({ precos, produtos, lista, setLista, byProd }) {
  return (
    <>
      <ListaCompras lista={lista} produtos={produtos} byProd={byProd} setLista={setLista} />
    </>
  );
}

// --- V2: Maiores diferenças de preço ---
function VariantDeals({ produtos, byProd, lista, setLista }) {
  const deals = useMemo(() => {
    return produtos
      .map(p => ({ produto: p, summary: byProd.get(p.id) }))
      .filter(x => x.summary && x.summary.n >= 2)
      .sort((a, b) => b.summary.variacaoPct - a.summary.variacaoPct)
      .slice(0, 6);
  }, [produtos, byProd]);

  return (
    <>
      <ListaCompras lista={lista} produtos={produtos} byProd={byProd} setLista={setLista} />

      <div className="section-hd">
        <h2>Maior economia</h2>
        <span className="small muted">em R$</span>
      </div>

      {deals.map(({ produto, summary }) => {
        const economia = summary.max.preco - summary.min.preco;
        return (
          <div key={produto.id} className="card" style={{ marginBottom: 10 }} onClick={() => window.__goto('produto', produto.id)}>
            <div className="flex between center">
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14.5 }}>{produto.nome}</div>
                <div className="row-sub" style={{ marginTop: 4 }}>
                  <span className="pill">{produto.categoria}</span>
                  <span className="muted">{produto.unidade}</span>
                </div>
              </div>
              <span className="price-tag best">−{fmt.brl(economia)}</span>
            </div>
            <div className="flex between" style={{ marginTop: 10, fontSize: 12.5 }}>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>mais barato</div>
                <div className="mono" style={{ fontWeight: 600 }}>{fmt.brl(summary.min.preco)}</div>
                <div className="muted" style={{ fontSize: 11 }}>{fmt.shortMarket(summary.min.supermercado)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="muted" style={{ fontSize: 11 }}>mais caro</div>
                <div className="mono" style={{ fontWeight: 600, color: 'var(--accent)' }}>{fmt.brl(summary.max.preco)}</div>
                <div className="muted" style={{ fontSize: 11 }}>{fmt.shortMarket(summary.max.supermercado)}</div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// --- V3: Estatísticas ---
function VariantStats({ precos, produtos, byProd, lista, setLista }) {
  const stats = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    const mes = precos.filter(p => p.data.startsWith(thisMonth));
    const gasto = mes.reduce((a, p) => a + p.preco * (p.quantidade || 1), 0);

    const bymarket = {};
    precos.forEach(p => {
      bymarket[p.supermercado] = bymarket[p.supermercado] || { total: 0, n: 0 };
      bymarket[p.supermercado].total += p.preco;
      bymarket[p.supermercado].n += 1;
    });
    // best market: aggregate "is lowest" wins
    const wins = {};
    byProd.forEach(sum => {
      wins[sum.min.supermercado] = (wins[sum.min.supermercado] || 0) + 1;
    });
    const bestMarket = Object.entries(wins).sort((a,b) => b[1]-a[1])[0];

    return {
      gastoMes: gasto,
      itensMes: mes.length,
      bestMarket: bestMarket ? { nome: bestMarket[0], wins: bestMarket[1] } : null,
      totalProdutos: produtos.length,
    };
  }, [precos, produtos, byProd]);

  return (
    <>
      <div className="kpi-row">
        <div className="kpi">
          <div className="label">gasto no mês</div>
          <div className="val">{fmt.brl(stats.gastoMes)}</div>
          <div className="sub">{stats.itensMes} itens</div>
        </div>
        <div className="kpi">
          <div className="label">produtos</div>
          <div className="val">{stats.totalProdutos}</div>
          <div className="sub">monitorados</div>
        </div>
        <div className="kpi">
          <div className="label">melhor</div>
          <div className="val" style={{ fontSize: 13, lineHeight: 1.2 }}>{stats.bestMarket ? fmt.shortMarket(stats.bestMarket.nome) : '—'}</div>
          <div className="sub">{stats.bestMarket ? `${stats.bestMarket.wins} vitórias` : ''}</div>
        </div>
      </div>

      <ListaCompras lista={lista} produtos={produtos} byProd={byProd} setLista={setLista} compact />
    </>
  );
}

// --- Lista de compras ---
function ListaCompras({ lista, produtos, byProd, setLista, compact }) {
  const items = useMemo(() => {
    return lista.map(l => {
      const prod = produtos.find(p => p.id === l.produtoId);
      const sum = byProd.get(l.produtoId);
      return { ...l, prod, sum };
    });
  }, [lista, produtos, byProd]);

  const pendentes = items.filter(i => !i.comprado).length;
  const totalEstimado = items
    .filter(i => !i.comprado && i.sum)
    .reduce((a, i) => a + (i.sum.min.preco * (i.quantidade || 1)), 0);

  const toggle = async (id) => {
    setLista(prev => prev.map(x => x.id === id ? { ...x, comprado: !x.comprado } : x));
    window.API.call('toggle_lista_item', { id });
  };

  if (items.length === 0) {
    return (
      <>
        <div className="section-hd">
          <h2>Lista de compras</h2>
          <a className="link" onClick={() => window.__goto('lista')}>+ Adicionar</a>
        </div>
        <div className="empty" style={{ padding: 24 }}>
          Sua lista está vazia. Toque em <strong>+ Adicionar</strong> para começar.
        </div>
      </>
    );
  }

  const shown = compact ? items.slice(0, 3) : items.slice(0, 5);

  return (
    <>
      <div className="section-hd">
        <h2>Lista de compras</h2>
        <a className="link" onClick={() => window.__goto('lista')}>
          {pendentes} pendentes · {fmt.brl(totalEstimado)}
        </a>
      </div>

      {shown.map(item => (
        <div key={item.id} className={`row ${item.comprado ? 'checked' : ''}`}>
          <div className={`check ${item.comprado ? 'on' : ''}`} onClick={() => toggle(item.id)}>
            {item.comprado && <Icon name="check" size={14} />}
          </div>
          <div className="row-main" onClick={() => item.prod && window.__goto('produto', item.prod.id)}>
            <div className="row-title">{item.prod?.nome || 'produto removido'}</div>
            <div className="row-sub">
              {item.quantidade > 1 && <span className="pill">{item.quantidade}x</span>}
              {item.sum ? (
                <span>melhor: {fmt.shortMarket(item.sum.min.supermercado)}</span>
              ) : (
                <span>sem histórico</span>
              )}
            </div>
          </div>
          {item.sum && (
            <span className="mono" style={{ fontWeight: 600, fontSize: 14 }}>
              {fmt.brl(item.sum.min.preco)}
            </span>
          )}
        </div>
      ))}

      {items.length > shown.length && (
        <a className="link small" style={{ display: 'block', textAlign: 'center', marginTop: 8, color: 'var(--fg-2)' }}
           onClick={() => window.__goto('lista')}>
          ver todos ({items.length})
        </a>
      )}
    </>
  );
}

function SearchResults({ results, byProd }) {
  if (results.length === 0) {
    return (
      <div className="empty">
        <div className="emoji">🔍</div>
        Nenhum produto encontrado.
      </div>
    );
  }
  return (
    <>
      <div className="section-hd"><h2>{results.length} resultados</h2></div>
      {results.map(p => {
        const sum = byProd.get(p.id);
        return (
          <div key={p.id} className="row" onClick={() => window.__goto('produto', p.id)}>
            <div className="row-main">
              <div className="row-title">{p.nome}</div>
              <div className="row-sub">
                <span className="pill">{p.categoria}</span>
                {sum && <><span>·</span><span>{sum.n} preços</span></>}
                {sum && <><span>·</span><span>min {fmt.brl(sum.min.preco)}</span></>}
              </div>
            </div>
            <Icon name="chevron" size={16} />
          </div>
        );
      })}
    </>
  );
}

Object.assign(window, { Dashboard, summarizePrices, useData });
