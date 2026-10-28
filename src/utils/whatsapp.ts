/**
 * WhatsApp Notification & Dispatch Utilities
 */

export function sanitizePhoneNumber(phone: string): string {
  // Remove non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  // Default to Brazil DDI 55 if length is 10 or 11
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `55${cleaned}`;
  }
  return cleaned;
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = sanitizePhoneNumber(phone);
  const encodedText = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export function createNewContentWhatsAppMessage(params: {
  clientName: string;
  projectName: string;
  postTitle: string;
  approvalLink: string;
  agencyName: string;
  scheduledDateFormatted: string;
}): string {
  return `🚀 *Novo Conteúdo para Aprovação!*

Olá, *${params.clientName}*!
A equipe da *${params.agencyName}* acabou de disponibilizar um novo material para sua revisão:

📁 *Projeto:* ${params.projectName}
📌 *Conteúdo:* ${params.postTitle}
📅 *Previsão de Post:* ${params.scheduledDateFormatted}

👉 *Acesse para revisar e aprovar com 1 clique:*
${params.approvalLink}

Qualquer dúvida ou ajuste, você pode comentar diretamente pelo portal.`;
}

export function createApprovedWhatsAppMessage(params: {
  managerName: string;
  clientName: string;
  projectName: string;
  postTitle: string;
  agencyName: string;
}): string {
  return `✅ *Conteúdo APROVADO pelo Cliente!*

Olá *${params.managerName}*,
Ótima notícia! O cliente *${params.clientName}* acabou de aprovar o seguinte material:

📁 *Projeto:* ${params.projectName}
📌 *Post:* ${params.postTitle}
🎉 *Status:* Aprovado e pronto para agendamento!`;
}

export function createChangesRequestedWhatsAppMessage(params: {
  managerName: string;
  clientName: string;
  projectName: string;
  postTitle: string;
  note: string;
}): string {
  return `⚠️ *Ajustes Solicitados pelo Cliente*

Olá *${params.managerName}*,
O cliente *${params.clientName}* solicitou alterações no post:

📁 *Projeto:* ${params.projectName}
📌 *Post:* ${params.postTitle}
📝 *Observações do Cliente:*
"${params.note}"

Acesse o painel da agência para realizar os ajustes solicitados.`;
}

export function createCommentWhatsAppMessage(params: {
  recipientName: string;
  authorName: string;
  projectName: string;
  postTitle: string;
  commentText: string;
  link: string;
}): string {
  return `💬 *Novo Comentário no Post*

Olá, *${params.recipientName}*!
*${params.authorName}* deixou uma nova mensagem no conteúdo:

📁 *Projeto:* ${params.projectName}
📌 *Post:* ${params.postTitle}
💬 *Mensagem:*
"${params.commentText}"

👉 *Ver no portal:* ${params.link}`;
}
