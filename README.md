# NEXORA GROUP — Sistema Integrado de Gestão Empresarial e Financeira

Sistema web corporativo desenvolvido para a **NEXORA GROUP**, com controle financeiro, gestão de caixa, contas a pagar, contas a receber, faturamento de vendas com baixa transacional de estoque, pedidos, comissões, CRM de clientes, cadastro de fornecedores, relatórios gerenciais e auditoria completa de atividades.

Projetado para os três sócios:
- **RUAN** — Sócio Administrador & CEO
- **GABRIEL** — Sócio de Operações & CTO
- **CLIVER** — Sócio Comercial & CFO

---

## 🚀 Arquitetura e Tecnologias

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Google Fonts (Plus Jakarta Sans & JetBrains Mono).
- **Backend:** Node.js, Express, Middleware Vite em desenvolvimento e serving estático otimizado em produção.
- **Banco de Dados & Persistência:** Motor transacional ACID com persistência atômica segura em disco (`data/nexora_db.json`), preparado para migração transparente para PostgreSQL / Supabase.
- **Autenticação & Segurança:** Sessões com tokens Bearer protegidos, hash criptográfico PBKDF2 (SHA-256), proteção de rotas e verificação de permissões granulares por módulo (RBAC) tanto no frontend quanto no backend.
- **Auditoria:** Registro imutável de logs de criação, edição, exclusão, liquidações financeiras e baixas de estoque.

---

## 📋 Funcionalidades Principais

1. **Dashboard Executivo:**
   - 8 Cards primários de métricas: Saldo Atual em Bancos, Receitas do Mês, Despesas do Mês, Lucro Líquido Realizado, Contas a Receber, Contas a Pagar, Faturamento Concluído e Patrimônio em Estoque.
   - Gráficos interativos de evolução Receitas x Despesas, distribuição de despesas por categoria e desempenho de vendas por sócio.
   - Central de avisos em tempo real: contas vencendo hoje, títulos atrasados e itens com estoque abaixo do limite mínimo.
   - Seletor de período dinâmico (Hoje, 7 dias, 30 dias, Este mês, Este ano).

2. **Módulo Financeiro Completo:**
   - **Contas a Receber:** Cadastro, filtros por vencimento/status/cliente, liquidação atômica creditando conta bancária selecionada.
   - **Contas a Pagar:** Cadastro de obrigações com fornecedores, agendamento de vencimentos, liquidação atômica debitando conta bancária de origem.
   - **Movimentações & Extrato:** Extrato unificado de entradas, saídas e transferências entre contas, com formulário de lançamentos manuais.
   - **Controle de Caixa:** Saldo inicial, entradas, saídas e fechamento diário de caixa com contagem física e apuração de divergências.
   - **Contas Bancárias & Tesouraria:** Gestão de múltiplas contas (Itaú, Nubank, Inter, Caixa Físico) e modal de transferência entre contas com débito/crédito atômicos.
   - **Categorias Financeiras:** Gestão do plano de contas para receitas e despesas.
   - **Saúde Financeira & Previsão:** Projeção futura de liquidez para 7, 30 e 90 dias com saldo estimado.

3. **Comercial & Vendas:**
   - **Nova Venda (Frente de Caixa):** Seleção de cliente, múltiplos itens com conferência de saldo em estoque em tempo real, cálculo automático de subtotal, descontos, frete e total líquido. Ao concluir:
     - Baixa automática no estoque físico.
     - Gera movimentação no inventário.
     - Cria o faturamento e gera o título a receber ou entrada direta em conta.
     - Apura a comissão do vendedor.
     - Registra o pedido na esteira de expedição.
     - Salva log de auditoria detalhado.
   - **Pedidos:** Acompanhamento do fluxo operacional (Rascunho, Confirmado, Em preparação, Enviado, Entregue, Cancelado).
   - **Comissões:** Apuração percentual por sócio/vendedor com botão de liquidação.

4. **Produtos & Estoque:**
   - **Catálogo de Produtos:** SKU, preços de custo e venda, cálculo em tempo real de margem bruta (R$ e %) e definição de estoque mínimo.
   - **Controle Físico de Estoque:** Histórico de movimentações (entradas, saídas, ajustes, devoluções) com motivo obrigatório e alertas visuais de estoque baixo.

5. **Clientes & Fornecedores (CRM):**
   - Cadastro detalhado com validação e máscaras de CPF/CNPJ, WhatsApp, telefone e endereço.
   - Histórico consolidado de compras por cliente com total faturado.

6. **Relatórios & Exportação:**
   - DRE Gerencial, Relatório de Vendas e Posição de Estoque.
   - Exportação em formato CSV/Excel compatível.
   - Modo de impressão formatada em folha timbrada da NEXORA GROUP para PDF.

7. **Administração & Segurança:**
   - Gestão dos sócios e colaboradores (RUAN, GABRIEL, CLIVER) com permissões granulares por módulo.
   - Trilha de auditoria (Audit Logs) com carimbo de data, hora, usuário, registro afetado e valores anteriores/novos.
   - Configurações empresariais e backup/restauração do banco em formato JSON.

---

## ⚙️ Instalação e Execução Local

### Pré-requisitos
- Node.js versão 18 ou superior
- NPM ou Yarn

### Passos de Execução
```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor em desenvolvimento (Express + Vite)
npm run dev
```

O sistema estará acessível no endereço: `http://localhost:3000`

---

## 🔑 Credenciais Padrão dos Sócios

Para testes rápidos e demonstração, os três sócios já vêm pré-cadastrados com a senha padrão `123456`:

- **RUAN:** `ruan@nexoragroup.com.br` | Senha: `123456`
- **GABRIEL:** `gabriel@nexoragroup.com.br` | Senha: `123456`
- **CLIVER:** `cliver@nexoragroup.com.br` | Senha: `123456`

*Nota: Na tela de login e no cabeçalho superior existem botões de acesso direto ("Acesso Rápido dos Sócios") para alternar instantaneamente entre RUAN, GABRIEL e CLIVER e testar a concorrência.*

---

## 🗄️ Configuração de Banco de Dados (PostgreSQL / Supabase)

O sistema foi concebido de forma desacoplada para permitir migração direta para PostgreSQL ou Supabase:

1. Crie um projeto no Supabase ou configure um banco PostgreSQL.
2. Adicione as variáveis de ambiente em `.env`:
   ```env
   DATABASE_URL=postgresql://usuario:senha@host:5432/nexoradb
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua-chave-anonima
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-servico
   ```
3. O schema relacional espelha exatamente a interface TypeScript declarada em `src/types/index.ts`.

---

## 🌐 Deploy na Vercel ou Cloud Run

1. Conecte o repositório ao painel da Vercel ou GCP Cloud Run.
2. Defina o comando de build: `npm run build`
3. Defina o comando de inicialização: `npm start`
4. Configure as variáveis de ambiente necessárias.
