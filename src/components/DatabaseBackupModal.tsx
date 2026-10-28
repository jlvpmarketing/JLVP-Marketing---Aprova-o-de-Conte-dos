import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Database, 
  X, 
  Download, 
  Upload, 
  CheckCircle2, 
  Cloud, 
  HardDrive, 
  ShieldCheck, 
  AlertCircle,
  FileJson
} from 'lucide-react';

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({ isOpen, onClose }) => {
  const { 
    clients, 
    projects, 
    posts, 
    users, 
    auditLogs, 
    exportDatabaseBackup, 
    importDatabaseBackup,
    addToast
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseBackup(content);
      setImporting(false);
      if (success) {
        onClose();
      }
    };
    reader.onerror = () => {
      setImporting(false);
      addToast('error', 'Erro', 'Não foi possível ler o arquivo de backup.');
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950 p-6 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
              <Database className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Armazenamento & Banco de Dados
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Segurança e persistência completa de clientes e publicações
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Overview */}
          <div className="space-y-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  Armazenamento Local Persistente
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-medium">ATIVO</span>
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Todas as alterações em clientes, projetos, publicações, comentários e histórico são gravadas e preservadas automaticamente.
                </p>
              </div>
            </div>

            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
              <Cloud className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  Nuvem Firebase Firestore Conectada
                  <span className="text-[10px] bg-indigo-200 text-indigo-900 px-1.5 py-0.5 rounded font-mono font-medium">ONLINE</span>
                </h3>
                <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">
                  Sincronização em tempo real ativada no projeto <code className="font-mono bg-indigo-100 px-1 rounded text-[11px]">rock-mystery-753bd</code> para colaboração entre equipe e clientes.
                </p>
              </div>
            </div>
          </div>

          {/* Database Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-xs text-slate-500 block">Clientes</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{clients.length}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-xs text-slate-500 block">Projetos</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{projects.length}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-xs text-slate-500 block">Publicações</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{posts.length}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-xs text-slate-500 block">Histórico</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-0.5 block">{auditLogs.length}</span>
            </div>
          </div>

          {/* Actions: Export & Import */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-slate-700 block">
              Opções de Backup e Restauração
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={exportDatabaseBackup}
                className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-brand rounded-2xl text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center text-brand mb-2">
                  <Download className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand transition-colors">
                  Exportar Backup (JSON)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Baixe todos os dados em um arquivo seguro no seu computador.
                </p>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-brand rounded-2xl text-left transition-all group cursor-pointer shadow-2xs"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-2">
                  <Upload className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {importing ? 'Restaurando...' : 'Restaurar Backup (JSON)'}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Importe um arquivo de backup para restaurar clientes e posts.
                </p>
              </button>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
