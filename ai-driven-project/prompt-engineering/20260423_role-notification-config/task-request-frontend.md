# Frontend Task: Role-Based Notification Configuration UI

## Description

Update the admin Notification Routing page to include a new section for **role-level notification configuration**. The Tech Lead should be able to toggle, per role, whether that role receives:
1. Live notifications (with sound) when a new ticket/bug is created.
2. Notifications when a ticket/bug is assigned to a user of that role.

This is a new table/card displayed on the existing `/admin/notifications` page, ABOVE the existing per-developer notification routing table. The existing per-user routing table should remain (it controls the secondary, user-level toggle).

## Acceptance Criteria

- [ ] A new `RoleNotificationConfig` component is created that displays a table with all 5 roles
- [ ] Each role row shows: role name (in PT-BR), a toggle for "Notificar ao criar" (notify on creation), and a toggle for "Notificar ao atribuir" (notify on assignment)
- [ ] Toggles use optimistic updates with rollback on failure (same pattern as existing NotificationRouting component)
- [ ] The component fetches data from `GET /api/admin/role-notification-config`
- [ ] Toggle changes call `PATCH /api/admin/role-notification-config` with the updated config
- [ ] Loading state shows skeletons (same pattern as existing component)
- [ ] Error state shows an alert (same pattern as existing component)
- [ ] The admin notifications page (`/admin/notifications`) shows the role config section with a clear heading and description, followed by the existing per-user section
- [ ] The existing NotificationRouting component is updated to also load and show ALL roles that have `notifyOnCreation = true` (not just DEVELOPER), since per-user toggles only matter for roles where the role-level gate is enabled
- [ ] PT-BR labels for role names: TECH_LEAD = "Lider Tecnico", DEVELOPER = "Desenvolvedor", QA = "QA", SUPPORT_LEAD = "Lider de Suporte", SUPPORT_MEMBER = "Membro de Suporte"

## Pages / Components

### New Component: `apps/web/components/admin/role-notification-config.tsx`
- Client component ("use client")
- Renders a bordered table (same visual style as NotificationRouting)
- Columns: Role Name | Notificar ao Criar | Notificar ao Atribuir
- Each toggle uses the shadcn Switch component
- Shows loading skeletons and error states

### Modified Page: `apps/web/app/(protected)/admin/notifications/page.tsx`
- Import and render the new RoleNotificationConfig component above the existing NotificationRouting
- Add clear section headings:
  - Section 1: "Configuracao por Papel" (Role Configuration) with description "Defina quais papeis recebem notificacoes de criacao e atribuicao de chamados"
  - Section 2: "Roteamento Individual" (Individual Routing) with description "Configure quais membros da equipe recebem notificacoes de chamados e bugs" (existing)

### Modified Component: `apps/web/components/admin/notification-routing.tsx`
- Update the user fetch to load users of ALL roles that have `notifyOnCreation = true` in the role config, not just DEVELOPER
- This means it should first fetch the role configs, then filter the user query by eligible roles
- Update the table header from "Desenvolvedor" to "Membro" (since it now shows multiple roles)
- Add a role badge/label next to each user's name to indicate their role

## Mock Data

For initial development before backend is ready, use this mock data:

```typescript
const mockConfigs = [
  { role: "TECH_LEAD", notifyOnCreation: true, notifyOnAssignment: true },
  { role: "DEVELOPER", notifyOnCreation: true, notifyOnAssignment: true },
  { role: "QA", notifyOnCreation: true, notifyOnAssignment: false },
  { role: "SUPPORT_LEAD", notifyOnCreation: false, notifyOnAssignment: false },
  { role: "SUPPORT_MEMBER", notifyOnCreation: false, notifyOnAssignment: false },
]
```

## Design Reference

- Follow the existing NotificationRouting component for visual patterns: bordered table, shadcn Table/Switch components, Avatar with initials, skeleton loading, error alert
- Use the project's design tokens from `@workspace/ui/components/*`
- Reference `ai-driven-project/utilities/ui-system.md` for color palette and component conventions
- Role badges should use a subtle `Badge` component or a small colored label (use muted variants)

## Rules to Follow

- All UI text must be in PT-BR
- Use "use client" directive for interactive components
- Import shared UI from `@workspace/ui/components/*`
- Use `cn()` from `@workspace/ui/lib/utils` for class merging
- Follow the existing optimistic update + rollback pattern from NotificationRouting
- Keep the component focused and simple -- no over-engineering

## Communication File

`.claude/communication/20260423_role-notification-config.md`
