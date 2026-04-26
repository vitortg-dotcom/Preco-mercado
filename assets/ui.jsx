// Shared icons — stroke-based SVGs (Lucide-style, original drawings).
const Icon = ({ name, size = 20, stroke = 1.75, ...rest }) => {
  const paths = {
    search:     <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    qr:         <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v1" /></>,
    camera:     <><path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="4" /></>,
    plus:       <><path d="M12 5v14M5 12h14" /></>,
    home:       <><path d="M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" /></>,
    list:       <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
    history:    <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></>,
    settings:   <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
    x:          <><path d="m6 6 12 12M6 18 18 6" /></>,
    check:      <><path d="m5 12 5 5L20 7" /></>,
    chevron:    <><path d="m9 6 6 6-6 6" /></>,
    back:       <><path d="M15 18 9 12l6-6" /></>,
    arrowRight: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    trash:      <><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6v14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6M10 11v6M14 11v6" /></>,
    edit:       <><path d="M17 3a2.828 2.828 0 0 1 4 4L8 20l-5 1 1-5z" /></>,
    flip:       <><path d="M17 2 21 6l-4 4M21 6H9a6 6 0 0 0-6 6v0M7 22l-4-4 4-4M3 18h12a6 6 0 0 0 6-6v0" /></>,
    flash:      <><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></>,
    moon:       <><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" /></>,
    sun:        <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    info:       <><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></>,
    filter:     <><path d="M3 5h18M6 12h12M10 19h4" /></>,
    up:         <><path d="m6 15 6-6 6 6" /></>,
    down:       <><path d="m6 9 6 6 6-6" /></>,
    tag:        <><path d="M20.6 11.4 11 2H2v9l9.4 9.4a2 2 0 0 0 2.8 0l6.4-6.4a2 2 0 0 0 0-2.6z" /><circle cx="7" cy="7" r="1.2" fill="currentColor" /></>,
    store:      <><path d="M3 9h18l-1.5-5.5a1 1 0 0 0-1-.7H5.5a1 1 0 0 0-1 .7z" /><path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10" /><path d="M10 21v-5h4v5" /></>,
    barcode:    <><path d="M3 5v14M6 5v14M9 5v14M13 5v14M17 5v14M20 5v14" /></>,
    sparkles:   <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></>,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
};

// Utils
const fmt = {
  brl: (v) => 'R$ ' + Number(v).toFixed(2).replace('.', ','),
  date: (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  },
  dateLong: (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  },
  relDays: (iso) => {
    const d = new Date(iso + 'T00:00:00');
    const diff = Math.round((new Date() - d) / 86400000);
    if (diff <= 0) return 'hoje';
    if (diff === 1) return 'ontem';
    if (diff < 7) return `${diff}d atrás`;
    if (diff < 30) return `${Math.round(diff/7)}sem atrás`;
    return `${Math.round(diff/30)}mês atrás`;
  },
  shortMarket: (name) => {
    if (!name) return '';
    const m = name.split(' ');
    return m.length > 2 ? m.slice(0, 2).join(' ') : name;
  },
};

Object.assign(window, { Icon, fmt });
