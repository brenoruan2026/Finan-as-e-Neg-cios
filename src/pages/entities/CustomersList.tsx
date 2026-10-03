import React, { useState, useEffect } from 'react';
import {
  Users2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit,
  ShoppingCart,
  DollarSign,
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Customer, Sale } from '../../types/index.ts';
import { formatCurrency, formatCpfCnpj, formatPhone, formatDateTime } from '../../utils/formatters.ts';
import { Modal } from '../../components/Modal.tsx';
import { useToast } from '../../context/ToastContext.tsx';

export const CustomersList: React.FC = () => {
  const { success, error } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    cpf_cnpj: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    state: '',
    cep: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [custs, sls] = await Promise.all([api.getCustomers(), api.getSales()]);
      setCustomers(custs);
      setSales(sls);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.cpf_cnpj) {
      error('Nome e CPF/CNPJ são campos obrigatórios.');
      return;
    }

    try {
      await api.createCustomer(formData);
      success('Cliente cadastrado com sucesso!');
      setShowCreateModal(false);
      setFormData({
        name: '',
        cpf_cnpj: '',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        city: '',
        state: '',
        cep: '',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      error(err.message || 'Erro ao cadastrar cliente.');
    }
  };

  const filtered = customers.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.cpf_cnpj.includes(term) ||
      c.email.toLowerCase().includes(term)
    );
  });

  // Calculate purchases for selected customer
  const customerSales = selectedCustomer
    ? sales.filter((s) => s.customer_id === selectedCustomer.id || s.customer_name === selectedCustomer.name)
    : [];
  const customerTotalSpent = customerSales.reduce((s, sale) => s + sale.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users2 className="w-6 h-6 text-sky-500" />
            <span>Cadastro & CRM de Clientes</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão de carteira de clientes, histórico de faturamento e dados cadastrais
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, documento ou e-mail..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">CPF / CNPJ</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Cidade / UF</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.email || 'Sem e-mail'}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatCpfCnpj(c.cpf_cnpj)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {formatPhone(c.phone || c.whatsapp)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                      {c.city ? `${c.city}/${c.state}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="p-1.5 rounded-md bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 dark:bg-slate-800 dark:text-slate-300 transition-colors"
                        title="Ver Perfil Completo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Cliente */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Cadastrar Novo Cliente"
        subtitle="Adicione informações completas para emissão de faturamento"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome / Razão Social *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: TechCorp Soluções Ltda"
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                CPF ou CNPJ *
              </label>
              <input
                type="text"
                value={formData.cpf_cnpj}
                onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                placeholder="00.000.000/0000-00"
                required
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 3200-0000"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contato@cliente.com.br"
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua, número, complemento e bairro"
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
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Cidade"
                  className="w-2/3 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
                />
                <input
                  type="text"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  placeholder="UF"
                  className="w-1/3 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden text-center uppercase"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações Comerciais
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas internas..."
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-600 dark:text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-bold"
            >
              Salvar Cliente
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Perfil do Cliente */}
      <Modal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || 'Perfil do Cliente'}
        subtitle={`Documento: ${formatCpfCnpj(selectedCustomer?.cpf_cnpj)}`}
        maxWidth="2xl"
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            {/* KPI customer stats */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Comprado</span>
                <p className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatCurrency(customerTotalSpent)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Total de Pedidos</span>
                <p className="text-base font-black text-slate-900 dark:text-white tabular-nums">
                  {customerSales.length} compras
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Status</span>
                <p className="text-base font-black text-sky-600 dark:text-sky-400 uppercase">
                  {selectedCustomer.status}
                </p>
              </div>
            </div>

            {/* Contact details */}
            <div className="space-y-1 text-slate-600 dark:text-slate-300">
              <p>
                <strong>E-mail:</strong> {selectedCustomer.email || 'Não informado'}
              </p>
              <p>
                <strong>Telefone:</strong> {formatPhone(selectedCustomer.phone)} |{' '}
                <strong>WhatsApp:</strong> {formatPhone(selectedCustomer.whatsapp)}
              </p>
              <p>
                <strong>Endereço:</strong> {selectedCustomer.address || 'Não cadastrado'} —{' '}
                {selectedCustomer.city}/{selectedCustomer.state}
              </p>
              {selectedCustomer.notes && (
                <p>
                  <strong>Notas:</strong> {selectedCustomer.notes}
                </p>
              )}
            </div>

            {/* Purchase history */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                Histórico de Vendas ({customerSales.length})
              </h4>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-3 py-2">Código</th>
                      <th className="px-3 py-2">Data</th>
                      <th className="px-3 py-2">Vendedor</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {customerSales.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          Nenhuma compra registrada para este cliente.
                        </td>
                      </tr>
                    ) : (
                      customerSales.map((s) => (
                        <tr key={s.id}>
                          <td className="px-3 py-2 font-bold text-sky-600">{s.code}</td>
                          <td className="px-3 py-2 text-slate-500 tabular-nums">
                            {formatDateTime(s.date || s.createdAt)}
                          </td>
                          <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                            {s.seller_name}
                          </td>
                          <td className="px-3 py-2 text-right font-black tabular-nums">
                            {formatCurrency(s.total)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
