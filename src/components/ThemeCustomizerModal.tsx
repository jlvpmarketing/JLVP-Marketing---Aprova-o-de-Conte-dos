import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { THEME_COLOR_PRESETS } from '../utils/initialData';
import { applyThemeToDocument } from '../utils/themeHelper';
import { Palette, Upload, Trash2, Check, X, Shield, Phone, Mail, User } from 'lucide-react';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { agencyConfig, updateAgencyConfig } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    agencyName: agencyConfig.agencyName,
    agencyLogo: agencyConfig.agencyLogo,
    primaryColor: agencyConfig.primaryColor,
    accountManagerName: agencyConfig.accountManagerName,
    accountManagerPhone: agencyConfig.accountManagerPhone,
    accountManagerEmail: agencyConfig.accountManagerEmail,
  });

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, agencyLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (newColor: string) => {
    setFormData(prev => ({ ...prev, primaryColor: newColor }));
    applyThemeToDocument(newColor);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAgencyConfig(formData);
    onClose();
  };

  const handleCancel = () => {
    applyThemeToDocument(agencyConfig.primaryColor, agencyConfig.accentColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-light text-brand flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-base">Identidade Visual & Configurações</h3>
              <p className="text-xs text-slate-500">Personalize as cores da marca, logo da agência e dados do gerente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Logo da Agência */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Logo da Agência
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {formData.agencyLogo ? (
                  <img src={formData.agencyLogo} alt="Logo Agência" className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-7 h-7 text-slate-300" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Subir Foto / Logo
                  </button>
                  {formData.agencyLogo && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, agencyLogo: '' }))}
                      className="px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remover
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">PNG, SVG ou JPG até 2MB. Aparece nos relatórios e no portal do cliente.</p>
              </div>
            </div>
          </div>

          {/* Nome da Agência */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome da Agência
            </label>
            <input
              type="text"
              required
              value={formData.agencyName}
              onChange={e => setFormData(prev => ({ ...prev, agencyName: e.target.value }))}
              placeholder="Ex: Studio Pulse MKT"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Paleta de Cores e Personalização */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Cor Principal do Sistema
              </label>
              <span className="text-xs font-mono text-slate-500">{formData.primaryColor}</span>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
              {THEME_COLOR_PRESETS.map(preset => {
                const isSelected = formData.primaryColor.toLowerCase() === preset.primary.toLowerCase();
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleColorChange(preset.primary)}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center transition-all border cursor-pointer ${
                      isSelected ? 'ring-2 ring-offset-2 ring-slate-900 border-transparent shadow-xs' : 'border-slate-200 hover:border-slate-300'
                    }`}
                    style={{ backgroundColor: preset.primary }}
                    title={preset.name}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white drop-shadow-xs" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Hex input */}
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={e => handleColorChange(e.target.value)}
                className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={e => handleColorChange(e.target.value)}
                placeholder="#6366F1"
                className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>

          {/* Dados do Gerente de Contas */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Gerente de Contas Responsável
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Nome do Gerente</label>
                <input
                  type="text"
                  value={formData.accountManagerName}
                  onChange={e => setFormData(prev => ({ ...prev, accountManagerName: e.target.value }))}
                  placeholder="Ex: Camila Rocha"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  WhatsApp para Notificações
                </label>
                <input
                  type="text"
                  value={formData.accountManagerPhone}
                  onChange={e => setFormData(prev => ({ ...prev, accountManagerPhone: e.target.value }))}
                  placeholder="Ex: 11987654321"
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-500" />
                E-mail de Contato
              </label>
              <input
                type="email"
                value={formData.accountManagerEmail}
                onChange={e => setFormData(prev => ({ ...prev, accountManagerEmail: e.target.value }))}
                placeholder="gerente@agencia.com.br"
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-brand hover:bg-brand-hover rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
