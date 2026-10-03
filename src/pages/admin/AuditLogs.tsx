import React, { useState, useEffect } from 'react';
import { History, Search, ShieldCheck, Filter } from 'lucide-react';
import { api } from '../../services/api.ts';
import { AuditLog } from '../../types/index.ts';
import { formatDateTime } from '../../utils/formatters.ts';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const list = await api.getAuditLogs({ module: moduleFilter || undefined });
      setLogs(list);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [moduleFilter]);

  const filtered = logs.filter((l) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      l.user_name.toLowerCase().includes(term) ||
      l.description.toLowerCase().includes(term) ||
      l.action.toLowerCase().includes(term) ||
      (l.affected_record && l.affected_record.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-sky-500" />
          <span>Auditoria Corporativa & Trilha de Atividades</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Registro imutável de todas as ações executadas pelos usuários no sistema da NEXORA GROUP
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por usuário, ação ou descrição..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-hidden"
            >
              <option value="">Todos os módulos</option>
              <option value="vendas">Vendas</option>
              <option value="financeiro">Financeiro</option>
              <option value="estoque">Estoque</option>
              <option value="produtos">Produtos</option>
              <option value="clientes">Clientes</option>
              <option value="usuarios">Usuários</option>
              <option value="configuracoes">Configurações</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Data e Hora</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Ação Realizada</th>
                <th className="px-4 py-3">Descrição Detalhada</th>
                <th className="px-4 py-3">Registro Afetado</th>
                <th className="px-4 py-3">Valor / Alteração</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhum log registrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-500 tabular-nums">
                      {formatDateTime(l.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {l.user_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                        {l.module}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      {l.action}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 font-medium">
                      {l.description}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                      {l.affected_record || '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium tabular-nums">
                      {l.new_value ? (
                        <span>
                          {l.previous_value && <del className="text-slate-400 mr-1.5">{l.previous_value}</del>}
                          <strong className="text-emerald-600 dark:text-emerald-400">{l.new_value}</strong>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
