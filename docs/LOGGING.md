# Logging e Rastreabilidade

O ShinobiOps utiliza quatro níveis principais de logging para garantir a observabilidade técnica e operacional da "missão".

## 1. Auditoria de Missões (`TicketEvent`)
Cada ação significativa em um ticket é salva de forma persistente.
- **Modelo:** `TicketEvent` no Prisma.
- **Tipos de Evento:** `CREATED`, `STATUS_CHANGED`, `ASSIGNED`, `REORDER_APPROVED`, `HELP_REQUESTED`, etc.
- **Metadata:** Armazena detalhes da mudança em formato JSON (ex: `{ oldStatus: "OPEN", newStatus: "IN_PROGRESS" }`).
- **Visualização:** Administradores podem visualizar o histórico completo na página de "Logs" (`/admin/log`).

## 2. Pergaminhos de Status (`Checkpoint`)
O sistema de "Status Scroll" gera um log temporal da atividade da equipe.
- **Modelo:** `Checkpoint`.
- **Conteúdo:** Tarefa atual, status de bloqueio e anotações do ninja.
- **Uso:** Permite ao Tech Lead auditar o progresso diário sem interrupções manuais constantes.

## 3. Logs do Banco de Dados (Prisma)
Configurado em `apps/web/lib/db.ts`:
- **Desenvolvimento:** Loga queries de `error` e `warn`.
- **Produção:** Loga apenas `error`.
- **Customização:** Pode ser estendido para logar todas as queries SQL se necessário para depuração pesada.

## 4. Observabilidade e Erros de Runtime
- **Frontend:** O arquivo `app/error.tsx` atua como um "Global Error Boundary", capturando exceções inesperadas e logando no console do navegador com o prefixo `[ShinobiOps]`.
- **Backend:** Todas as rotas de API em `app/api` utilizam blocos `try/catch` que direcionam erros críticos para `console.error` no servidor Node.js antes de retornar o erro 500 sanitizado.

---

*Nota: Este sistema segue a temática "Ninja" para manter a imersão na plataforma.*
