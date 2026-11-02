# Plano de Implementação: Correção Definitiva de Carrossel e Sincronização do Portal do Cliente

O objetivo deste plano é resolver os dois problemas críticos reportados pelo usuário:
1. **Publicações de carrossel sumindo do painel:** Ocorre devido a mídias (imagens e vídeos) salvas como strings base64 gigantescas no estado, estourando o limite de armazenamento local (5 MB do localStorage) e falhando ao persistir no servidor.
2. **Publicações antigas de teste aparecendo para o cliente:** Ocorre devido a posts gerados por ferramentas de QA automatizadas no passado que continuam registrados no banco de dados do servidor (`/data/db.json`).

---

## 1. Diagnóstico e Causa Raiz

### Problema 1: Desaparecimento de posts de Carrossel
- Ao enviar imagens e vídeos para um carrossel, as imagens eram mantidas como strings base64 pesadas no array `mediaUrls`.
- Quando `addPost` tentava salvar em `localStorage.setItem(STORAGE_KEYS.POSTS, ...)`, o navegador lançava `QuotaExceededError` (o limite de 5MB por domínio é ultrapassado por um único carrossel com fotos/vídeos).
- A sincronização periódica a cada 3 segundos buscava os posts do servidor; se o envio ao servidor falhasse pelo tamanho excessivo do JSON, o post local desaparecia na primeira atualização ou recarga de página.

### Problema 2: Publicações desconhecidas no Portal do Cliente
- O arquivo `/data/db.json` continha posts de teste gerados por suítes automatizadas anteriores (`QA Reel Video Drive Review`, `explore-test-123`, `TESTE`).
- O usuário solicitou explicitamente a remoção completa dessas publicações de teste para que apenas os dados reais do projeto sejam exibidos.

---

## 2. Mudanças Planejadas

### Etapa 1: Armazenamento Direto de Mídia no Disco do Servidor (`ContentUploadModal.tsx`)
- Ao fazer upload de qualquer arquivo no carrossel (imagem ou vídeo), o arquivo será enviado **imediatamente** para o endpoint `/api/media` do servidor Express.
- O servidor salva o arquivo físico em `/data/media/` e devolve uma URL leve (ex: `/api/media/media_12345.jpg` ou `.mp4`), em vez de guardar a string base64 inteira.
- O post passa a armazenar apenas URLs curtas (dezenas de bytes em vez de dezenas de megabytes).
- Isso elimina 100% dos erros de cota do `localStorage` e permite que o post seja salvo e sincronizado em frações de segundo sem nunca sumir.

### Etapa 2: Limpeza das Publicações de Teste Antigas (`server.ts` e `/data/db.json`)
- Remover do banco de dados `/data/db.json` todas as publicações de teste remanescentes (`post-1793545935875-653xur`, `post-1793543932507-xyxu93`, `post-1793373676264-79aj5d`).
- Criar endpoint de manutenção no servidor para expurgar dados de teste caso necessário.
- No `AppContext.tsx`, garantir que posts de teste antigos sejam ignorados e excluídos do Firestore e do estado local.

### Etapa 3: Blindagem da Página de Aprovação do Cliente (`ClientPortalView.tsx`)
- Isolar com rigor os posts exibidos na página do cliente: apenas publicações cujo `projectId` coincida estritamente com o projeto selecionado (`currentProject.id`) serão exibidas.
- Manter a ordenação crescente por data (`scheduledDate`: dia 2, depois 4, depois 6).

---

## 3. Critérios de Sucesso e Verificação
1. **Adicionar Carrossel com Imagens e Vídeos:** Criar uma publicação no formato carrossel com múltiplas imagens e vídeos; verificar que ela é salva instantaneamente e permanece visível no painel sem sumir ao recarregar a página.
2. **Página do Cliente 100% Limpa e Fiel:** Acessar o link do cliente e verificar que **nenhum** post antigo de teste aparece. Apenas as publicações criadas pelo usuário para aquele projeto estarão visíveis.
3. **Ordenação por Data:** As publicações no portal do cliente aparecem na ordem da data mais próxima para a mais distante.
