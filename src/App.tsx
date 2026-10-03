import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { Layout } from './components/Layout.tsx';
import { Login } from './pages/Login.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { FinancialOverview } from './pages/financial/FinancialOverview.tsx';
import { Receivables } from './pages/financial/Receivables.tsx';
import { Payables } from './pages/financial/Payables.tsx';
import { Transactions } from './pages/financial/Transactions.tsx';
import { CashRegister } from './pages/financial/CashRegister.tsx';
import { BankAccounts } from './pages/financial/BankAccounts.tsx';
import { Categories } from './pages/financial/Categories.tsx';
import { SalesList } from './pages/sales/SalesList.tsx';
import { NewSale } from './pages/sales/NewSale.tsx';
import { OrdersList } from './pages/sales/OrdersList.tsx';
import { CommissionsList } from './pages/sales/CommissionsList.tsx';
import { CustomersList } from './pages/entities/CustomersList.tsx';
import { SuppliersList } from './pages/entities/SuppliersList.tsx';
import { ProductsList } from './pages/inventory/ProductsList.tsx';
import { StockManagement } from './pages/inventory/StockManagement.tsx';
import { ReportsHub } from './pages/reports/ReportsHub.tsx';
import { UsersList } from './pages/admin/UsersList.tsx';
import { AuditLogs } from './pages/admin/AuditLogs.tsx';
import { SettingsPage } from './pages/admin/SettingsPage.tsx';
import { UserProfile } from './pages/admin/UserProfile.tsx';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname !== '/' && window.location.pathname !== '/login'
      ? window.location.pathname
      : '/dashboard';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState(null, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#071322] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-sky-400 font-bold">NEXORA GROUP</p>
        <p className="text-[11px] text-slate-400 mt-1">Carregando ambiente empresarial...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => navigate('/dashboard')} />;
  }

  const renderPage = () => {
    switch (currentPath) {
      case '/dashboard':
        return <Dashboard onNavigate={navigate} />;
      case '/financeiro':
        return <FinancialOverview onNavigate={navigate} />;
      case '/financeiro/receber':
        return <Receivables />;
      case '/financeiro/pagar':
        return <Payables />;
      case '/financeiro/movimentacoes':
        return <Transactions />;
      case '/financeiro/caixa':
        return <CashRegister />;
      case '/financeiro/contas':
        return <BankAccounts />;
      case '/financeiro/categorias':
        return <Categories />;
      case '/vendas':
        return <SalesList onNavigate={navigate} />;
      case '/vendas/nova':
        return <NewSale onNavigate={navigate} />;
      case '/vendas/pedidos':
        return <OrdersList />;
      case '/vendas/comissoes':
        return <CommissionsList />;
      case '/clientes':
        return <CustomersList />;
      case '/fornecedores':
        return <SuppliersList />;
      case '/produtos':
        return <ProductsList onNavigate={navigate} />;
      case '/produtos/estoque':
        return <StockManagement />;
      case '/relatorios':
        return <ReportsHub />;
      case '/usuarios':
        return <UsersList />;
      case '/atividades':
        return <AuditLogs />;
      case '/configuracoes':
        return <SettingsPage />;
      case '/perfil':
        return <UserProfile />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  return (
    <Layout currentPath={currentPath} onNavigate={navigate}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
