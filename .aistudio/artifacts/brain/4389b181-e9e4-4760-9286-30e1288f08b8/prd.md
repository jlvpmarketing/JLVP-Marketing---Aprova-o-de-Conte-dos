# Product Requirements Document (PRD) — AprovaFlow

**Versão do Documento:** 1.0.0  
**Data:** Novembro de 2026  
**Status:** Produção / Manutenção Ativa  
**Público-Alvo:** Engenharia de Software, QA / Testes Automatizados, Segurança da Informação (AppSec)

---

## 1. Visão Geral do Produto

O **AprovaFlow** é uma plataforma web full-stack desenvolvida para agências de marketing e publicidade gerenciarem o ciclo completo de criação, agendamento, revisão e aprovação de publicações para redes sociais. 

O diferencial do sistema é o **Portal do Cliente com Link Exclusivo sem Login**: o cliente recebe um link direto no WhatsApp ou e-mail com uma chave de acesso única (`clientAccessKey`), através da qual visualiza o calendário editorial, testa carrosséis e vídeos em formatos nativos (4:5 feed, 9:16 reels/stories), aprova ou solicita ajustes em tempo real, além de interagir via chat geral.

---

## 2. Personas e Papéis de Usuário (RBAC)

| Papel | Nível de Acesso | Descrição e Permissões |
| :--- | :--- | :--- |
| **Owner (Proprietário da Agência)** | Total | Gerencia configurações globais da agência, usuários, clientes, projetos, publicações e logs de auditoria. |
| **Manager (Gerente de Contas)** | Avançado | Gerencia clientes atribuídos, cria projetos, gerencia publicações e interage com os clientes. |
| **Creator (Criador / Designer / Social Media)** | Operacional | Cria e edita publicações, faz upload de mídias, responde a comentários e solicitações de ajuste. |
| **Viewer (Revisor Interno)** | Leitura | Visualiza clientes, projetos e publicações sem permissão de alteração de dados sensíveis. |
| **Cliente Final (Sem Conta / Link Direto)** | Restrito (Portal) | Acessa apenas o projeto associado à sua chave (`?view=portal&project=<KEY>&mode=client`). Pode aprovar, solicitar ajustes, comentar em posts e conversar no chat geral do projeto. |

---

## 3. Arquitetura do Sistema e Stack Tecnológica

### 3.1. Frontend
* **Framework:** React 19 com TypeScript e Vite.
* **Estilização:** Tailwind CSS (tema responsivo com suporte a dark/light mode e presets de cores da agência).
* **Gerenciamento de Estado:** React Context API centralizada (`AppContext`), com hooks modulares e sincronização híbrida.
* **Roteamento:** Orientado a parâmetros de consulta de URL (`window.location.search`) para permitir links diretos compartilháveis sem quebrar o preview do iFrame:
  * Painel da Agência: `/?view=agency`
  * Portal do Cliente: `/?view=portal&project=<KEY>&mode=client`

### 3.2. Backend & Armazenamento
* **Servidor:** Node.js com Express e TypeScript (`server.ts`) rodando na porta 3000.
* **Persistência de Dados Local:** Arquivo JSON em disco (`/data/db.json`).
* **Armazenamento de Mídias em Disco:** Diretório `/data/media/` para cache de imagens pesadas e streaming de vídeos MP4.
* **Sincronização em Nuvem (Opcional/Resiliente):** Google Firebase Firestore com modo offline graceful caso a cota gratuita seja atingida.

---

## 4. Módulos Funcionais e Especificações Detalhadas

### 4.1. Gestão de Clientes e Projetos (Pastas)
* **Cadastro de Clientes:**
  * Dados: ID (`cli-*`), Nome, Razão Social, Nicho, Logo (base64/URL), Cor da Marca, Gestores Atribuídos, Link do Grupo de WhatsApp.
  * Validações: Nome obrigatório, unicidade de ID.
* **Pastas de Projetos:**
  * Dados: ID (`proj-*`), ID do Cliente, Nome (ex: "OUTUBRO"), Descrição, Status (`active`, `review`, `archived`), `clientAccessKey` (slug único para URL, ex: `outubro-rvov`).
  * Geração do Link: `${origin}/?view=portal&project=${clientAccessKey}&mode=client`.

### 4.2. Gestão de Publicações (Posts)
* **Formatos Suportados (`contentTypeFormat`):**
  * `static`: Imagem estática (proporção 4:5 retrato - 1080x1350).
  * `carousel`: Múltiplas lâminas (2 a 10 lâminas), suportando combinação de imagens e vídeos.
  * `reel`: Vídeo vertical em tela cheia (proporção 9:16 vertical).
  * `story`: Vídeo/imagem vertical temporário (proporção 9:16 vertical).
* **Plataformas Alvo:**
  * `instagram_feed`, `instagram_story`, `reels`, `tiktok`, `linkedin`, `facebook`.
* **Fluxo de Estados (`status`):**
  1. `pending_approval` (Para Aprovação): Estado inicial após criação.
  2. `changes_requested` (Em Alteração): Cliente solicitou ajustes com nota explicativa.
  3. `approved` (Aprovado): Cliente ou agência confirmou a publicação.
* **Histórico de Comentários:**
  * Cada post possui uma lista cronológica de comentários com autor (`agency` ou `client`), timestamp e texto.

### 4.3. Streaming e Visualização de Vídeos (Google Drive & Local)
* **Problema Resolvido:** O preview iframe padrão do Google Drive posiciona botões gigantes de play e a barra de tempo no centro da tela em smartphones, além de gerar erros de visualização.
* **Solução Implementada:**
  * O servidor faz streaming com suporte a `HTTP 206 Partial Content` (Range Requests) via endpoint `/api/drive-video/:fileId`.
  * Cache em disco no servidor em `/data/media/drive_<fileId>.mp4`.
  * Player nativo HTML5 com atributos `playsInline`, `controls` e `controlsList="nodownload"`. A barra de progresso fica estritamente na base inferior, mantendo a tela limpa.
  * Botão de contingência para abrir diretamente no Google Drive via link compartilhado (`https://drive.google.com/file/d/<fileId>/view?usp=sharing`).

### 4.4. Chat Geral e Central de Notificações
* **Chat Geral do Projeto:**
  * Mensagens em tempo real entre a agência e o cliente para o projeto ativo.
  * Campo de busca textual rápida para filtrar mensagens no histórico da conversa.
* **Notificações:**
  * Drawer de notificações no portal e no painel da agência com badges sonoros e push nativo no navegador.
  * Notificações emitidas ao: aprovar post, solicitar alteração, adicionar comentário ou enviar mensagem no chat.

### 4.5. Calendário Editorial
* Grade mensal e semanal interativa mostrando os posts pela data agendada (`scheduledDate`).
* Filtro por status (`pending_approval`, `changes_requested`, `approved`) e mês de referência.

---

## 5. Especificação dos Endpoints da API (Backend Express)

### `GET /api/sync`
* **Finalidade:** Retorna o estado completo do banco de dados para inicialização imediata e recuperação pós-offline.
* **Resposta 200 OK:**
  ```json
  {
    "clients": [...],
    "projects": [...],
    "posts": [...],
    "users": [...],
    "notifications": [...],
    "updatedAt": "2026-10-31T12:00:00Z"
  }
  ```

### `GET /api/posts` e `POST /api/posts`
* **GET:** Retorna a lista de todas as publicações salvas no servidor.
* **POST:** Salva ou atualiza uma publicação completa (título, lâminas, status, comentários).

### `POST /api/media`
* **Finalidade:** Recebe arquivos em base64 (vídeos MP4/MOV ou fotos JPEG/PNG), salva em disco `/data/media/` e retorna uma URL estática acessível `/api/media/<nome>.mp4`.

### `GET /api/media/:fileName`
* **Finalidade:** Servir arquivos com suporte a cabeçalhos `Range: bytes=start-end` para streaming progressivo no iOS/Android (Status 206 Partial Content).

### `GET /api/drive-video/:fileId`
* **Finalidade:** Proxy inteligente e cache local de vídeos do Google Drive.
* **Cabeçalhos de Resposta Requeridos:**
  * `Content-Type: video/mp4`
  * `Accept-Ranges: bytes`
  * `Access-Control-Allow-Origin: *`
  * `Content-Range: bytes <start>-<end>/<total>`

---

## 6. Modelo de Dados (TypeScript Interfaces)

```typescript
export type ContentStatus = 'pending_approval' | 'changes_requested' | 'approved';
export type ContentTypeFormat = 'static' | 'carousel' | 'reel' | 'story';
export type MediaType = 'image' | 'carousel' | 'video' | 'drive_video' | 'document';
export type SocialPlatform = 'instagram_feed' | 'instagram_story' | 'reels' | 'tiktok' | 'linkedin' | 'facebook';

export interface Client {
  id: string; // Ex: cli-1793289562170
  name: string;
  company: string;
  email?: string;
  phone?: string;
  logo?: string;
  brandColor?: string;
  niche?: string;
  notes?: string;
  whatsappGroupLink?: string;
  assignedManagerId?: string;
  assignedManagerIds?: string[];
  assignedManagerName?: string;
  createdAt: string;
}

export interface FolderProject {
  id: string; // Ex: proj-1793298881846
  clientId: string;
  name: string;
  description?: string;
  status: 'active' | 'review' | 'archived';
  clientAccessKey: string; // Ex: outubro-rvov
  createdAt: string;
  supportDocs?: any[];
}

export interface PostContent {
  id: string; // Ex: post-1793373676264-79aj5d
  clientId: string;
  projectId: string;
  title: string;
  caption: string;
  contentType: ContentTypeFormat;
  mediaType: MediaType;
  platforms: SocialPlatform[];
  status: ContentStatus;
  scheduledDate: string; // ISO ou YYYY-MM-DDTHH:mm
  mediaUrls: string[]; // URLs locais, hosted, ou Google Drive
  driveVideoUrl?: string;
  comments: CommentItem[];
  createdAt: string;
  updatedAt?: string;
}
```

---

## 7. Matriz de Testes Automatizados & Casos de Teste (QA)

### 7.1. Testes Funcionais (E2E / Integração)
| ID | Caso de Teste | Pré-condição | Passos | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Carregamento imediato do Portal do Cliente | Chave válida `outubro-rvov` | Acessar `/?view=portal&project=outubro-rvov&mode=client` em navegador anônimo (sem cache). | Página carrega em menos de 1 segundo com título do projeto, lista de publicações e sem travar no modal "Carregando projeto...". |
| **TC-02** | Isolamento de Dados entre Clientes | Dois clientes distintos no banco | Acessar o link do Cliente A. | O cliente não deve conseguir visualizar posts, pastas ou notificações do Cliente B. |
| **TC-03** | Aprovação de Publicação pelo Cliente | Post com status `pending_approval` | Clicar em "Aprovar Conteúdo" no card ou no modal de detalhe. | Status muda para `approved`, badge verde é exibido, notificação é gerada para a agência. |
| **TC-04** | Solicitação de Ajuste com Nota | Post com status `pending_approval` | Clicar em "Solicitar Alteração", digitar nota e confirmar. | Status muda para `changes_requested`, post vai para a aba "Em Alteração" e o histórico registra a nota. |
| **TC-05** | Navegação em Carrossel Misto (Imagens + Vídeo) | Post carrossel com 5 lâminas | Clicar nas setas de navegação do carrossel no card e no modal. | As lâminas mudam de forma reativa sem reiniciar o carrossel do zero e sem travar a reprodução do vídeo. |
| **TC-06** | Botão Voltar no Celular (PopState) | Modal de detalhe ou chat aberto | Pressionar o botão físico/gesto de "Voltar" do smartphone. | Fecha o modal aberto e mantém o usuário no projeto, sem sair do aplicativo. |
| **TC-07** | Confirmação de Saída do App | Na tela raiz do projeto no celular | Pressionar o botão de voltar do celular. | Exibe modal de confirmação: *"Deseja mesmo sair do aplicativo?"*. |
| **TC-08** | Busca no Chat Geral | Chat com múltiplas mensagens | Digitar termo no campo de busca do chat. | Filtra imediatamente as mensagens que contêm o termo pesquisado. |

---

## 8. Requisitos de Segurança & Vulnerabilidades a Testar (AppSec)

### 8.1. Vetores de Segurança Críticos
1. **Controle de Acesso Quebrado (Broken Access Control - BOLA/IDOR):**
   * *Risco:* Manipular o parâmetro `project=` na URL para tentar acessar pastas de outros clientes.
   * *Mitigação esperada:* A chave de acesso `clientAccessKey` é aleatória/slug exclusivo. A API `/api/posts` e a renderização do portal devem filtrar estritamente pelo `projectId` associado à chave fornecida.
2. **Cross-Site Scripting (XSS Armazenado):**
   * *Risco:* Injeção de scripts maliciosos nos campos `title`, `caption`, `text` de comentários ou notas de solicitação de ajuste.
   * *Mitigação esperada:* O React realiza escape automático de strings no JSX. Nenhuma propriedade `dangerouslySetInnerHTML` deve ser utilizada sem sanitização via DOMPurify.
3. **Validação e Limitação de Upload de Arquivos:**
   * *Risco:* Upload de arquivos maliciosos (executáveis, scripts) ou arquivos massivos que esgotem o espaço em disco do servidor via `/api/media`.
   * *Mitigação esperada:* Verificação de Content-Type/extensão (permitir apenas MP4, MOV, WEBP, JPEG, PNG) e limite de tamanho por requisição (máx. 150 MB).
4. **Range Request Denial of Service (ReDoS / Range Attack):**
   * *Risco:* Envio de múltiplos cabeçalhos `Range: bytes=0-` malformados para causar saturação de memória ou loops no streaming do Node.js.
   * *Mitigação esperada:* Validação rígida dos parâmetros de início e fim no parser de Range do `server.ts`.
5. **Vazamento de Credenciais e Senhas da Agência:**
   * *Risco:* O endpoint `/api/sync` trafegar o campo `password` dos usuários em texto claro para clientes externos no portal.
   * *Mitigação esperada:* O portal do cliente não deve renderizar nem expor senhas administrativas nos payloads JSON consumidos pelo navegador do cliente.

---

## 9. Métricas de Desempenho e SLA

* **Tempo de Primeira Renderização (FCP) do Portal:** < 800ms em redes 4G móveis.
* **Latência de Streaming de Vídeo:** Primeira fatura de áudio/vídeo reproduzida em < 1.5s via HTTP 206.
* **Taxa de Disponibilidade (Uptime):** 99.9% com suporte total a funcionamento offline resiliente quando APIs externas falharem.
* **Compatibilidade de Dispositivos:** Safari Mobile (iOS 15+), Chrome Mobile (Android 10+), Desktop (Chrome, Safari, Firefox, Edge).
