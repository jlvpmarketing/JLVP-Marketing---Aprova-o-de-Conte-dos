import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { compressImage } from '../utils/imageCompressor';
import { 
  User, 
  X, 
  Camera, 
  Upload, 
  Check, 
  ShieldCheck, 
  Briefcase, 
  Mail, 
  Building2, 
  LogOut,
  ChevronRight,
  Trash2,
  AlertCircle
} from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const { 
    isProfileModalOpen, 
    setIsProfileModalOpen, 
    currentUser, 
    updateCurrentUserProfile, 
    clients, 
    posts, 
    openClientDetailPage,
    logout,
    addToast
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [clientFilter, setClientFilter] = useState<'assigned' | 'all'>('assigned');

  if (!isProfileModalOpen || !currentUser) return null;

  // Handle local file upload with compression to prevent app crashes
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      // Compress image to 256x256 max dimensions for avatar
      const compressedDataUrl = await compressImage(file, 256, 256, 0.85);
      updateCurrentUserProfile({ avatarUrl: compressedDataUrl });
      setIsEditingPhoto(false);
      addToast('success', 'Foto Atualizada', 'Sua foto de perfil foi alterada com sucesso.');
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      addToast('error', 'Erro no upload', 'Não foi possível carregar a imagem selecionada.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle URL photo save
  const handleSavePhotoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (photoUrlInput.trim()) {
      updateCurrentUserProfile({ avatarUrl: photoUrlInput.trim() });
      setPhotoUrlInput('');
      setIsEditingPhoto(false);
      addToast('success', 'Foto Atualizada', 'Link da foto salvo.');
    }
  };

  // Remove photo
  const handleRemovePhoto = () => {
    updateCurrentUserProfile({ avatarUrl: undefined });
    setIsEditingPhoto(false);
    addToast('info', 'Foto Removida', 'Foto de perfil removida.');
  };

  // Save personal details
  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: { name?: string; password?: string } = {};
    if (nameInput.trim() && nameInput.trim() !== currentUser.name) {
      updates.name = nameInput.trim();
    }
    if (isOwner && passwordInput.trim()) {
      updates.password = passwordInput.trim();
    }
    if (Object.keys(updates).length > 0) {
      updateCurrentUserProfile(updates);
      setPasswordInput('');
    }
    setIsEditingDetails(false);
  };

  // Calculate responsible clients
  const isOwner = currentUser.role === 'owner';
  
  // Clients assigned directly to this user or where created by this user
  const assignedClients = clients.filter(c => 
    c.assignedManagerId === currentUser.id || 
    c.createdByUserId === currentUser.id ||
    (isOwner && (!c.assignedManagerId || c.assignedManagerId === 'user-owner'))
  );

  const displayClients = isOwner && clientFilter === 'all' ? clients : assignedClients;

  const roleBadge = () => {
    switch (currentUser.role) {
      case 'owner':
        return { label: '👑 Dona da Agência (Acesso Total)', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'manager':
        return { label: '💼 Gerente de Contas', bg: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
      case 'creator':
        return { label: '🎨 Criador de Conteúdo', bg: 'bg-purple-100 text-purple-900 border-purple-300' };
      case 'viewer':
      default:
        return { label: '👁️ Revisor / Visualizador', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header in Solid Pure Black */}
        <div className="relative bg-black p-6 sm:p-8 text-white border-b border-zinc-800">
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar with Camera Icon */}
            <div className="relative group shrink-0">
              <div className="w-22 h-22 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-zinc-900 flex items-center justify-center">
                {currentUser.avatarUrl ? (
                  <img 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.name} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                className="absolute -bottom-2 -right-2 p-2 bg-white text-slate-900 rounded-xl shadow-lg border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer group-hover:scale-105"
                title="Alterar Foto de Perfil"
              >
                <Camera className="w-4 h-4 text-slate-700" />
              </button>
            </div>

            {/* User Meta Info */}
            <div className="text-center sm:text-left min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleBadge().bg}`}>
                  {roleBadge().label}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: {currentUser.id}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white truncate">
                {currentUser.name}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {currentUser.email}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  {isEditingPhoto ? 'Fechar Editor de Foto' : 'Alterar Foto'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNameInput(currentUser.name);
                    setIsEditingDetails(!isEditingDetails);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  {isEditingDetails ? 'Cancelar Edição' : (isOwner ? 'Editar Nome & Senha' : 'Editar Nome')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Editing Drawer (No ready-made photos, only local upload + URL) */}
        {isEditingPhoto && (
          <div className="bg-slate-100 p-5 border-b border-slate-200 animate-in slide-in-from-top-4 duration-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Alterar Foto de Perfil
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Upload local file */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-900 block mb-1">
                  1. Enviar do seu Computador
                </span>
                <p className="text-[11px] text-slate-500 mb-3">
                  Selecione uma imagem (PNG, JPG, WebP). Redimensionamento automático seguro.
                </p>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Processando imagem...' : 'Escolher Arquivo...'}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Option B: Enter image URL */}
              <form onSubmit={handleSavePhotoUrl} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block mb-1">
                    2. Colar Link da Imagem (URL)
                  </span>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Cole o link direto de uma foto na web
                  </p>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={photoUrlInput}
                    onChange={e => setPhotoUrlInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand mb-2"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 pt-1">
                  {currentUser.avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Remover Foto Atual
                    </button>
                  )}
                  <button
                    type="submit"
                    className="ml-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Salvar Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Name & Password Drawer */}
        {isEditingDetails && (
          <form onSubmit={handleSaveDetails} className="bg-slate-50 p-5 border-b border-slate-200 animate-in slide-in-from-top-4 duration-200">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              {isOwner ? 'Editar Dados Pessoais & Senha' : 'Editar Nome de Exibição'}
            </h3>
            <div className={`grid grid-cols-1 ${isOwner ? 'sm:grid-cols-2' : ''} gap-3`}>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-brand"
                  required
                />
              </div>
              {isOwner ? (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nova Senha (opcional)</label>
                  <input
                    type="password"
                    placeholder="Deixe em branco para manter"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-brand"
                  />
                </div>
              ) : (
                <div className="p-3 bg-zinc-100 rounded-xl border border-zinc-200 text-[11px] text-zinc-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-500 shrink-0" />
                  <span>A alteração de senhas é gerenciada exclusivamente pela Dona da Agência (Paloma Garcia).</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingDetails(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        )}

        {/* Section: Clientes sob minha responsabilidade */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand" />
                Clientes sob Minha Responsabilidade ({displayClients.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isOwner 
                  ? 'Como Dona da Agência, você tem supervisão total de todos os clientes cadastrados.' 
                  : 'Contas e clientes atribuídos ao seu acompanhamento e aprovações.'}
              </p>
            </div>

            {/* Filter Toggle for Owner */}
            {isOwner && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setClientFilter('assigned')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    clientFilter === 'assigned'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Minhas Contas ({assignedClients.length})
                </button>
                <button
                  type="button"
                  onClick={() => setClientFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    clientFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos da Agência ({clients.length})
                </button>
              </div>
            )}
          </div>

          {/* Clients List */}
          {displayClients.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-700">Nenhum cliente atribuído no momento</h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                Você pode ser atribuído a clientes pelo gestor ou pela Dona da agência.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {displayClients.map(client => {
                const clientPosts = posts.filter(p => p.clientId === client.id);
                const pendingPosts = clientPosts.filter(p => p.status === 'pending_approval').length;
                const changesPosts = clientPosts.filter(p => p.status === 'changes_requested').length;
                const approvedPosts = clientPosts.filter(p => p.status === 'approved').length;

                return (
                  <div
                    key={client.id}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: client.brandColor || '#3B82F6' }}
                      >
                        {client.company.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {client.company}
                          </h4>
                          {client.assignedManagerName && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200/80 text-slate-700 font-medium">
                              Resp: {client.assignedManagerName.split(' ')[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          Contato: {client.name} · WhatsApp: {client.phone}
                        </p>
                      </div>
                    </div>

                    {/* Stats & Quick Jump */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                      <div className="flex items-center gap-1.5 text-[11px] font-mono">
                        {pendingPosts > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold" title="Para Aprovação">
                            🟡 {pendingPosts}
                          </span>
                        )}
                        {changesPosts > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold" title="Em Alteração">
                            🔴 {changesPosts}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold" title="Aprovados">
                          🟢 {approvedPosts}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileModalOpen(false);
                          openClientDetailPage(client.id);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-900 text-slate-800 hover:text-white border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>Acessar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setIsProfileModalOpen(false);
              logout();
            }}
            className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>

          <button
            type="button"
            onClick={() => setIsProfileModalOpen(false)}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
