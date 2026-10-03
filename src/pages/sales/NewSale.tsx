import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Package,
  User,
  CreditCard,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Product, Customer, BankAccount, SaleItem, PaymentMethod } from '../../types/index.ts';
import { formatCurrency } from '../../utils/formatters.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface NewSaleProps {
  onNavigate: (path: string) => void;
}

export const NewSale: React.FC<NewSaleProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Item selector state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  useEffect(() => {
    const loadDependencies = async () => {
      try {
        const [prods, custs, accs] = await Promise.all([
          api.getProducts(),
          api.getCustomers(),
          api.getBankAccounts(),
        ]);
        setProducts(prods.filter((p) => p.status === 'ativo'));
        setCustomers(custs.filter((c) => c.status === 'ativo'));
        setBankAccounts(accs.filter((a) => a.status === 'ativa'));
        if (accs.length > 0) setDestinationAccountId(accs[0].id);
      } catch (err) {
        console.error(err);
      }
    };
    loadDependencies();
  }, []);

  const handleAddItem = () => {
    if (!selectedProductId) {
      error('Selecione um produto do catálogo.');
      return;
    }
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    if (selectedQuantity <= 0) {
      error('Quantidade deve ser no mínimo 1.');
      return;
    }

    if (product.current_stock < selectedQuantity) {
      error(
        `Estoque insuficiente para "${product.name}". Disponível em estoque: ${product.current_stock} un.`
      );
      return;
    }

    // Check if item already in list
    const existingIndex = items.findIndex((i) => i.product_id === product.id);
    if (existingIndex > -1) {
      const updated = [...items];
      const newQty = updated[existingIndex].quantity + selectedQuantity;
      if (product.current_stock < newQty) {
        error(
          `Estoque insuficiente para somar +${selectedQuantity} un. Total disponível: ${product.current_stock}.`
        );
        return;
      }
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].total = newQty * updated[existingIndex].unit_price;
      setItems(updated);
    } else {
      const newItem: SaleItem = {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        quantity: selectedQuantity,
        unit_price: product.sale_price,
        unit_cost: product.cost,
        total: selectedQuantity * product.sale_price,
      };
      setItems([...items, newItem]);
    }

    setSelectedProductId('');
    setSelectedQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, subtotal - Number(discount || 0) + Number(shipping || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      error('Informe o cliente da venda.');
      return;
    }
    if (items.length === 0) {
      error('Adicione ao menos um produto para concluir a venda.');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createSale({
        customer_id: customerId,
        customer_name: customerName,
        items,
        subtotal,
        discount: Number(discount || 0),
        shipping: Number(shipping || 0),
        total,
        payment_method: paymentMethod,
        destination_account_id: destinationAccountId,
        seller_id: user?.id || 'usr_ruan',
        seller_name: user?.name || 'RUAN',
        date: new Date(saleDate).toISOString(),
        notes,
        status: 'concluida',
      });

      success('Venda concluída com sucesso! Estoque baixado e financeiro gerado.');
      onNavigate('/vendas');
    } catch (err: any) {
      error(err.message || 'Erro ao processar venda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProdObj = products.find((p) => p.id === selectedProductId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <ShoppingCart className="w-6 h-6 text-sky-500" />
          <span>Frente de Caixa & Nova Venda</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Emissão direta de venda com baixa automática no estoque físico e geração financeira
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Customer & Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Section */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-sky-500" />
              <span>Dados do Cliente</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cliente *
              </label>
              <input
                type="text"
                list="client_suggestions"
                value={customerName}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomerName(val);
                  const matched = customers.find((c) => c.name.toLowerCase() === val.toLowerCase());
                  if (matched) setCustomerId(matched.id);
                  else setCustomerId('');
                }}
                placeholder="Selecione ou digite o nome do cliente..."
                required
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-hidden"
              />
              <datalist id="client_suggestions">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Product Items Section */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-sky-500" />
              <span>Itens da Venda</span>
            </h3>

            {/* Add item control */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <div className="sm:col-span-7">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Produto do Catálogo
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-hidden"
                >
                  <option value="">Selecione um produto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.current_stock <= 0}>
                      {p.name} — {formatCurrency(p.sale_price)} ({p.current_stock} em estoque)
                    </option>
                  ))}
                </select>
                {selectedProdObj && (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Estoque disponível: <strong className="text-sky-500">{selectedProdObj.current_stock} un.</strong> | SKU: {selectedProdObj.sku}
                  </span>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Qtd
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedProdObj?.current_stock || 9999}
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-hidden"
                />
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>

            {/* Added Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2 text-center">Qtd</th>
                    <th className="px-3 py-2 text-right">Unitário</th>
                    <th className="px-3 py-2 text-right">Total</th>
                    <th className="px-3 py-2 text-right">Remover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        Nenhum item adicionado à venda ainda.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">
                          {item.product_name}
                        </td>
                        <td className="px-3 py-2.5 text-center font-bold tabular-nums">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-300">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-black tabular-nums text-slate-900 dark:text-white">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Summary, Payment & Submission */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-sky-500" />
              <span>Condições de Pagamento</span>
            </h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-hidden font-medium"
              >
                <option value="pix">Pix (Liquidação Imediata)</option>
                <option value="dinheiro">Dinheiro (Caixa Físico)</option>
                <option value="cartao_credito">Cartão de Crédito</option>
                <option value="cartao_debito">Cartão de Débito</option>
                <option value="transferencia">Transferência TED / DOC</option>
                <option value="boleto">Boleto Faturado (30 dias)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Conta Bancária de Destino
              </label>
              <select
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-hidden"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Data da Venda
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Desconto (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-hidden font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Frete (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={shipping}
                  onChange={(e) => setShipping(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-hidden font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Observações
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalhes adicionais da venda..."
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-hidden"
              />
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Desconto:</span>
                <span className="font-semibold text-rose-500 tabular-nums">
                  -{formatCurrency(discount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Frete:</span>
                <span className="font-semibold tabular-nums">+{formatCurrency(shipping)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
                <span>Total a Pagar:</span>
                <span className="text-lg text-sky-600 dark:text-sky-400 tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="w-full py-3 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-white rounded-xl text-xs font-black shadow-md hover:shadow-sky-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Processando Venda...' : 'Finalizar e Concluir Venda'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
