// Mock data simulating the Google Sheets structure
// Usado quando não há URL do Apps Script configurada.

window.MOCK_SUPERMERCADOS = [
  { id: 's1', nome: 'Pão de Açúcar Vila Mariana', cnpj: '33.041.260/0652-90', endereco: 'Rua Domingos de Morais, 2564' },
  { id: 's2', nome: 'Carrefour Paulista', cnpj: '45.543.915/0001-81', endereco: 'Av. Paulista, 1776' },
  { id: 's3', nome: 'Extra Hiper Ibirapuera', cnpj: '47.508.411/0237-14', endereco: 'Av. Ibirapuera, 3103' },
  { id: 's4', nome: 'Assaí Atacadista', cnpj: '06.057.223/0001-71', endereco: 'Av. Cupecê, 2800' },
  { id: 's5', nome: 'Mercadinho São Pedro', cnpj: '12.345.678/0001-90', endereco: 'Rua Vergueiro, 1234' },
];

window.MOCK_PRODUTOS = [
  { id: 'p1',  nome: 'Leite Integral Italac',       categoria: 'Laticínios', unidade: '1L',    codigoBarras: '7898080640017', criadoEm: '2026-01-05' },
  { id: 'p2',  nome: 'Arroz Tio João Tipo 1',       categoria: 'Mercearia',  unidade: '5kg',   codigoBarras: '7893500020011', criadoEm: '2026-01-05' },
  { id: 'p3',  nome: 'Feijão Carioca Camil',        categoria: 'Mercearia',  unidade: '1kg',   codigoBarras: '7896006710011', criadoEm: '2026-01-06' },
  { id: 'p4',  nome: 'Café Pilão Tradicional',      categoria: 'Bebidas',    unidade: '500g',  codigoBarras: '7896089010015', criadoEm: '2026-01-06' },
  { id: 'p5',  nome: 'Açúcar União Refinado',       categoria: 'Mercearia',  unidade: '1kg',   codigoBarras: '7891910000197', criadoEm: '2026-01-07' },
  { id: 'p6',  nome: 'Óleo de Soja Soya',           categoria: 'Mercearia',  unidade: '900ml', codigoBarras: '7891107101309', criadoEm: '2026-01-07' },
  { id: 'p7',  nome: 'Pão de Forma Wickbold',       categoria: 'Padaria',    unidade: '500g',  codigoBarras: '7896066300016', criadoEm: '2026-01-08' },
  { id: 'p8',  nome: 'Manteiga Aviação com Sal',    categoria: 'Laticínios', unidade: '200g',  codigoBarras: '7891515001513', criadoEm: '2026-01-08' },
  { id: 'p9',  nome: 'Ovos Brancos Grandes',        categoria: 'Laticínios', unidade: '12un',  codigoBarras: '7891234560012', criadoEm: '2026-01-09' },
  { id: 'p10', nome: 'Detergente Ypê Neutro',       categoria: 'Limpeza',    unidade: '500ml', codigoBarras: '7896098900116', criadoEm: '2026-01-09' },
  { id: 'p11', nome: 'Papel Higiênico Neve Folha Dupla', categoria: 'Higiene', unidade: '12un', codigoBarras: '7891172422116', criadoEm: '2026-01-10' },
  { id: 'p12', nome: 'Sabão em Pó Omo Multiação',   categoria: 'Limpeza',    unidade: '1,6kg', codigoBarras: '7891150062016', criadoEm: '2026-01-10' },
  { id: 'p13', nome: 'Iogurte Natural Danone',      categoria: 'Laticínios', unidade: '170g',  codigoBarras: '7891025114116', criadoEm: '2026-01-11' },
  { id: 'p14', nome: 'Banana Nanica',               categoria: 'Hortifruti', unidade: 'kg',    codigoBarras: '',              criadoEm: '2026-01-11' },
  { id: 'p15', nome: 'Tomate Italiano',             categoria: 'Hortifruti', unidade: 'kg',    codigoBarras: '',              criadoEm: '2026-01-11' },
  { id: 'p16', nome: 'Refrigerante Guaraná Antarctica', categoria: 'Bebidas', unidade: '2L',   codigoBarras: '7891991010917', criadoEm: '2026-01-12' },
  { id: 'p17', nome: 'Cerveja Heineken Long Neck',  categoria: 'Bebidas',    unidade: '330ml', codigoBarras: '7896045506019', criadoEm: '2026-01-12' },
  { id: 'p18', nome: 'Macarrão Espaguete Barilla',  categoria: 'Mercearia',  unidade: '500g',  codigoBarras: '8076802085714', criadoEm: '2026-01-13' },
];

// helper to build price history
const priceEntry = (id, produtoId, preco, supermercado, data, fonte = 'nota', quantidade = 1, unidade = 'un') => ({
  id, produtoId, nomeProduto: window.MOCK_PRODUTOS.find(p => p.id === produtoId)?.nome || '', preco, supermercado, data, fonte, quantidade, unidade
});

window.MOCK_PRECOS = [
  // Leite
  priceEntry('pr1',  'p1', 5.49,  'Pão de Açúcar Vila Mariana', '2026-04-12', 'nota', 1, 'L'),
  priceEntry('pr2',  'p1', 4.89,  'Carrefour Paulista',          '2026-04-08', 'nota', 1, 'L'),
  priceEntry('pr3',  'p1', 4.59,  'Assaí Atacadista',            '2026-04-02', 'foto', 1, 'L'),
  priceEntry('pr4',  'p1', 5.29,  'Extra Hiper Ibirapuera',      '2026-03-28', 'nota', 1, 'L'),
  priceEntry('pr5',  'p1', 4.99,  'Carrefour Paulista',          '2026-03-15', 'nota', 1, 'L'),
  priceEntry('pr6',  'p1', 4.79,  'Assaí Atacadista',            '2026-03-01', 'manual', 1, 'L'),
  priceEntry('pr7',  'p1', 5.09,  'Pão de Açúcar Vila Mariana',  '2026-02-20', 'nota', 1, 'L'),

  // Arroz 5kg
  priceEntry('pr8',  'p2', 32.90, 'Pão de Açúcar Vila Mariana',  '2026-04-10', 'nota', 1, 'un'),
  priceEntry('pr9',  'p2', 28.90, 'Assaí Atacadista',            '2026-04-03', 'nota', 1, 'un'),
  priceEntry('pr10', 'p2', 30.49, 'Carrefour Paulista',          '2026-03-22', 'nota', 1, 'un'),
  priceEntry('pr11', 'p2', 29.90, 'Extra Hiper Ibirapuera',      '2026-03-10', 'foto', 1, 'un'),

  // Feijão
  priceEntry('pr12', 'p3', 8.99,  'Pão de Açúcar Vila Mariana',  '2026-04-10', 'nota', 1, 'kg'),
  priceEntry('pr13', 'p3', 7.49,  'Assaí Atacadista',            '2026-04-03', 'nota', 1, 'kg'),
  priceEntry('pr14', 'p3', 7.99,  'Carrefour Paulista',          '2026-03-22', 'nota', 1, 'kg'),
  priceEntry('pr15', 'p3', 8.29,  'Mercadinho São Pedro',        '2026-03-15', 'manual', 1, 'kg'),

  // Café
  priceEntry('pr16', 'p4', 18.90, 'Pão de Açúcar Vila Mariana',  '2026-04-12', 'nota', 1, 'un'),
  priceEntry('pr17', 'p4', 16.49, 'Carrefour Paulista',          '2026-04-08', 'nota', 1, 'un'),
  priceEntry('pr18', 'p4', 15.99, 'Assaí Atacadista',            '2026-04-02', 'foto', 1, 'un'),

  // Açúcar
  priceEntry('pr19', 'p5', 4.59,  'Pão de Açúcar Vila Mariana',  '2026-04-12', 'nota', 1, 'kg'),
  priceEntry('pr20', 'p5', 3.99,  'Assaí Atacadista',            '2026-04-03', 'nota', 1, 'kg'),
  priceEntry('pr21', 'p5', 4.29,  'Carrefour Paulista',          '2026-03-22', 'nota', 1, 'kg'),

  // Óleo
  priceEntry('pr22', 'p6', 7.49,  'Pão de Açúcar Vila Mariana',  '2026-04-12', 'nota', 1, 'un'),
  priceEntry('pr23', 'p6', 6.89,  'Carrefour Paulista',          '2026-04-08', 'nota', 1, 'un'),
  priceEntry('pr24', 'p6', 6.49,  'Assaí Atacadista',            '2026-04-02', 'foto', 1, 'un'),

  // Pão de forma
  priceEntry('pr25', 'p7', 9.90,  'Pão de Açúcar Vila Mariana',  '2026-04-10', 'nota', 1, 'un'),
  priceEntry('pr26', 'p7', 8.49,  'Carrefour Paulista',          '2026-04-03', 'nota', 1, 'un'),

  // Manteiga
  priceEntry('pr27', 'p8', 12.90, 'Pão de Açúcar Vila Mariana',  '2026-04-12', 'nota', 1, 'un'),
  priceEntry('pr28', 'p8', 11.49, 'Carrefour Paulista',          '2026-04-08', 'nota', 1, 'un'),
  priceEntry('pr29', 'p8', 10.99, 'Assaí Atacadista',            '2026-04-02', 'foto', 1, 'un'),

  // Ovos
  priceEntry('pr30', 'p9', 14.90, 'Pão de Açúcar Vila Mariana',  '2026-04-10', 'nota', 1, 'dz'),
  priceEntry('pr31', 'p9', 12.90, 'Carrefour Paulista',          '2026-04-03', 'nota', 1, 'dz'),
  priceEntry('pr32', 'p9', 11.90, 'Assaí Atacadista',            '2026-03-28', 'foto', 1, 'dz'),

  // Detergente
  priceEntry('pr33', 'p10', 2.99, 'Pão de Açúcar Vila Mariana',  '2026-04-12', 'nota', 1, 'un'),
  priceEntry('pr34', 'p10', 2.49, 'Carrefour Paulista',          '2026-04-08', 'nota', 1, 'un'),
  priceEntry('pr35', 'p10', 1.99, 'Assaí Atacadista',            '2026-04-02', 'foto', 1, 'un'),

  // Papel higiênico
  priceEntry('pr36', 'p11', 28.90, 'Pão de Açúcar Vila Mariana', '2026-04-10', 'nota', 1, 'un'),
  priceEntry('pr37', 'p11', 24.90, 'Carrefour Paulista',         '2026-04-03', 'nota', 1, 'un'),
  priceEntry('pr38', 'p11', 22.49, 'Assaí Atacadista',           '2026-03-28', 'foto', 1, 'un'),

  // Sabão em pó
  priceEntry('pr39', 'p12', 22.90, 'Pão de Açúcar Vila Mariana', '2026-04-10', 'nota', 1, 'un'),
  priceEntry('pr40', 'p12', 19.90, 'Carrefour Paulista',         '2026-04-03', 'nota', 1, 'un'),

  // Iogurte
  priceEntry('pr41', 'p13', 3.49, 'Pão de Açúcar Vila Mariana',  '2026-04-12', 'nota', 1, 'un'),
  priceEntry('pr42', 'p13', 2.99, 'Carrefour Paulista',          '2026-04-08', 'nota', 1, 'un'),

  // Banana
  priceEntry('pr43', 'p14', 7.99, 'Pão de Açúcar Vila Mariana',  '2026-04-12', 'nota', 1, 'kg'),
  priceEntry('pr44', 'p14', 5.49, 'Carrefour Paulista',          '2026-04-08', 'nota', 1, 'kg'),
  priceEntry('pr45', 'p14', 4.99, 'Assaí Atacadista',            '2026-04-02', 'foto', 1, 'kg'),

  // Tomate
  priceEntry('pr46', 'p15', 9.99, 'Pão de Açúcar Vila Mariana',  '2026-04-12', 'nota', 1, 'kg'),
  priceEntry('pr47', 'p15', 6.99, 'Carrefour Paulista',          '2026-04-08', 'nota', 1, 'kg'),

  // Guaraná
  priceEntry('pr48', 'p16', 10.49, 'Pão de Açúcar Vila Mariana', '2026-04-10', 'nota', 1, 'un'),
  priceEntry('pr49', 'p16', 8.99,  'Carrefour Paulista',         '2026-04-03', 'nota', 1, 'un'),
  priceEntry('pr50', 'p16', 7.99,  'Assaí Atacadista',           '2026-03-28', 'foto', 1, 'un'),

  // Heineken
  priceEntry('pr51', 'p17', 7.99, 'Pão de Açúcar Vila Mariana',  '2026-04-10', 'nota', 6, 'un'),
  priceEntry('pr52', 'p17', 6.49, 'Carrefour Paulista',          '2026-04-03', 'nota', 6, 'un'),

  // Macarrão
  priceEntry('pr53', 'p18', 8.90, 'Pão de Açúcar Vila Mariana',  '2026-04-12', 'nota', 1, 'un'),
  priceEntry('pr54', 'p18', 7.49, 'Carrefour Paulista',          '2026-04-08', 'nota', 1, 'un'),
];

// lista de compras mock
window.MOCK_LISTA_COMPRAS = [
  { id: 'l1', produtoId: 'p1',  comprado: false, quantidade: 2 },
  { id: 'l2', produtoId: 'p3',  comprado: false, quantidade: 1 },
  { id: 'l3', produtoId: 'p7',  comprado: true,  quantidade: 1 },
  { id: 'l4', produtoId: 'p11', comprado: false, quantidade: 1 },
  { id: 'l5', produtoId: 'p14', comprado: false, quantidade: 1 },
  { id: 'l6', produtoId: 'p4',  comprado: false, quantidade: 1 },
];
