# Seeding de Desenvolvimento

O ShinobiOps possui um script (`seed.ts`) para popular rapidamente o banco de dados MySQL com usuários e configurações iniciais necessários em ambientes locais.

## 1. Funcionamento do Script
- **Local:** `apps/web/prisma/seed.ts`.
- **Criação de Usuários:** O script cria 4 usuários por padrão.
- **Segurança:** O script utiliza `upsert` com base no e-mail, garantindo que usuários existentes não sejam duplicados se rodado novamente. Ele também utiliza `bcrypt` (12 rounds) para os hashes de senha.

## 2. Como Executar (Comando)
A execução deve ocorrer dentro da pasta `apps/web`:
```bash
# Na raiz do projeto:
npm run db:seed --workspace=web

# Dentro de apps/web:
npm run db:seed
```

## 3. Credenciais Padrão (Ambiente Local)
Todos os usuários utilizam a senha: **`Password123!`**

| Nome | E-mail | Role | Ninja Alias |
| :--- | :--- | :--- | :--- |
| Yuki Tanaka | `techlead@vectorops.dev` | `TECH_LEAD` | IronJonin |
| Ryu Hayabusa | `developer@vectorops.dev` | `DEVELOPER` | SilentBlade |
| Mei Lin | `supportlead@vectorops.dev` | `SUPPORT_LEAD` | SwiftCrane |
| Kenji Mori | `support@vectorops.dev` | `SUPPORT_MEMBER` | GhostFox |

## 4. Pré-requisitos
O MySQL deve estar rodando antes de executar o seed. Para iniciar o MySQL via Docker:
```bash
docker compose up mysql -d
```

---

*Aviso: Em caso de necessidade de reset, pare o container MySQL, remova o volume (`docker compose down -v`), e reinicie o processo de migração e seed.*
