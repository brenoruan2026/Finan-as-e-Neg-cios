import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  Building2,
  Sliders,
  Database,
  CheckCircle,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { CompanySettings } from '../../types/index.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { formatDateTime } from '../../utils/formatters.ts';
import { NexoraLogo } from '../../components/NexoraLogo.tsx';

export const SettingsPage: React.FC = () => {
  const { success, error } = useToast();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setIsSaving(true);
      await api.updateSettings(settings);
      success('Configurações da empresa salvas com sucesso!');
    } catch (err: any) {
      error(err.message || 'Erro ao salvar configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    window.open('/api/backup/export', '_blank');
    success('Download do backup do banco de dados iniciado!');
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/backup/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('nexora_auth_token')}`,
          },
          body: JSON.stringify(json),
        });
        if (!res.ok) throw new Error('Falha ao restaurar banco.');
        success('Banco de dados restaurado com sucesso! A página será atualizada.');
        setTimeout(() => window.location.reload(), 1500);
      } catch (err: any) {
        error(err.message || 'Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading || !settings) {
    return <div className="h-48 flex items-center justify-center text-xs text-slate-400">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-sky-500" />
          <span>Configurações Corporativas da NEXORA GROUP</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Dados cadastrais da pessoa jurídica, preferências operacionais e cópia de segurança
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Company Identity */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Building2 className="w-4 h-4 text-sky-500" />
              <span>Dados Cadastrais da Empresa</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Logo Oficial Nexora Ativo</span>
              </span>
            </div>
          </div>

          {/* Logo Showcase */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
                <NexoraLogo size="lg" variant="badge" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">NEXORA GROUP</h4>
                <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold">Identidade Visual & Marca Registrada</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Vetor SVG oficial com acabamento metálico em alta resolução</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Razão Social
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={settings.trade_name}
                onChange={(e) => setSettings({ ...settings, trade_name: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CNPJ
              </label>
              <input
                type="text"
                value={settings.cnpj}
                onChange={(e) => setSettings({ ...settings, cnpj: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telefone Sede
              </label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail Institucional
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Endereço da Sede
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cidade / UF
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                  className="w-2/3 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
                />
                <input
                  type="text"
                  maxLength={2}
                  value={settings.state}
                  onChange={(e) => setSettings({ ...settings, state: e.target.value.toUpperCase() })}
                  className="w-1/3 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden text-center uppercase font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operating Preferences */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
            <Sliders className="w-4 h-4 text-sky-500" />
            <span>Regras Operacionais & Parâmetros</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Comissão Padrão dos Sócios / Vendedores (%)
              </label>
              <input
                type="number"
                value={settings.system_preferences.defaultCommissionPercentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    system_preferences: {
                      ...settings.system_preferences,
                      defaultCommissionPercentage: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Alerta de Limite Mínimo de Estoque Padrão (Unidades)
              </label>
              <input
                type="number"
                value={settings.system_preferences.lowStockThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    system_preferences: {
                      ...settings.system_preferences,
                      lowStockThreshold: parseInt(e.target.value, 10) || 5,
                    },
                  })
                }
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Backup and Restore Box */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
          <Database className="w-4 h-4 text-emerald-500" />
          <span>Backup & Segurança do Banco de Dados</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Exporte um snapshot completo com todas as tabelas (usuários, financeiro, vendas, produtos, fornecedores e auditoria) ou restaure a partir de um arquivo JSON confiável.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Fazer Download do Backup (.json)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-sky-500" />
            <span>Restaurar Backup do Banco</span>
            <input type="file" accept=".json" onChange={handleRestoreBackup} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};
