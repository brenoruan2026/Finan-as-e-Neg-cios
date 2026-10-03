import React, { useState, useEffect } from 'react';
import { Tags, Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { api } from '../../services/api.ts';
import { FinancialCategory } from '../../types/index.ts';
import { Modal } from '../../components/Modal.tsx';
import { useToast } from '../../context/ToastContext.tsx';

export const Categories: React.FC = () => {
  const { success, error } = useToast();
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newCat, setNewCat] = useState({
    name: '',
    type: 'despesa' as 'receita' | 'despesa',
    color: '#0284c7',
  });

  const loadData = async () => {
    try {
      const list = await api.getCategories();
      setCategories(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name) {
      error('Informe o nome da categoria.');
      return;
    }

    try {
      await api.createCategory(newCat.name, newCat.type, newCat.color);
      success('Categoria criada com sucesso!');
      setShowModal(false);
      setNewCat({ name: '', type: 'despesa', color: '#0284c7' });
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao criar categoria.');
    }
  };

  const revenueCategories = categories.filter((c) => c.type === 'receita');
  const expenseCategories = categories.filter((c) => c.type === 'despesa');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Tags className="w-6 h-6 text-sky-500" />
            <span>Categorias Financeiras</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Plano de contas gerencial para classificação de receitas e despesas
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Receitas */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 font-bold text-xs text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft className="w-4 h-4" />
            <span>Categorias de Receitas ({revenueCategories.length})</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {revenueCategories.map((c) => (
              <div key={c.id} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c.color || '#16a34a' }}
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  Receita
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 font-bold text-xs text-rose-600 dark:text-rose-400">
            <ArrowUpRight className="w-4 h-4" />
            <span>Categorias de Despesas ({expenseCategories.length})</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {expenseCategories.map((c) => (
              <div key={c.id} className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c.color || '#e11d48' }}
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
                </div>
                <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
                  Despesa
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Nova Categoria */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nova Categoria Financeira"
        subtitle="Crie um marcador para classificação de lançamentos"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Categoria *
            </label>
            <input
              type="text"
              value={newCat.name}
              onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
              placeholder="Ex: Treinamentos & Cursos ou Logística Reversa"
              required
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo *
              </label>
              <select
                value={newCat.type}
                onChange={(e) => setNewCat({ ...newCat, type: e.target.value as any })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              >
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cor de Identificação
              </label>
              <input
                type="color"
                value={newCat.color}
                onChange={(e) => setNewCat({ ...newCat, color: e.target.value })}
                className="w-full h-9 p-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold"
            >
              Salvar Categoria
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
