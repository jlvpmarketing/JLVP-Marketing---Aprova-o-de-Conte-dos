import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Client } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { 
  UserPlus, 
  Upload, 
  Trash2, 
  X, 
  Phone, 
  Mail, 
  Sparkles, 
  UserCheck,
  CheckSquare,
  Square
} from 'lucide-react';

interface ClientManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
}

export const ClientManagerModal: React.FC<ClientManagerModalProps> = ({ isOpen, onClose, clientToEdit }) => {
  const { addClient, updateClient, deleteClient, users, agencyConfig, addToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [logo, setLogo] = useState('');
  const [brandColor, setBrandColor] = useState('#4F46E5');
  const [niche, setNiche] = useState('');
  const [notes, setNotes] = useState('');
  const [assignedManagerIds, setAssignedManagerIds] = useState<string[]>([]);

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setCompany(clientToEdit.company || '');
      setEmail(clientToEdit.email || '');
      setPhone(clientToEdit.phone || '');
      setLogo(clientToEdit.logo || '');
      setBrandColor(clientToEdit.brandColor || '#4F46E5');
      setNiche(clientToEdit.niche || '');
      setNotes(clientToEdit.notes || '');
      const initialIds = clientToEdit.assignedManagerIds || (clientToEdit.assignedManagerId ? [clientToEdit.assignedManagerId] : []);
      setAssignedManagerIds(initialIds);
    } else {
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setLogo('');
      setBrandColor('#4F46E5');
      setNiche('');
      setNotes('');
      setAssignedManagerIds([]);
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleManager = (id: string) => {
    setAssignedManagerIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 256, 256, 0.85);
        setLogo(compressed);
        addToast('success', 'Logo atualizada', 'Imagem do cliente otimizada com sucesso.');
      } catch (err) {
        console.warn('Erro ao processar imagem:', err);
      }
    }
  };

  const handleDeleteClient = () => {
    if (!clientToEdit) return;
    if (confirm(`Tem certeza que deseja excluir o cliente "${clientToEdit.company}"? Todas as suas pastas e publicações associadas serão removidas.`)) {
      deleteClient(clientToEdit.id);
      addToast('info', 'Cliente Excluído', `${clientToEdit.company} foi removido.`);
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) {
      addToast('error', 'Campos obrigatórios', 'Preencha o nome da empresa e do contato.');
      return;
    }

    const selectedUsers = users.filter(u => assignedManagerIds.includes(u.id));
    const managerNames = selectedUsers.map(u => u.name);

    if (clientToEdit) {
      updateClient(clientToEdit.id, {
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        logo,
        brandColor,
        niche: niche.trim(),
        notes: notes.trim(),
        assignedManagerIds,
        assignedManagerNames: managerNames,
        assignedManagerId: assignedManagerIds[0] || undefined,
        assignedManagerName: managerNames.join(', ') || undefined,
      });
      addToast('success', 'Cliente Atualizado', `Dados de ${company} foram salvos.`);
    } else {
      addClient({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        phone: phone.trim(),
        logo,
        brandColor,
        niche: niche.trim(),
        notes: notes.trim(),
        assignedManagerIds,
        assignedManagerNames: managerNames,
        assignedManagerId: assignedManagerIds[0] || undefined,
        assignedManagerName: managerNames.join(', ') || undefined,
      });
      addToast('success', 'Cliente Cadastrado', `${company} adicionado à carteira.`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: agencyConfig?.primaryColor || '#000000' }}
            >
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                {clientToEdit ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <p className="text-xs text-slate-500">Defina os dados, múltiplos responsáveis da equipe e WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Logo do Cliente Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Foto / Logo do Cliente
            </label>
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-xs relative"
                style={{ borderColor: brandColor }}
              >
                {logo ? (
                  <img src={logo} alt="Logo Cliente" className="w-full h-full object-cover" />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center font-bold text-white text-lg"
                    style={{ backgroundColor: brandColor }}
                  >
                    {company ? company.charAt(0).toUpperCase() : 'C'}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Subir Logo
                  </button>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => setLogo('')}
                      className="px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Aparecerá nos posts e na área de aprovação do cliente.</p>
              </div>
            </div>
          </div>

          {/* Nome da Empresa e Contato */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Empresa / Marca *</label>
              <input
                type="text"
                required
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Ex: Aroma & Grão Cafés"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Nome do Contato no Cliente *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Marcos Silveira"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Múltiplos Responsáveis Internos pela Conta (Agência) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-zinc-900" />
                Responsáveis pela Conta na Agência (Pode escolher mais de um)
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {assignedManagerIds.length} selecionado(s)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Todos os membros selecionados receberão mensagens automáticas no WhatsApp quando houver atualizações.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
              {users.map(u => {
                const isSelected = assignedManagerIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleManager(u.id)}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-zinc-900 text-white border-black font-semibold shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{u.name}</span>
                    </div>
                    <span className="text-[10px] opacity-75 truncate max-w-[80px]">
                      {u.role === 'owner' ? 'Dona' : u.role === 'manager' ? 'Gerente' : u.role === 'creator' ? 'Criador' : 'Revisor'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contatos WhatsApp e Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" />
                WhatsApp do Cliente (com DDD) *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ex: 11991234567"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Usado para disparar links de aprovação.</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-500" />
                E-mail do Cliente
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="cliente@email.com.br"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
          </div>

          {/* Nicho & Cor da Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-slate-500" />
                Nicho / Segmento
              </label>
              <input
                type="text"
                value={niche}
                onChange={e => setNiche(e.target.value)}
                placeholder="Ex: Cafeteria & Torrefação"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                <span>Cor da Marca</span>
                <span className="font-mono text-[11px] text-slate-400">{brandColor}</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  className="w-8 h-8 rounded-md border border-slate-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  placeholder="#4F46E5"
                  className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Observações / Briefing da Agência */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Observações & Diretrizes da Conta
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Cliente prefere paletas quentes, aprovação sempre até quinta-feira às 18h..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              {clientToEdit && (
                <button
                  type="button"
                  onClick={handleDeleteClient}
                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Cliente</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{ backgroundColor: agencyConfig?.primaryColor || '#000000' }}
                className="px-5 py-2 text-xs font-semibold text-white rounded-xl transition-opacity hover:opacity-90 shadow-xs cursor-pointer"
              >
                {clientToEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
