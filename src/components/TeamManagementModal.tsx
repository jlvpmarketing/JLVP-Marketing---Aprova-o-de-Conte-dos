import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AgencyUser, UserRole } from '../types';
import { 
  Users, 
  UserPlus, 
  X, 
  Key, 
  Mail, 
  Phone,
  User as UserIcon, 
  Copy, 
  Check, 
  Trash2, 
  Edit2, 
  AlertCircle,
  Building2,
  CheckSquare,
  Square,
  Send,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/whatsapp';

const ROLE_DEFINITIONS: Record<UserRole, { label: string; badge: string; desc: string; icon: string }> = {
  owner: {
    label: 'Dona da Agência (Acesso Total)',
    badge: 'bg-amber-100 text-amber-950 border-amber-300',
    desc: 'Controle irrestrito: gerencia equipe e acessos, cadastra clientes, edita identidade visual e exporta banco de dados.',
    icon: '👑',
  },
  manager: {
    label: 'Gerente de Contas',
    badge: 'bg-blue-100 text-blue-950 border-blue-300',
    desc: 'Cadastra e edita clientes, cria pastas de projetos, insere posts, aprova demandas e envia links pelo WhatsApp.',
    icon: '💼',
  },
  creator: {
    label: 'Criador de Conteúdo / Social Media',
    badge: 'bg-purple-100 text-purple-950 border-purple-300',
    desc: 'Cria posts, envia artes/vídeos, edita legendas, adiciona comentários e acompanha aprovações.',
    icon: '🎨',
  },
  viewer: {
    label: 'Visualizador / Revisor',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    desc: 'Acesso somente-leitura: visualiza demandas, calendário e comentários sem permissão de exclusão ou alteração de clientes.',
    icon: '👁️',
  },
};

export const TeamManagementModal: React.FC = () => {
  const { 
    isTeamModalOpen, 
    setIsTeamModalOpen, 
    users, 
    createUser, 
    updateUser, 
    deleteUser, 
    currentUser, 
    clients,
    updateClient,
    agencyConfig,
    addToast 
  } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [welcomeModalUser, setWelcomeModalUser] = useState<AgencyUser | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState<UserRole>('manager');
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [formError, setFormError] = useState('');

  if (!isTeamModalOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('123456');
    setRole('manager');
    setSelectedClientIds([]);
    setFormError('');
    setIsAdding(false);
    setEditingUserId(null);
  };

  const handleStartEdit = (user: AgencyUser) => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setPassword(user.password || '123456');
    setRole(user.role);
    setEditingUserId(user.id);
    
    // Find all clients assigned to this user (supports multiple managers)
    const assigned = clients
      .filter(c => (c.assignedManagerIds?.includes(user.id) || c.assignedManagerId === user.id))
      .map(c => c.id);
    setSelectedClientIds(assigned);

    setIsAdding(true);
    setFormError('');
  };

  const toggleClientSelection = (clientId: string) => {
    setSelectedClientIds(prev => 
      prev.includes(clientId) ? prev.filter(id => id !== clientId) : [...prev, clientId]
    );
  };

  const handleSendWelcomeEmail = (user: AgencyUser) => {
    const subject = encodeURIComponent(`Boas-vindas à equipe ${agencyConfig.agencyName} - Seus dados de acesso`);
    const userClients = clients
      .filter(c => (c.assignedManagerIds?.includes(user.id) || c.assignedManagerId === user.id))
      .map(c => c.company)
      .join(', ');

    const senderName = currentUser?.name || 'Paloma Garcia';
    const senderEmail = currentUser?.email || 'jlvpmarketing@gmail.com';

    const bodyText = `Olá ${user.name},\n\nSeja muito bem-vindo(a) à equipe da ${agencyConfig.agencyName}!\n\nSeu acesso ao sistema foi criado:\n\n🔗 Link do Sistema: ${window.location.origin}\n📧 E-mail de Login: ${user.email}\n🔑 Senha: ${user.password || '123456'}\n💼 Nível de Acesso: ${ROLE_DEFINITIONS[user.role]?.label || user.role}${userClients ? `\n📌 Clientes sob sua responsabilidade: ${userClients}` : ''}\n\nPara acessar, abra o link acima e faça login com suas credenciais.\n\nQualquer dúvida, fale com ${senderName}!\n\nAtenciosamente,\n${senderName}\n${senderEmail}`;
    const body = encodeURIComponent(bodyText);

    // Open directly in Gmail Web using the logged in account
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(user.email)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
    addToast('success', 'Gmail Aberto!', `Abrindo seu Gmail (${senderEmail}) para enviar o e-mail de boas-vindas para ${user.name}.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !email.trim()) {
      setFormError('Preencha o nome e o e-mail do colaborador.');
      return;
    }

    let targetUserId = editingUserId;

    if (editingUserId) {
      updateUser(editingUserId, { name: name.trim(), email: email.trim(), phone: phone.trim(), password, role });
      addToast('success', 'Colaborador atualizado', `Dados de ${name} salvos com sucesso.`);
    } else {
      // Check duplicate email
      if (users.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
        setFormError('Já existe um colaborador cadastrado com este e-mail.');
        return;
      }

      const newUser = createUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim() || '123456',
        role,
        status: 'active',
      });
      targetUserId = newUser.id;
      addToast('success', 'Colaborador cadastrado', `Conta criada para ${name}.`);

      // Open welcome email modal / prompt
      setWelcomeModalUser(newUser);
    }

    // Sync client assignments with MULTIPLE MANAGERS support:
    // Adding this user does NOT remove other existing managers from the client!
    if (targetUserId) {
      clients.forEach(c => {
        const isSelected = selectedClientIds.includes(c.id);
        const currentIds = c.assignedManagerIds || (c.assignedManagerId ? [c.assignedManagerId] : []);
        const currentNames = c.assignedManagerNames || (c.assignedManagerName ? [c.assignedManagerName] : []);
        const alreadyIncluded = currentIds.includes(targetUserId!);

        if (isSelected && !alreadyIncluded) {
          const newIds = [...currentIds, targetUserId!];
          const newNames = [...currentNames, name.trim()];
          updateClient(c.id, {
            assignedManagerIds: newIds,
            assignedManagerNames: newNames,
            assignedManagerId: newIds[0],
            assignedManagerName: newNames.join(', '),
          });
        } else if (!isSelected && alreadyIncluded) {
          const newIds = currentIds.filter(id => id !== targetUserId);
          const newNames = currentNames.filter((_, idx) => currentIds[idx] !== targetUserId);
          updateClient(c.id, {
            assignedManagerIds: newIds,
            assignedManagerNames: newNames,
            assignedManagerId: newIds[0] || undefined,
            assignedManagerName: newNames.join(', ') || undefined,
          });
        }
      });
    }

    resetForm();
  };

  const handleCopyCredentials = (user: AgencyUser) => {
    const userClients = clients
      .filter(c => (c.assignedManagerIds?.includes(user.id) || c.assignedManagerId === user.id))
      .map(c => c.company)
      .join(', ');
    const text = `*Acesso ao Sistema AprovaFlow - ${agencyConfig.agencyName}*\n\nOlá, ${user.name}!\nVocê foi cadastrado na nossa agência com o nível *${ROLE_DEFINITIONS[user.role].label}*.\n\n🔗 Link: ${window.location.origin}\n📧 E-mail: ${user.email}\n🔑 Senha: ${user.password || '123456'}${userClients ? `\n📌 Clientes sob sua responsabilidade: ${userClients}` : ''}\n\nQualquer dúvida, fale com a Paloma Garcia!`;
    navigator.clipboard.writeText(text);
    setCopiedId(user.id);
    addToast('success', 'Dados Copiados!', `Credenciais de ${user.name} prontas para enviar.`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-black p-6 text-white border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: agencyConfig?.primaryColor || '#000000', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Responsáveis & Equipe
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Dona da Agência
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cadastre membros com WhatsApp, e-mail, senha, e vincule seus clientes.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTeamModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Top Bar with Add Button */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Colaboradores Cadastrados ({users.length})
              </h3>
              <p className="text-xs text-slate-500">
                Recebem avisos automáticos no WhatsApp sobre atualizações dos seus clientes.
              </p>
            </div>

            {!isAdding && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                style={{ backgroundColor: agencyConfig?.primaryColor || '#000000' }}
                className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-opacity hover:opacity-90 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Adicionar Responsável</span>
              </button>
            )}
          </div>

          {/* New / Edit User Form */}
          {isAdding && (
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-zinc-900" />
                  {editingUserId ? 'Editar Dados do Responsável' : 'Cadastrar Novo Responsável'}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nome Completo *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="ex: Lucas Andrade"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      E-mail de Login *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ex: lucas@agencia.com"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* WhatsApp with DDD */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp do Responsável (com DDD)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="ex: 11991234567"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Receberá mensagens com atualizações e aprovações dos seus clientes.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Senha de Acesso *
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="ex: 123456"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-zinc-400 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nível de Acesso *
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                  >
                    <option value="manager">💼 Gerente de Contas (Cria clientes e aprova)</option>
                    <option value="creator">🎨 Criador / Social Media (Cria e edita posts)</option>
                    <option value="viewer">👁️ Visualizador / Revisor (Apenas visualização)</option>
                    <option value="owner">👑 Dona da Agência (Acesso irrestrito)</option>
                  </select>
                </div>

                {/* Role Description Preview */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs flex items-start gap-2.5">
                  <span className="text-lg">{ROLE_DEFINITIONS[role].icon}</span>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {ROLE_DEFINITIONS[role].label}
                    </span>
                    <span className="text-slate-500 text-[11px] leading-relaxed">
                      {ROLE_DEFINITIONS[role].desc}
                    </span>
                  </div>
                </div>

                {/* Bi-directional Client Assignment Checklist (Multi-manager supported) */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-zinc-900" />
                      Clientes sob a responsabilidade deste colaborador
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {selectedClientIds.length} selecionado(s)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Marque os clientes atribuídos a este membro. Um cliente pode ter múltiplos responsáveis simultaneamente.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 bg-white border border-slate-200 rounded-xl">
                    {clients.length === 0 ? (
                      <p className="text-xs text-slate-400 p-2 col-span-2 italic">
                        Nenhum cliente cadastrado no momento.
                      </p>
                    ) : (
                      clients.map(client => {
                        const isSelected = selectedClientIds.includes(client.id);
                        return (
                          <div
                            key={client.id}
                            onClick={() => toggleClientSelection(client.id)}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-zinc-900 text-white border-black font-semibold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">{client.company}</span>
                            </div>
                            <span className="text-[10px] opacity-75 truncate max-w-[90px]">
                              {client.name}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: agencyConfig?.primaryColor || '#000000' }}
                    className="px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs cursor-pointer active:scale-95 transition-opacity hover:opacity-90"
                  >
                    {editingUserId ? 'Salvar Alterações' : 'Criar Conta e Atribuir Clientes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Members List */}
          <div className="space-y-3">
            {users.map(u => {
              const roleMeta = ROLE_DEFINITIONS[u.role] || ROLE_DEFINITIONS.viewer;
              const isMe = currentUser?.id === u.id;
              const userClients = clients.filter(c => (c.assignedManagerIds?.includes(u.id) || c.assignedManagerId === u.id));

              return (
                <div 
                  key={u.id}
                  className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0 border border-slate-200">
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {u.name}
                        </span>
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            (Você)
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleMeta.badge}`}>
                          {roleMeta.icon} {roleMeta.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1 flex-wrap">
                        <span className="truncate">{u.email}</span>
                        {u.phone && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {u.phone}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span>Senha: {u.password || '••••••'}</span>
                      </div>

                      {/* Assigned Clients Pills */}
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-semibold">Clientes ({userClients.length}):</span>
                        {userClients.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic">Nenhum cliente vinculado</span>
                        ) : (
                          userClients.map(c => (
                            <span 
                              key={c.id} 
                              className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 border border-zinc-200 text-[10px] font-medium"
                            >
                              {c.company}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 flex-wrap">
                    {/* Send Welcome Email */}
                    <button
                      type="button"
                      onClick={() => handleSendWelcomeEmail(u)}
                      className="p-1.5 rounded-xl border border-slate-200 hover:border-black text-[11px] font-semibold text-slate-700 hover:text-black transition-all flex items-center gap-1 cursor-pointer bg-white"
                      title="Enviar e-mail de boas-vindas com link e senha"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden md:inline">E-mail</span>
                    </button>

                    {/* WhatsApp link if user has phone */}
                    {u.phone && (
                      <a
                        href={buildWhatsAppUrl(u.phone, `Olá ${u.name}! Paloma Garcia falando pela ${agencyConfig.agencyName}. Seu acesso ao sistema está disponível em: ${window.location.origin}\nLogin: ${u.email}\nSenha: ${u.password || '123456'}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl border border-emerald-200 hover:border-emerald-500 bg-emerald-50 text-[11px] font-semibold text-emerald-800 transition-all flex items-center gap-1 cursor-pointer"
                        title="Enviar credenciais via WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden md:inline">WhatsApp</span>
                      </a>
                    )}

                    {/* Copy Credentials Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyCredentials(u)}
                      className="px-2 py-1.5 rounded-xl border border-slate-200 hover:border-black text-[11px] font-semibold text-slate-700 hover:text-black transition-all flex items-center gap-1 cursor-pointer bg-white"
                      title="Copiar dados para enviar ao colaborador"
                    >
                      {copiedId === u.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEdit(u)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {u.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja remover o acesso de ${u.name}?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remover acesso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Welcome Email Modal prompt after creating new user */}
        {welcomeModalUser && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Responsável Cadastrado!</h3>
                  <p className="text-xs text-slate-500">Envie agora o e-mail de boas-vindas com as credenciais.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5 font-mono">
                <p><strong>Nome:</strong> {welcomeModalUser.name}</p>
                <p><strong>E-mail:</strong> {welcomeModalUser.email}</p>
                <p><strong>Senha:</strong> {welcomeModalUser.password || '123456'}</p>
                <p><strong>Link:</strong> {window.location.origin}</p>
                {welcomeModalUser.phone && <p><strong>WhatsApp:</strong> {welcomeModalUser.phone}</p>}
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSendWelcomeEmail(welcomeModalUser);
                    setWelcomeModalUser(null);
                  }}
                  className="w-full py-2.5 px-4 bg-black hover:bg-zinc-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Mail className="w-4 h-4 text-rose-400" />
                  <span>Enviar pelo Gmail Web ({currentUser?.email || 'jlvpmarketing@gmail.com'})</span>
                </button>

                {welcomeModalUser.phone && (
                  <a
                    href={buildWhatsAppUrl(welcomeModalUser.phone, `Olá ${welcomeModalUser.name}!\nVocê foi cadastrado na ${agencyConfig.agencyName}.\n\n🔗 Link: ${window.location.origin}\n📧 E-mail: ${welcomeModalUser.email}\n🔑 Senha: ${welcomeModalUser.password || '123456'}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setWelcomeModalUser(null)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Credenciais pelo WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleCopyCredentials(welcomeModalUser);
                    setWelcomeModalUser(null);
                  }}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Dados de Acesso</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setWelcomeModalUser(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
