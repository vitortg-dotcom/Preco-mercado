// App root: router + nav + tweaks
const { useState: uS, useEffect: uE } = React;

function App() {
  const [route, setRoute] = uS({ name: 'home', param: null });
  const [toast, setToast] = uS(null);
  const [variant, setVariant] = uS(() => localStorage.getItem('dash_variant') || 'v1');
  const [theme, setTheme] = uS(() => localStorage.getItem('theme') || 'light');
  const [editMode, setEditMode] = uS(false);

  // expose navigator to screens
  uE(() => {
    window.__goto = (name, param) => setRoute({ name, param });
    window.__toast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
    window.__addToLista = async (produtoId) => {
      await window.API.call('add_lista_item', { produtoId, quantidade: 1 });
      window.__toast('Adicionado à lista');
    };
  }, []);

  uE(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  uE(() => { localStorage.setItem('dash_variant', variant); }, [variant]);

  // Tweaks integration
  uE(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setEditMode(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const backHome = () => setRoute({ name: 'home' });
  const done = ({ count, market } = {}) => {
    setRoute({ name: 'home' });
    if (count) window.__toast(`${count} ${count===1?'item salvo':'itens salvos'}`);
  };

  const screenLabel = {
    home: '01 Home',
    scan_qr: '02 Scan QR',
    scan_photo: '03 Foto Gôndola',
    manual: '04 Manual',
    produto: '05 Produto',
    lista: '06 Lista',
    settings: '07 Config',
    historico: '08 Histórico',
  }[route.name] || route.name;

  return (
    <div className="app" data-screen-label={screenLabel}>
      {route.name === 'home' && <Dashboard variant={variant} />}
      {route.name === 'scan_qr' && <ScanQRFlow onDone={done} onClose={backHome} />}
      {route.name === 'scan_photo' && <ScanPhotoFlow onDone={done} onClose={backHome} />}
      {route.name === 'manual' && <ManualAdd onDone={done} onCancel={backHome} />}
      {route.name === 'produto' && <ProductDetail produtoId={route.param} onBack={backHome} />}
      {route.name === 'lista' && <ListaScreen onBack={backHome} />}
      {route.name === 'settings' && <Settings onBack={backHome} />}
      {route.name === 'historico' && <HistoricoScreen onBack={backHome} />}

      {/* Bottom nav — only on main routes */}
      {['home','lista','historico'].includes(route.name) && (
        <nav className="nav">
          <button className={route.name==='home'?'active':''} onClick={() => setRoute({name:'home'})}>
            <Icon name="home" size={20}/><span>Início</span>
          </button>
          <button className={route.name==='lista'?'active':''} onClick={() => setRoute({name:'lista'})}>
            <Icon name="list" size={20}/><span>Lista</span>
          </button>
          <button className={route.name==='historico'?'active':''} onClick={() => setRoute({name:'historico'})}>
            <Icon name="history" size={20}/><span>Histórico</span>
          </button>
        </nav>
      )}

      {toast && <div className="toast">{toast}</div>}

      {editMode && (
        <TweaksPanel
          variant={variant} setVariant={setVariant}
          theme={theme} setTheme={setTheme}
        />
      )}
    </div>
  );
}

function TweaksPanel({ variant, setVariant, theme, setTheme }) {
  return (
    <div className="tweaks-panel">
      <h4>Tweaks</h4>
      <div className="trow">
        <span>Dashboard</span>
        <select value={variant} onChange={e => setVariant(e.target.value)}>
          <option value="v1">Recentes</option>
          <option value="v2">Economia</option>
          <option value="v3">Estatísticas</option>
        </select>
      </div>
      <div className="trow">
        <span>Tema</span>
        <div className={`switch ${theme === 'dark' ? 'on' : ''}`}
             onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}/>
      </div>
    </div>
  );
}

// ============ Histórico geral ============
function HistoricoScreen({ onBack }) {
  const [precos, setPrecos] = uS([]);
  const [produtos, setProdutos] = uS([]);
  const [filter, setFilter] = uS('all');

  uE(() => {
    Promise.all([
      window.API.call('list_precos'),
      window.API.call('list_produtos'),
    ]).then(([pr, prod]) => { setPrecos(pr); setProdutos(prod); });
  }, []);

  const categorias = Array.from(new Set(produtos.map(p => p.categoria)));
  const sorted = [...precos].sort((a,b) => b.data.localeCompare(a.data));
  const filt = filter === 'all' ? sorted : sorted.filter(p => {
    const prod = produtos.find(x => x.id === p.produtoId);
    return prod?.categoria === filter;
  });

  // group by date
  const byDate = {};
  filt.forEach(p => {
    (byDate[p.data] = byDate[p.data] || []).push(p);
  });

  return (
    <div className="screen-container">
      <div className="topbar">
        <button className="icon-btn" onClick={onBack}><Icon name="back" size={18}/></button>
        <div className="brand" style={{ fontSize: 15 }}>Histórico</div>
        <div style={{width:38}}/>
      </div>
      <div className="screen">
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }}>
          <button className={`pill ${filter==='all'?'primary':''}`}
            style={{ padding: '6px 12px', border: 0, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12 }}
            onClick={() => setFilter('all')}>
            Todos · {precos.length}
          </button>
          {categorias.map(c => (
            <button key={c} className={`pill ${filter===c?'primary':''}`}
              style={{ padding: '6px 12px', border: 0, cursor: 'pointer', whiteSpace: 'nowrap', fontSize: 12 }}
              onClick={() => setFilter(c)}>
              {c}
            </button>
          ))}
        </div>

        {Object.entries(byDate).map(([date, arr]) => (
          <div key={date} style={{ marginBottom: 18 }}>
            <div className="section-hd">
              <h2>{fmt.dateLong(date)}</h2>
              <span className="mono small muted">{arr.length} {arr.length===1?'item':'itens'}</span>
            </div>
            {arr.map(p => {
              const prod = produtos.find(x => x.id === p.produtoId);
              return (
                <div key={p.id} className="row" onClick={() => window.__goto('produto', p.produtoId)}>
                  <div className="row-main">
                    <div className="row-title">{p.nomeProduto}</div>
                    <div className="row-sub">
                      <span>{fmt.shortMarket(p.supermercado)}</span>
                      <span>·</span>
                      <span className="pill" style={{ fontSize: 10 }}>{p.fonte}</span>
                      {prod && <><span>·</span><span>{prod.categoria}</span></>}
                    </div>
                  </div>
                  <span className="mono" style={{ fontWeight: 600 }}>{fmt.brl(p.preco)}</span>
                </div>
              );
            })}
          </div>
        ))}

        {filt.length === 0 && <div className="empty">Sem registros nesta categoria.</div>}
      </div>
    </div>
  );
}

Object.assign(window, { App });

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
