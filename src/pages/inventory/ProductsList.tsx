import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Product, Supplier } from '../../types/index.ts';
import { formatCurrency } from '../../utils/formatters.ts';
import { Modal } from '../../components/Modal.tsx';
import { useToast } from '../../context/ToastContext.tsx';

interface ProductsListProps {
  onNavigate: (path: string) => void;
}

export const ProductsList: React.FC<ProductsListProps> = ({ onNavigate }) => {
  const { success, error } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Geral',
    description: '',
    supplier_id: '',
    supplier_name: '',
    cost: '',
    sale_price: '',
    current_stock: '',
    min_stock: '5',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [prods, sups] = await Promise.all([api.getProducts(), api.getSuppliers()]);
      setProducts(prods);
      setSuppliers(sups);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `NX-${Date.now().toString().slice(-4)}`,
      category: 'Periféricos',
      description: '',
      supplier_id: suppliers[0]?.id || '',
      supplier_name: suppliers[0]?.name || '',
      cost: '',
      sale_price: '',
      current_stock: '0',
      min_stock: '10',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      description: prod.description || '',
      supplier_id: prod.supplier_id || '',
      supplier_name: prod.supplier_name || '',
      cost: String(prod.cost),
      sale_price: String(prod.sale_price),
      current_stock: String(prod.current_stock),
      min_stock: String(prod.min_stock),
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sale_price) {
      error('Preencha nome do produto e preço de venda.');
      return;
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          ...formData,
          current_stock: Number(formData.current_stock) || 0,
          cost: Number(formData.cost) || 0,
          sale_price: Number(formData.sale_price),
          min_stock: Number(formData.min_stock) || 5,
        });
        success('Produto atualizado com sucesso!');
      } else {
        await api.createProduct({
          ...formData,
          cost: Number(formData.cost) || 0,
          sale_price: Number(formData.sale_price),
          current_stock: Number(formData.current_stock) || 0,
          min_stock: Number(formData.min_stock) || 5,
        });
        success('Produto cadastrado com sucesso!');
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao salvar produto.');
    }
  };

  // Dynamic calculations for the form
  const formCost = Number(formData.cost) || 0;
  const formPrice = Number(formData.sale_price) || 0;
  const formMargin = formPrice - formCost;
  const formMarginPercent = formPrice > 0 ? Math.round(((formMargin / formPrice) * 100) * 10) / 10 : 0;

  const filtered = products.filter((p) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-sky-500" />
            <span>Catálogo de Produtos & Precificação</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cadastro de itens comercializados, custos de aquisição, preços e margem de contribuição
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('/produtos/estoque')}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <span>Ver Estoque Físico</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do produto, SKU ou categoria..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Custo (R$)</th>
                <th className="px-4 py-3 text-right">Venda (R$)</th>
                <th className="px-4 py-3 text-right">Margem Bruta</th>
                <th className="px-4 py-3 text-center">Estoque Atual</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Nenhum produto cadastrado no catálogo.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isLow = p.current_stock <= p.min_stock;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {p.name}
                        {p.supplier_name && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Fornec: {p.supplier_name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">
                        {p.sku}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {p.category}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-500">
                        {formatCurrency(p.cost)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                        {formatCurrency(p.sale_price)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(p.margin)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          ({p.margin_percentage}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums">
                          {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          <span
                            className={
                              isLow
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }
                          >
                            {p.current_stock} un.
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-md bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                          title="Editar Preço ou Dados"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar/Editar Produto */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
        subtitle="Gerenciamento de precificação e margens comerciais"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Teclado Mecânico Wireless Nexora"
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Código / SKU *
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Categoria
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ex: Wearables, Áudio, Periféricos"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fornecedor Parceiro
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => {
                  const s = suppliers.find((sup) => sup.id === e.target.value);
                  setFormData({
                    ...formData,
                    supplier_id: e.target.value,
                    supplier_name: s ? s.name : '',
                  });
                }}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              >
                <option value="">Selecione o fornecedor</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing calculations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-sky-50/60 dark:bg-sky-950/20 rounded-xl border border-sky-100 dark:border-sky-900/40">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preço de Custo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0,00"
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Preço de Venda Final (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                placeholder="0,00"
                required
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-bold text-sky-600 dark:text-sky-400"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-sky-200/50 dark:border-sky-800/40 text-xs">
              <div>
                <span className="text-slate-500">Margem Bruta em Reais:</span>{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(formMargin)}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Margem Percentual:</span>{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formMarginPercent}%
                </strong>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estoque Atual {editingProduct && '(Altere via Movimento de Estoque)'}
              </label>
              <input
                type="number"
                disabled={!!editingProduct}
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-bold disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Estoque Mínimo de Alerta
              </label>
              <input
                type="number"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Descrição Técnica
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Especificações do produto..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
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
              Salvar Produto
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
