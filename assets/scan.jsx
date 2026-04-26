// Camera screens + review — QR and photo flows share the camera shell.
const { useState: useStateCam, useEffect: useEffectCam, useRef: useRefCam } = React;

function CameraScreen({ mode, onCapture, onClose }) {
  const videoRef  = useRefCam(null);
  const canvasRef = useRefCam(null);
  const streamRef = useRefCam(null);
  const rafRef    = useRefCam(null);
  const [camError, setCamError] = useStateCam(null);
  const [ready, setReady]       = useStateCam(false);

  const title = mode === 'qr' ? 'Escanear QR da nota' : 'Foto da gôndola';
  const hint  = mode === 'qr'
    ? 'Aponte para o QR code da nota fiscal'
    : 'Enquadre a etiqueta de preço e o produto';

  function stopAll() {
    if (rafRef.current)    { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }

  // Start camera
  useEffectCam(() => {
    let active = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCamError('getUserMedia não suportado neste navegador.');
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
      .then(stream => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play().then(() => { if (active) setReady(true); });
        }
      })
      .catch(err => { if (active) setCamError('Câmera indisponível: ' + err.message); });
    return () => { active = false; stopAll(); };
  }, []);

  // QR scan loop — starts once video is playing
  // Throttled to ~8fps: gives camera time to focus and reduces CPU on mobile
  useEffectCam(() => {
    if (!ready || mode !== 'qr') return;
    let active = true;

    const scan = () => {
      if (!active) return;
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA || !video.videoWidth) {
        rafRef.current = requestAnimationFrame(scan); return;
      }
      canvas.width  = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // attemptBoth: tries normal + inverted, catches more QR codes under varied lighting
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
      if (code && code.data) {
        active = false;
        stopAll();
        onCapture({ qrUrl: code.data });
        return;
      }
      // ~8fps — scanning every frame on mobile causes blur and misses more than it catches
      setTimeout(() => { if (active) { rafRef.current = requestAnimationFrame(scan); } }, 120);
    };

    rafRef.current = requestAnimationFrame(scan);
    return () => { active = false; if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [ready]);

  const capturePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const b64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
    stopAll();
    onCapture({ imageBase64: b64 });
  };

  if (camError) return (
    <div className="camera">
      <div className="camera-top">
        <button onClick={onClose}><Icon name="x" size={20}/></button>
        <div className="camera-title">{title}</div>
        <div style={{width:38}}/>
      </div>
      <div className="camera-view" style={{ display:'grid', placeItems:'center' }}>
        <div style={{ textAlign:'center', color:'#fff', padding:24 }}>
          <Icon name="camera" size={36}/>
          <div style={{ marginTop:12, fontSize:14, opacity:.8 }}>{camError}</div>
          <button className="btn" style={{ marginTop:20, background:'rgba(255,255,255,.15)', color:'#fff' }} onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="camera">
      <div className="camera-top">
        <button onClick={onClose} aria-label="Fechar"><Icon name="x" size={20}/></button>
        <div className="camera-title">{title}</div>
        <div style={{width:38}}/>
      </div>
      <div className="camera-view" style={{ position:'relative', overflow:'hidden' }}>
        <video ref={videoRef} playsInline muted style={{
          position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:1
        }}/>
        <canvas ref={canvasRef} style={{ display:'none' }}/>
        <div className="camera-reticle"><span/></div>
        {mode === 'qr' && <div className="camera-scan-line"/>}
      </div>
      <div className="camera-hint">{hint}</div>
      <div className="camera-bar">
        <div style={{width:38}}/>
        {mode === 'qr' ? (
          <button className="shutter qr" disabled><div className="shutter-inner"/></button>
        ) : (
          <button className="shutter" onClick={capturePhoto} aria-label="Capturar">
            <div className="shutter-inner"/>
          </button>
        )}
        <div style={{width:38}}/>
      </div>
    </div>
  );
}

// ============ QR scan: camera → loading → review ============
function ScanQRFlow({ onDone, onClose }) {
  const [stage, setStage] = useStateCam('camera');
  const [nfe, setNfe]     = useStateCam(null);
  const [errMsg, setErr]  = useStateCam('');

  const capture = async ({ qrUrl }) => {
    setStage('loading');
    try {
      const data = await window.API.call('scan_nfe', { qrUrl });
      setNfe(data);
      setStage('review');
    } catch (e) {
      setErr(e.message);
      setStage('error');
    }
  };

  if (stage === 'camera')     return <CameraScreen mode="qr" onCapture={capture} onClose={onClose}/>;
  if (stage === 'loading')    return <LoadingOverlay title="Consultando SEFAZ..." sub="Importando itens da nota"/>;
  if (stage === 'foto-nota')  return <ScanFotoNotaFlow onDone={onDone} onClose={onClose}/>;
  if (stage === 'error') return (
    <div className="screen-container">
      <div className="topbar">
        <button className="icon-btn" onClick={onClose}><Icon name="back" size={18}/></button>
        <div className="brand" style={{ fontSize:15 }}>Link do QR quebrado</div>
        <div style={{width:38}}/>
      </div>
      <div className="screen">
        <div className="card" style={{ textAlign:'center', padding:32 }}>
          <div style={{ fontWeight:600, marginBottom:8 }}>SEFAZ não respondeu</div>
          <div className="muted small" style={{ marginBottom:24 }}>{errMsg}</div>
          <button className="btn primary block" onClick={() => setStage('foto-nota')}>
            <Icon name="camera" size={16}/> Fotografar a nota impressa
          </button>
          <button className="btn block" style={{ marginTop:10 }} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
  return <NFEReview nfe={nfe} onSave={onDone} onCancel={onClose}/>;
}

// ============ Foto da nota impressa: camera → loading → review ============
function ScanFotoNotaFlow({ onDone, onClose }) {
  const [stage, setStage] = useStateCam('camera');
  const [nfe, setNfe]     = useStateCam(null);
  const [errMsg, setErr]  = useStateCam('');

  const capture = async ({ imageBase64 }) => {
    setStage('loading');
    try {
      const data = await window.API.call('ocr_nota', { imageBase64 });
      setNfe(data);
      setStage('review');
    } catch (e) {
      setErr(e.message);
      setStage('error');
    }
  };

  if (stage === 'camera')  return <CameraScreen mode="photo" onCapture={capture} onClose={onClose}/>;
  if (stage === 'loading') return <LoadingOverlay title="Lendo nota fiscal..." sub="Gemini identificando os itens"/>;
  if (stage === 'error') return (
    <div className="screen-container">
      <div className="topbar">
        <button className="icon-btn" onClick={onClose}><Icon name="back" size={18}/></button>
        <div className="brand" style={{ fontSize:15 }}>Erro na leitura</div>
        <div style={{width:38}}/>
      </div>
      <div className="screen">
        <div className="card" style={{ textAlign:'center', padding:32 }}>
          <div style={{ fontWeight:600, marginBottom:8 }}>Não foi possível ler a nota</div>
          <div className="muted small" style={{ marginBottom:24 }}>{errMsg}</div>
          <button className="btn primary block" onClick={() => setStage('camera')}>Tentar novamente</button>
          <button className="btn block" style={{ marginTop:10 }} onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
  return <NFEReview nfe={nfe} onSave={onDone} onCancel={onClose}/>;
}

// ============ Photo gôndola: camera → loading → review ============
function ScanPhotoFlow({ onDone, onClose }) {
  const [stage, setStage]   = useStateCam('camera');
  const [result, setResult] = useStateCam(null);
  const [errMsg, setErr]    = useStateCam('');

  const capture = async ({ imageBase64 }) => {
    setStage('loading');
    try {
      const data = await window.API.call('ocr_gondola', { imageBase64 });
      setResult(data);
      setStage('review');
    } catch (e) {
      setErr(e.message);
      setStage('error');
    }
  };

  if (stage === 'camera')  return <CameraScreen mode="photo" onCapture={capture} onClose={onClose}/>;
  if (stage === 'loading') return <LoadingOverlay title="Analisando imagem..." sub="Gemini detectando produtos e preços"/>;
  if (stage === 'error') return (
    <div className="screen-container">
      <div className="topbar">
        <button className="icon-btn" onClick={onClose}><Icon name="back" size={18}/></button>
        <div className="brand" style={{ fontSize:15 }}>Erro na análise</div>
        <div style={{width:38}}/>
      </div>
      <div className="screen">
        <div className="card" style={{ textAlign:'center', padding:32 }}>
          <div style={{ fontWeight:600, marginBottom:8 }}>Não foi possível analisar a imagem</div>
          <div className="muted small" style={{ marginBottom:24 }}>{errMsg}</div>
          <button className="btn primary block" onClick={onClose}>Voltar</button>
        </div>
      </div>
    </div>
  );
  return <GondolaReview result={result} onSave={onDone} onCancel={onClose}/>;
}

function LoadingOverlay({ title, sub }) {
  return (
    <div className="camera">
      <div className="camera-top">
        <div />
        <div className="camera-title">{title}</div>
        <div style={{width:38}}/>
      </div>
      <div className="camera-view">
        <div style={{ textAlign: 'center', zIndex: 2 }}>
          <div className="spinner" style={{
            width: 54, height: 54, borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.15)',
            borderTopColor: '#fff',
            margin: '0 auto',
            animation: 'spin 0.9s linear infinite',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>{sub}</div>
        </div>
      </div>
    </div>
  );
}

// ============ NFE review ============
function NFEReview({ nfe, onSave, onCancel }) {
  const [items, setItems] = useStateCam(nfe.itens.map((it, i) => ({ ...it, id: 'n'+i, selected: true })));
  const [market, setMarket] = useStateCam(nfe.supermercado);

  const toggle = (id) => setItems(s => s.map(it => it.id === id ? { ...it, selected: !it.selected } : it));
  const selectedCount = items.filter(i => i.selected).length;
  const total = items.filter(i => i.selected).reduce((a,i) => a + i.preco * i.quantidade, 0);

  const save = async () => {
    for (const it of items.filter(i => i.selected)) {
      await window.API.call('add_preco', {
        nomeProduto: it.nome,
        preco: it.preco,
        supermercado: market,
        data: nfe.data,
        fonte: 'nota',
        quantidade: it.quantidade,
        unidade: it.unidade,
      });
    }
    onSave({ count: selectedCount, market });
  };

  return (
    <div className="screen-container">
      <div className="topbar">
        <button className="icon-btn" onClick={onCancel}><Icon name="back" size={18}/></button>
        <div className="brand" style={{ fontSize: 15 }}>Revisar nota fiscal</div>
        <div style={{width:38}}/>
      </div>

      <div className="screen">
        <div className="nfe-head">
          <div className="nfe-market">{market}</div>
          <div className="nfe-meta">
            <span>{fmt.dateLong(nfe.data)}</span>
            <span>·</span>
            <span>nota {nfe.numeroNota}</span>
          </div>
          <div className="nfe-total">
            <span>Total da nota</span>
            <span className="mono">{fmt.brl(nfe.total)}</span>
          </div>
        </div>

        <div className="section-hd">
          <h2>{items.length} itens · {selectedCount} selecionados</h2>
          <a className="link" onClick={() => setItems(s => s.map(it => ({...it, selected: !items.every(i=>i.selected)})))}>
            {items.every(i=>i.selected) ? 'Nenhum' : 'Todos'}
          </a>
        </div>

        {items.map(it => (
          <div key={it.id} className="nfe-item" style={{ opacity: it.selected ? 1 : 0.55 }}>
            <div className={`check ${it.selected ? 'on' : ''}`} onClick={() => toggle(it.id)}>
              {it.selected && <Icon name="check" size={12} />}
            </div>
            <div>
              <div className="name">{it.nome}</div>
              <div className="sub">
                {it.quantidade}{it.unidade === 'kg' ? ' kg' : 'x'} · unit. {fmt.brl(it.preco)}
              </div>
            </div>
            <div className="p">{fmt.brl(it.preco * it.quantidade)}</div>
          </div>
        ))}

        <div style={{ marginTop: 14 }}>
          <button className="btn primary block lg" onClick={save} disabled={selectedCount === 0}>
            <Icon name="check" size={18}/> Importar {selectedCount} {selectedCount === 1 ? 'item' : 'itens'} · {fmt.brl(total)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ Gondola review ============
function GondolaReview({ result, onSave, onCancel }) {
  const sorted = [...result.produtos].sort((a,b) => b.confianca - a.confianca);
  const [pick, setPick] = useStateCam(sorted[0]);
  const [market, setMarket] = useStateCam('');
  const [markets, setMarkets] = useStateCam([]);
  useEffectCam(() => { window.API.call('list_supermercados').then(setMarkets); }, []);

  const save = async () => {
    await window.API.call('add_preco', {
      nomeProduto: pick.nome,
      preco: pick.preco,
      supermercado: market || 'Não informado',
      data: new Date().toISOString().slice(0,10),
      fonte: 'foto',
      quantidade: 1,
      unidade: pick.unidade || 'un',
    });
    onSave({ count: 1, market });
  };

  return (
    <div className="screen-container">
      <div className="topbar">
        <button className="icon-btn" onClick={onCancel}><Icon name="back" size={18}/></button>
        <div className="brand" style={{ fontSize: 15 }}>Confirmar produto</div>
        <div style={{width:38}}/>
      </div>
      <div className="screen">
        <div style={{ background: 'var(--bg-2)', borderRadius: 'var(--r-lg)', aspectRatio: '16/10',
                      display: 'grid', placeItems: 'center', marginBottom: 14,
                      border: '1px dashed var(--border-2)' }}>
          <div style={{ textAlign: 'center', color: 'var(--fg-3)', fontSize: 12, fontFamily: 'var(--f-mono)' }}>
            <Icon name="camera" size={28} /><br/>
            preview da foto
          </div>
        </div>

        <div className="section-hd">
          <h2><Icon name="sparkles" size={12} style={{verticalAlign: -2}}/> Gemini detectou {result.produtos.length} opções</h2>
        </div>

        {sorted.map((p, i) => (
          <div key={i}
            className={`gchip ${pick === p ? 'best' : ''}`}
            onClick={() => setPick(p)}>
            <div className={`check ${pick === p ? 'on' : ''}`} style={{ borderRadius: '50%' }}>
              {pick === p && <Icon name="check" size={12} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{p.nome}</div>
              <div className="conf">confiança {Math.round(p.confianca*100)}% · {p.unidade}</div>
            </div>
            <div className="num">{fmt.brl(p.preco)}</div>
          </div>
        ))}

        <div className="field" style={{ marginTop: 18 }}>
          <label>Supermercado</label>
          <select value={market} onChange={e => setMarket(e.target.value)}>
            <option value="">Selecione...</option>
            {markets.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
          </select>
        </div>

        <button className="btn primary block lg" onClick={save} disabled={!market}>
          <Icon name="check" size={18}/> Salvar preço
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ScanQRFlow, ScanPhotoFlow });
