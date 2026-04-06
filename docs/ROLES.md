# Adição de Novos Cargos (Roles)

O sistema ShinobiOps é orientado para controle de acesso baseado em roles (`RBAC`). Para adicionar uma nova Role, siga estes 6 passos essenciais.

## 1. Banco de Dados (Prisma)
Edite o enum `Role` no arquivo `prisma/schema.prisma` e adicione o novo cargo em uppercase (ex: `QA_NINJA`).
- **Ação:** Execute `npx prisma generate` dentro de `apps/web`.

## 2. Constantes de Sistema
Atualize o arquivo `apps/web/lib/types.ts`:
- Adicione a role no objeto `Role`.
- Adicione a role ao array `ALL_ROLES`.

## 3. Controle de Acesso (Middleware)
Edite `apps/web/middleware.ts` para conceder acesso às rotas desejadas.
- **ROLE_GUARDS:** Adicione a nova role à lista de permitidos para prefixos como `/dev`, `/support` ou `/admin`.
- **getRoleHome:** Opcional — se a home desse cargo deve ser diferente (ex: `/dev`), adicione um novo `case` para o redirecionamento pós-login.

## 4. Roteamento de Navegação (Sidebar)
Edite `apps/web/components/layout/sidebar.tsx`:
- Na função `getNavItems`, adicione um novo `case` para a role retornando os itens de menu específicos.

## 5. Interface do Usuário (Labels)
- **Equipe:** Adicione o nome amigável no objeto `ROLE_LABELS` em `apps/web/components/admin/team-management.tsx` (ex: `"Kage do QA"`).
- **Perfil:** Repita o mapeamento em `apps/web/components/profile/profile-form.tsx` se necessário.

## 6. Permissões de API
Revise as rotas em `apps/web/app/api/...` que são restritas (módulo `requireRole`).
- Adicione a nova role como argumento em chamadas críticas (ex: `requireRole("DEVELOPER", "QA_NINJA")`).

---

*Nota: O sistema de registro (`register/route.ts`) usa `ALL_ROLES` automaticamente, então o novo cargo aparecerá como opção de cadastro se as constantes forem atualizadas corretamente.*
