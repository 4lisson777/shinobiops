# Sinais de Fumaça (Help Requests)

O sistema de "Sinais de Fumaça" é o mecanismo central de ajuda em tempo real do ShinobiOps para desenvolvedores.

## 1. Fluxo de Execução
1.  **Requisição:** Um `DEVELOPER` envia um pedido de ajuda via `SmokeSignalModal` (`POST /api/help-requests`).
2.  **Notificação:** O backend cria o pedido no DB e dispara a função `createAndEmitNotifications` (`HELP_REQUEST_NEW`).
3.  **SSE:** Um evento de tempo real (`notification:new`) é propagado para todos os outros desenvolvedores via Server-Sent Events (SSE).
4.  **Banner:** Outros desenvolvedores ativos veem o banner aparecer no topo do **Painel Ninja**.
5.  **Atenção:** O estado do desenvolvedor muda para `HELP_REQUESTED` no banco.

## 2. Som e Alertas Visuais
Para garantir resposta rápida "em batalha", o sinal utiliza:
- **Tom de Áudio (Tom C):** Um som de onda triangular de 660Hz (400ms). Ele é configurado em `use-sound-alerts.ts` e disparado pelo `NotificationCenter`.
- **Badge Animada:** Notificações de sinal de fumaça brilham com borda âmbar.

## 3. Respondendo ao Sinal
- **Ação:** No banner, qualquer outro ninja pode clicar em **"Posso ajudar"**.
- **Impacto:** O estado do socorrista muda para `HELPING`, e o solicitante recebe uma notificação instantânea: `[Alias] pode te ajudar`.
- **Broadcasting:** Uma atualização SSE (`help_request:responded`) é enviada para remover o banner de todos os outros painéis ativos.

## 4. Personalização e Som
- **Mute:** Os usuários podem silenciar o sinal de fumaça individualmente nas configurações de perfil (`soundEnabled`).
- **Pragmas:** O banco garante integridade nas ações (onDelete: Cascade) para limpar logs de resposta caso o pedido principal seja cancelado.

---

*Informação de Design: O uso de ondas triangulares para este sinal foi escolhido para ser fácil de identificar sem ser agressivo como o som de um Bug Crítico.*
