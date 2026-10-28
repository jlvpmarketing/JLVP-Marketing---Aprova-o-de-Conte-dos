import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { FolderProject } from '../types';
import { 
  FolderPlus, 
  Folder, 
  FileText, 
  Upload, 
  Trash2, 
  X, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Share2 
} from 'lucide-react';
import { buildWhatsAppUrl } from '../utils/whatsapp';

interface ProjectFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: FolderProject | null;
}

export const ProjectFolderModal: React.FC<ProjectFolderModalProps> = ({ isOpen, onClose, projectToEdit }) => {
  const { 
    selectedClientId, 
    selectedClient, 
    addProject, 
    updateProject, 
    deleteProject,
    addSupportDocToProject,
    deleteSupportDocFromProject,
    addToast,
    agencyConfig
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [name, setName] = useState(projectToEdit ? projectToEdit.name : '');
  const [description, setDescription] = useState(projectToEdit ? projectToEdit.description : '');
  const [status, setStatus] = useState<'active' | 'review' | 'completed'>(projectToEdit ? projectToEdit.status : 'active');

  if (!isOpen) return null;

  // Generate shareable link
  const currentOrigin = window.location.origin;
  const projectAccessKey = projectToEdit ? projectToEdit.clientAccessKey : 'chave-gerada-ao-salvar';
  const approvalLink = `${currentOrigin}/?view=portal&project=${projectAccessKey}`;

  const handleCopyLink = () => {
    if (!projectToEdit) {
      addToast('info', 'Salve a pasta primeiro', 'O link único é gerado após salvar a nova pasta de projeto.');
      return;
    }
    navigator.clipboard.writeText(approvalLink);
    setCopiedLink(true);
    addToast('success', 'Link Copiado!', 'Link único copiado para a área de transferência.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && projectToEdit) {
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      // Read file to data URL so it can be previewed/downloaded
      const reader = new FileReader();
      reader.onload = () => {
        addSupportDocToProject(projectToEdit.id, {
          name: file.name,
          size: sizeStr,
          type: file.type || 'document',
          url: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (projectToEdit) {
      updateProject(projectToEdit.id, {
        name,
        description,
        status,
      });
    } else {
      addProject({
        clientId: selectedClientId,
        name,
        description,
        status,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                {projectToEdit ? 'Editar Pasta de Projeto' : 'Nova Pasta de Projeto'}
              </h3>
              <p className="text-xs text-slate-500">
                Cliente: <span className="font-semibold text-slate-700">{selectedClient?.company}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nome da Pasta */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome da Pasta / Campanha *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Lançamento Primavera 2026, Feed Novembro, Reels Black Friday..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Objetivo ou Descrição do Projeto
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Organização dos 8 posts e 3 reels de divulgação da nova coleção..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Status da Pasta
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'active', label: 'Em Produção', color: 'border-blue-300 bg-blue-50/50 text-blue-800' },
                { id: 'review', label: 'Em Aprovação', color: 'border-amber-300 bg-amber-50/50 text-amber-800' },
                { id: 'completed', label: 'Finalizado', color: 'border-emerald-300 bg-emerald-50/50 text-emerald-800' },
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as 'active' | 'review' | 'completed')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                    status === st.id ? `${st.color} ring-1 ring-offset-1 ring-slate-900 font-semibold` : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Link Único do Projeto para o Cliente */}
          {projectToEdit && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                  Link Único de Aprovação do Cliente
                </span>
                <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {projectToEdit.clientAccessKey}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                O cliente acessa este link direto para revisar posts, ver calendário e aprovar sem precisar criar senha.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={approvalLink}
                  className="flex-1 px-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg text-slate-600 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? 'Copiado!' : 'Copiar'}
                </button>
                {selectedClient?.phone && (
                  <a
                    href={buildWhatsAppUrl(
                      selectedClient.phone,
                      `Olá, ${selectedClient.name}!\nAqui está o link exclusivo para aprovação dos conteúdos do projeto *${projectToEdit.name}*:\n${approvalLink}\n\nQualquer ajuste você pode comentar diretamente por lá!`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                    title="Enviar link via WhatsApp"
                  >
                    <Share2 className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Documentos de Apoio / Suporte */}
          {projectToEdit && (
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Arquivos e Documentos de Suporte ({projectToEdit.supportDocs.length})
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleDocUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  Anexar Arquivo
                </button>
              </div>

              {projectToEdit.supportDocs.length > 0 ? (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {projectToEdit.supportDocs.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{doc.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">({doc.size})</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {doc.url !== '#' && (
                          <a
                            href={doc.url}
                            download={doc.name}
                            className="text-[11px] text-indigo-600 hover:underline px-1.5 py-0.5"
                          >
                            Baixar
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteSupportDocFromProject(projectToEdit.id, doc.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Nenhum briefing ou manual anexado nesta pasta ainda.
                </p>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <div>
              {projectToEdit && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja excluir a pasta "${projectToEdit.name}"? Todos os posts desta pasta serão excluídos.`)) {
                      deleteProject(projectToEdit.id);
                      addToast('info', 'Pasta excluída', `A pasta "${projectToEdit.name}" foi removida.`);
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Pasta</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{ backgroundColor: agencyConfig?.primaryColor || '#000000' }}
                className="px-5 py-2 text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-90 shadow-xs cursor-pointer"
              >
                {projectToEdit ? 'Salvar Alterações' : 'Criar Pasta'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
