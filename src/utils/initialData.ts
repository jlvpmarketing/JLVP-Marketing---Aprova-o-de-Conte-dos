import { AgencyConfig, Client, FolderProject, PostContent, NotificationItem, AgencyUser, AuditLogItem } from '../types';

export const THEME_COLOR_PRESETS = [
  { id: 'indigo', name: 'Índigo Moderno', primary: '#6366F1', hover: '#4F46E5', light: '#EEF2FF', border: '#C7D2FE' },
  { id: 'emerald', name: 'Esmeralda Digital', primary: '#059669', hover: '#047857', light: '#ECFDF5', border: '#A7F3D0' },
  { id: 'sunset', name: 'Sunset Criativo', primary: '#EA580C', hover: '#C2410C', light: '#FFF7ED', border: '#FED7AA' },
  { id: 'blue', name: 'Azul Executivo', primary: '#2563EB', hover: '#1D4ED8', light: '#EFF6FF', border: '#BFDBFE' },
  { id: 'berry', name: 'Berry Magenta', primary: '#9333EA', hover: '#7E22CE', light: '#FAF5FF', border: '#E9D5FF' },
  { id: 'noir', name: 'Noir Minimalista', primary: '#18181B', hover: '#09090B', light: '#F4F4F5', border: '#E4E4E7' },
];

export const INITIAL_AGENCY_CONFIG: AgencyConfig = {
  agencyName: 'JLVP Marketing',
  agencyLogo: '',
  primaryColor: '#6366F1',
  accentColor: '#4F46E5',
  accountManagerName: 'Paloma Garcia',
  accountManagerPhone: '11987654321',
  accountManagerEmail: 'jlvpmarketing@gmail.com',
};

// SVG sample graphics (native 1080x1350 feed portrait aspect ratio 4:5)
const SAMPLE_IMG_COFFEE_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233E2723"/><stop offset="100%" stop-color="%231a0e0b"/></linearGradient></defs><rect width="1080" height="1350" fill="url(%23g1)"/><circle cx="540" cy="580" r="320" fill="%234E342E"/><circle cx="540" cy="580" r="260" fill="%236D4C41"/><circle cx="540" cy="580" r="200" fill="%23A1887F"/><path d="M 480 580 Q 540 480 600 580 Q 540 680 480 580" fill="%23FFF8E1"/><path d="M 510 580 Q 540 520 570 580 Q 540 640 510 580" fill="%235D4037"/><rect x="140" y="960" width="800" height="2" fill="%238D6E63"/><text x="540" y="1040" fill="%23EFEBE9" font-family="sans-serif" font-size="44" font-weight="bold" text-anchor="middle" letter-spacing="4">AROMA %26 GRÃO</text><text x="540" y="1100" fill="%23BCAAA4" font-family="sans-serif" font-size="24" text-anchor="middle" letter-spacing="2">EDIÇÃO ESPECIAL PRIMAVERA 2026</text><text x="540" y="1160" fill="%23D7CCC8" font-family="sans-serif" font-size="18" text-anchor="middle">FORMATO RETRATO 1080x1350 (4:5)</text></svg>`;

const SAMPLE_IMG_COFFEE_CAROUSEL_2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23271714"/><stop offset="100%" stop-color="%2342221b"/></linearGradient></defs><rect width="1080" height="1350" fill="url(%23cg)"/><rect x="100" y="140" width="880" height="1070" rx="36" fill="%233E2723" stroke="%238D6E63" stroke-width="4"/><text x="540" y="270" fill="%23FFE082" font-family="sans-serif" font-size="52" font-weight="bold" text-anchor="middle">PASSO 02: MOAGEM</text><text x="540" y="340" fill="%23D7CCC8" font-family="sans-serif" font-size="28" text-anchor="middle">Granulometria média para extração v60</text><circle cx="540" cy="580" r="160" fill="%235D4037"/><path d="M460 580 L620 580 M540 500 L540 660" stroke="%23FFF8E1" stroke-width="10" stroke-linecap="round"/><text x="540" y="860" fill="%23FFF" font-family="sans-serif" font-size="34" font-weight="bold" text-anchor="middle">Preserva notas florais e corpo aveludado</text><text x="540" y="930" fill="%23BCAAA4" font-family="sans-serif" font-size="22" text-anchor="middle">Lâmina 02 de 02 · 1080x1350</text></svg>`;

const SAMPLE_IMG_FASHION_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23FCE7F3"/><stop offset="100%" stop-color="%23FBCFE8"/></linearGradient></defs><rect width="1080" height="1350" fill="url(%23fg)"/><rect x="120" y="140" width="840" height="1070" rx="32" fill="%23FFFFFF"/><path d="M 360 840 C 420 620, 500 500, 540 320 C 580 500, 660 620, 720 840 Z" fill="%23DB2777" opacity="0.85"/><circle cx="540" cy="270" r="60" fill="%23F472B6"/><text x="540" y="980" fill="%23831843" font-family="sans-serif" font-size="46" font-weight="bold" text-anchor="middle">BELLA DONNA</text><text x="540" y="1040" fill="%239D174D" font-family="sans-serif" font-size="26" text-anchor="middle">Coleção Linho %26 Alfaiataria Fluida</text><text x="540" y="1100" fill="%23DB2777" font-family="sans-serif" font-size="20" text-anchor="middle">Feed Retrato 1080x1350</text></svg>`;

const SAMPLE_IMG_TECH_1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230F172A"/><stop offset="100%" stop-color="%231E293B"/></linearGradient></defs><rect width="1080" height="1350" fill="url(%23tg)"/><rect x="100" y="160" width="880" height="780" rx="32" fill="%231E293B" stroke="%23334155" stroke-width="4"/><rect x="160" y="240" width="220" height="160" rx="16" fill="%232563EB" opacity="0.3"/><text x="270" y="335" fill="%2360A5FA" font-family="sans-serif" font-size="34" font-weight="bold" text-anchor="middle">-42% Churn</text><rect x="430" y="240" width="220" height="160" rx="16" fill="%2310B981" opacity="0.3"/><text x="540" y="335" fill="%2334D399" font-family="sans-serif" font-size="34" font-weight="bold" text-anchor="middle">+3.8x LTV</text><rect x="700" y="240" width="220" height="160" rx="16" fill="%238B5CF6" opacity="0.3"/><text x="810" y="335" fill="%23A78BFA" font-family="sans-serif" font-size="34" font-weight="bold" text-anchor="middle">100% Cloud</text><polyline points="180,720 340,620 500,660 660,480 820,520 920,380" fill="none" stroke="%2338BDF8" stroke-width="8" stroke-linecap="round"/><text x="540" y="1060" fill="%23F8FAFC" font-family="sans-serif" font-size="44" font-weight="bold" text-anchor="middle">NEXUS ENTERPRISE SAAS</text><text x="540" y="1120" fill="%2394A3B8" font-family="sans-serif" font-size="26" text-anchor="middle">Otimização Contínua de Retenção (1080x1350)</text></svg>`;

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Marcos Silveira',
    company: 'Aroma & Grão Cafés Especiais',
    email: 'marcos@aromagrao.com.br',
    phone: '11991234567',
    logo: '',
    brandColor: '#78350F',
    niche: 'Cafeteria & Torrefação Artesanal',
    notes: 'Priorizar fotos com luz natural quente e destaque para os produtores locais de Minas Gerais.',
    createdAt: '2026-09-01T10:00:00Z',
    assignedManagerId: 'user-manager',
    assignedManagerName: 'Camila Rocha',
  },
  {
    id: 'cli-2',
    name: 'Vanessa Lemos',
    company: 'Bella Donna Moda & Estilo',
    email: 'contato@belladonna.com.br',
    phone: '21987651234',
    logo: '',
    brandColor: '#DB2777',
    niche: 'Moda Feminina Sustentável',
    notes: 'Linguagem elegante, visual clean e foco em peças atemporais.',
    createdAt: '2026-09-15T14:30:00Z',
    assignedManagerId: 'user-manager',
    assignedManagerName: 'Camila Rocha',
  },
  {
    id: 'cli-3',
    name: 'Gabriel Torres',
    company: 'Nexus SaaS & Tech',
    email: 'gabriel@nexustech.io',
    phone: '31988887777',
    logo: '',
    brandColor: '#2563EB',
    niche: 'FinTech & B2B Software',
    notes: 'Conteúdo para LinkedIn com gráficos claros e insights práticos para diretores de finanças.',
    createdAt: '2026-10-01T09:15:00Z',
    assignedManagerId: 'user-owner',
    assignedManagerName: 'Fernanda Domingos',
  },
];

export const INITIAL_PROJECTS: FolderProject[] = [
  {
    id: 'proj-1',
    clientId: 'cli-1',
    name: 'Lançamento Grãos Especiais Primavera 2026',
    description: 'Campanha de divulgação dos novos lotes fermentados da Serra da Mantiqueira.',
    status: 'review',
    clientAccessKey: 'aroma-primavera-2026',
    createdAt: '2026-10-10T11:00:00Z',
    supportDocs: [
      {
        id: 'doc-1',
        name: 'Briefing_Lote_Primavera.pdf',
        size: '1.4 MB',
        type: 'application/pdf',
        url: '#',
        uploadDate: '2026-10-10T11:00:00Z',
      },
      {
        id: 'doc-2',
        name: 'Manual_Identidade_Visual_Aroma.pdf',
        size: '4.8 MB',
        type: 'application/pdf',
        url: '#',
        uploadDate: '2026-10-10T11:05:00Z',
      },
    ],
  },
  {
    id: 'proj-2',
    clientId: 'cli-1',
    name: 'Feed Mensal & Rotina da Cafeteria',
    description: 'Posts informativos, horários de atendimento e conteúdo de comunidade.',
    status: 'active',
    clientAccessKey: 'aroma-feed-mensal',
    createdAt: '2026-10-01T09:00:00Z',
    supportDocs: [],
  },
  {
    id: 'proj-3',
    clientId: 'cli-2',
    name: 'Coleção Primavera Fluida 2026',
    description: 'Reels, Carrosséis e Stories apresentando a nova linha em linho natural.',
    status: 'review',
    clientAccessKey: 'belladonna-primavera',
    createdAt: '2026-10-12T15:00:00Z',
    supportDocs: [
      {
        id: 'doc-3',
        name: 'Lookbook_Primavera_Preview.pdf',
        size: '8.2 MB',
        type: 'application/pdf',
        url: '#',
        uploadDate: '2026-10-12T15:20:00Z',
      },
    ],
  },
  {
    id: 'proj-4',
    clientId: 'cli-3',
    name: 'Campanha Nutrição B2B LinkedIn',
    description: 'Carrosséis de dados, estudos de caso e pílulas em vídeo.',
    status: 'active',
    clientAccessKey: 'nexus-linkedin-q4',
    createdAt: '2026-10-05T10:00:00Z',
    supportDocs: [],
  },
];

export const INITIAL_POSTS: PostContent[] = [
  {
    id: 'post-1',
    projectId: 'proj-1',
    clientId: 'cli-1',
    title: 'Carrossel: Os 4 Segredos da Extração Perfeita',
    status: 'pending_approval',
    contentType: 'carousel',
    mediaType: 'carousel',
    mediaUrls: [SAMPLE_IMG_COFFEE_1, SAMPLE_IMG_COFFEE_CAROUSEL_2],
    caption: `☕ Você sabia que 2 segundos a mais na água podem transformar a acidez do seu café?

Preparamos um guia direto ao ponto com os 4 parâmetros essenciais para extrair notas frutadas e corpo aveludado na sua prensa francesa ou filtro v60:

1️⃣ Moagem adequada para cada método
2️⃣ Temperatura da água (entre 90°C e 94°C)
3️⃣ Tempo de pré-infusão (30 a 45 segundos)
4️⃣ Proporção correta: 1g de café para 15ml de água

Salve este post para sua próxima xícara e marque aquele amigo que não dispensa um bom café especial! 👇

#CafeEspecial #TorraArtesanal #BaristaLife #Mantiqueira #AromaEGrao`,
    scheduledDate: '2026-10-30T10:00',
    platforms: ['instagram_feed', 'facebook'],
    comments: [
      {
        id: 'c-1',
        postId: 'post-1',
        authorRole: 'agency',
        authorName: 'Camila Rocha (Agência)',
        text: 'Olá Marcos! Esse carrossel foi pensado para gerar bastante salvamento e engajamento técnico. A paleta segue os tons quentes do manual.',
        timestamp: '2026-10-27T09:30:00Z',
      },
    ],
    supportFiles: [],
    createdAt: '2026-10-27T09:00:00Z',
  },
  {
    id: 'post-2',
    projectId: 'proj-1',
    clientId: 'cli-1',
    title: 'Reels: Bastidores da Torra no Galpão (Vídeo Drive)',
    status: 'pending_approval',
    contentType: 'reel',
    mediaType: 'drive_video',
    mediaUrls: [],
    driveVideoUrl: 'https://drive.google.com/file/d/1vB_CoffeeRoastSample2026/preview',
    caption: `🔥 Do grão verde até a primeira explosão de aroma! 

Um vislumbre de 30 segundos dos bastidores da torrefação do nosso novo lote premiado de Catuaí Amarelo. Tudo feito aqui na casa, em pequenos lotes supervisionados pelo mestre de torra.

Disponível em grãos ou moído na hora para levar para casa. Venha provar no nosso balcão!

#ReelsBrasil #Bastidores #CoffeeRoastery #CafeDeOrigem`,
    scheduledDate: '2026-11-02T18:30',
    platforms: ['reels', 'tiktok', 'instagram_story'],
    comments: [],
    supportFiles: [],
    createdAt: '2026-10-27T10:15:00Z',
  },
  {
    id: 'post-3',
    projectId: 'proj-1',
    clientId: 'cli-1',
    title: 'Card Informativo: Horários de Feriado & Degustação',
    status: 'changes_requested',
    contentType: 'static',
    mediaType: 'image',
    mediaUrls: [SAMPLE_IMG_COFFEE_1],
    caption: `📅 Programação especial para o feriado prolongado!

Estaremos de portas abertas com sessões de cupping guiado às 11h e às 16h. 

⏰ Horários de funcionamento:
- Sexta e Sábado: 08h às 20h
- Domingo: 09h às 18h

Reserve sua mesa pelo link na bio ou passe para retirar seu café fresco. Te esperamos!`,
    scheduledDate: '2026-11-05T14:00',
    platforms: ['instagram_feed', 'instagram_story'],
    requestedChangesNote: 'Por favor atualizar a foto para o novo balcão de madeira nobre e confirmar que no domingo fechamos às 18h em ponto.',
    comments: [
      {
        id: 'c-2',
        postId: 'post-3',
        authorRole: 'client',
        authorName: 'Marcos Silveira (Cliente)',
        text: 'Oi Camila, podemos trocar a arte de fundo pela foto recente que enviamos do novo balcão? O texto da legenda está ótimo!',
        timestamp: '2026-10-27T11:00:00Z',
      },
      {
        id: 'c-3',
        postId: 'post-3',
        authorRole: 'agency',
        authorName: 'Camila Rocha (Agência)',
        text: 'Perfeito Marcos! Nosso designer já está aplicando a nova foto do balcão. Subiremos a v2 até as 15h.',
        timestamp: '2026-10-27T11:20:00Z',
      },
    ],
    supportFiles: [],
    createdAt: '2026-10-26T16:00:00Z',
  },
  {
    id: 'post-4',
    projectId: 'proj-1',
    clientId: 'cli-1',
    title: 'Foto Estúdio: Lote Especial Serra da Mantiqueira',
    status: 'approved',
    contentType: 'static',
    mediaType: 'image',
    mediaUrls: [SAMPLE_IMG_COFFEE_1],
    caption: `🏆 Notas sensoriais de jasmim, rapadura e tangerina. 

Nosso microlote da Fazenda Vista Alegre passou por 72h de fermentação anaeróbica e alcançou 88 pontos na escala SCA. Uma experiência única na xícara.

Peça pelo nosso site ou retire na loja. Quantidade estritamente limitada a 120 pacotes.`,
    scheduledDate: '2026-10-28T09:00',
    platforms: ['instagram_feed'],
    comments: [
      {
        id: 'c-4',
        postId: 'post-4',
        authorRole: 'client',
        authorName: 'Marcos Silveira (Cliente)',
        text: 'Aprovado com louvor! A descrição das notas sensoriais ficou impecável.',
        timestamp: '2026-10-26T14:40:00Z',
      },
    ],
    approvedAt: '2026-10-26T14:40:00Z',
    approvedBy: 'Marcos Silveira',
    createdAt: '2026-10-25T11:00:00Z',
  },
  {
    id: 'post-5',
    projectId: 'proj-3',
    clientId: 'cli-2',
    title: 'Editorial Primavera: Vestido Linho Esmeralda',
    status: 'pending_approval',
    contentType: 'story',
    mediaType: 'image',
    mediaUrls: [SAMPLE_IMG_FASHION_1],
    caption: `🌿 Fluidez natural e elegância atemporal.

O Vestido Maya em puro linho traz corte evasê, decote suave e bolsos utilitários embutidos. Feito para acompanhar você do escritório ao fim de tarde à beira-mar.

Toque no link da bio para conferir a pré-venda exclusiva.`,
    scheduledDate: '2026-11-01T19:00',
    platforms: ['instagram_feed', 'instagram_story'],
    comments: [],
    createdAt: '2026-10-27T10:00:00Z',
  },
  {
    id: 'post-6',
    projectId: 'proj-4',
    clientId: 'cli-3',
    title: 'Infográfico B2B: Como Reduzir Churn em 42%',
    status: 'pending_approval',
    contentType: 'static',
    mediaType: 'image',
    mediaUrls: [SAMPLE_IMG_TECH_1],
    caption: `📊 Reduzir cancelamentos não é sobre descontos no final do ciclo — é sobre ativação nos primeiros 14 dias.

Mapeamos os 3 pontos críticos de atrito em mais de 120 operações SaaS B2B no Brasil. 

Confira os dados completos no infográfico e baixe o framework gratuito no primeiro comentário.

#SaaS #CustomerSuccess #Growth #FintechBrasil`,
    scheduledDate: '2026-10-29T11:00',
    platforms: ['linkedin'],
    comments: [],
    createdAt: '2026-10-27T08:30:00Z',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    recipient: 'agency',
    title: 'Conteúdo Aprovado!',
    message: 'Marcos Silveira aprovou o post "Foto Estúdio: Lote Especial Serra da Mantiqueira".',
    timestamp: '2026-10-26T14:40:00Z',
    read: false,
    type: 'approval',
    postId: 'post-4',
    clientId: 'cli-1',
  },
  {
    id: 'notif-2',
    recipient: 'agency',
    title: 'Ajuste Solicitado',
    message: 'Marcos Silveira solicitou alterações em "Card Informativo: Horários de Feriado & Degustação".',
    timestamp: '2026-10-27T11:00:00Z',
    read: false,
    type: 'changes',
    postId: 'post-3',
    clientId: 'cli-1',
  },
  {
    id: 'notif-3',
    recipient: 'client',
    title: 'Novo Conteúdo Disponível',
    message: 'A agência adicionou 2 novos posts no projeto Lançamento Grãos Especiais Primavera.',
    timestamp: '2026-10-27T10:15:00Z',
    read: true,
    type: 'new_content',
    postId: 'post-1',
    clientId: 'cli-1',
  },
];

export const INITIAL_USERS: AgencyUser[] = [
  {
    id: 'user-owner',
    name: 'Paloma Garcia',
    email: 'jlvpmarketing@gmail.com',
    phone: '11987654321',
    password: '26042008',
    role: 'owner',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    createdAt: '2026-08-01T08:00:00Z',
    lastLogin: '2026-10-28T03:00:00Z',
    status: 'active',
  },
  {
    id: 'user-manager',
    name: 'Camila Rocha (Gerente de Contas)',
    email: 'camila@studiopulse.com.br',
    password: '123',
    role: 'manager',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    createdAt: '2026-08-10T09:00:00Z',
    lastLogin: '2026-10-27T11:30:00Z',
    status: 'active',
  },
  {
    id: 'user-creator',
    name: 'Mariana Social Media (Criadora)',
    email: 'mariana@studiopulse.com.br',
    password: '123',
    role: 'creator',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    createdAt: '2026-09-01T10:00:00Z',
    lastLogin: '2026-10-26T17:10:00Z',
    status: 'active',
  },
  {
    id: 'user-viewer',
    name: 'Carlos Revisor (Visualizador)',
    email: 'carlos@studiopulse.com.br',
    password: '123',
    role: 'viewer',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    createdAt: '2026-09-15T14:00:00Z',
    lastLogin: '2026-10-25T16:00:00Z',
    status: 'active',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-1',
    userId: 'user-owner',
    userName: 'Paloma Garcia',
    userRole: 'owner',
    userEmail: 'jlvpmarketing@gmail.com',
    action: 'client_created',
    details: 'Cadastrou o cliente "Aroma & Grão Cafés Especiais" no sistema.',
    entityName: 'Aroma & Grão',
    timestamp: '2026-09-01T10:00:00Z',
  },
  {
    id: 'log-2',
    userId: 'user-manager',
    userName: 'Camila Rocha',
    userRole: 'manager',
    userEmail: 'camila@studiopulse.com.br',
    action: 'project_created',
    details: 'Criou o projeto "Lançamento Grãos Especiais Primavera 2026" com link de aprovação.',
    entityName: 'Lançamento Grãos Especiais',
    timestamp: '2026-10-10T11:00:00Z',
  },
  {
    id: 'log-3',
    userId: 'user-creator',
    userName: 'Mariana Social Media',
    userRole: 'creator',
    userEmail: 'mariana@studiopulse.com.br',
    action: 'post_created',
    details: 'Adicionou o post carrossel "Carrossel: Guia do Café Especial em 3 Passos" para aprovação.',
    entityName: 'Guia do Café Especial',
    timestamp: '2026-10-27T08:15:00Z',
  },
  {
    id: 'log-4',
    userId: 'client-marcos',
    userName: 'Marcos Silveira (Cliente)',
    userRole: 'viewer',
    userEmail: 'marcos@aromagrao.com.br',
    action: 'post_approved',
    details: 'Aprovou o post "Foto Estúdio: Lote Especial Serra da Mantiqueira".',
    entityName: 'Foto Estúdio Mantiqueira',
    timestamp: '2026-10-26T14:40:00Z',
  },
  {
    id: 'log-5',
    userId: 'client-marcos',
    userName: 'Marcos Silveira (Cliente)',
    userRole: 'viewer',
    userEmail: 'marcos@aromagrao.com.br',
    action: 'post_changes_requested',
    details: 'Solicitou alteração: "Trocar o horário de sábado no texto do card".',
    entityName: 'Card Informativo Horários',
    timestamp: '2026-10-27T11:00:00Z',
  },
];
