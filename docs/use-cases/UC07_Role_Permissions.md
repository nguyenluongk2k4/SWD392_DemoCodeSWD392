# UC07 — Phân quyền vai trò (Role & Permissions)

## Mục tiêu
Cho phép Admin định nghĩa vai trò và gán các quyền (permissions) cụ thể cho từng vai trò.

## Actors
- Admin
- System (RoleService)

## Components (Lifelines)
- UI
- API Gateway
- RoleController
- RoleService
- RoleRepository (DB)
- UserService (for assigning roles)
- AuthService (permission checks)
- Event Bus
- Audit Log

## Preconditions
- Admin đã đăng nhập.

## Postconditions
- Roles và permissions được cập nhật; Users assigned to roles inherit permissions; cache/auth tokens invalidated where necessary.

---

## Main Flow (Create role)
Participants: UI → API Gateway → RoleController → RoleService → RoleRepository → DB → Event Bus → AuthService

1. Admin opens "Create Role" and defines `name` and `permissions` (list of permission keys, e.g., `devices:control`, `users:manage`).
2. UI sends `POST /api/roles` with payload.
3. API Gateway authenticates and authorizes.
4. RoleController validates payload and calls RoleService.createRole(payload).
5. RoleService checks uniqueness and persists role via RoleRepository.
6. DB returns created role; RoleService emits `ROLE_CREATED` event.
7. If roles assigned to users later, UserService handles assignment and emits `USER_ROLES_CHANGED`.
8. AuthService (or policy engine) reloads role-permission mappings from DB or cache.
9. RoleController returns HTTP 201 with new role.

## Update role (change permissions)
1. Admin calls `PUT /api/roles/{id}`.
2. RoleService updates DB and emits `ROLE_UPDATED` event.
3. AuthService invalidates or refreshes permission cache; any users with that role are required to re-authenticate or token invalidated depending on policy.

## Assign role to user
1. Admin calls `POST /api/users/{id}/roles` with roleId(s).
2. UserService updates user's role list and emits `USER_ROLES_CHANGED`.
3. AuthService may revoke tokens for impacted users.

## Alternate Flows
- AF1: Attempt to delete role in use — block or require reassigning users.
- AF2: Circular role dependencies — ensure role definitions are flat (no inheritance) or resolve inheritance deterministically.

## Data contracts
- Role payload:
```json
{ "name":"technician", "permissions":["devices:control","sensors:view"] }
```

## Diagram notes
- Sequence: UI→API→RoleService→DB; events to AuthService and UserService.
- Communication diagram: REST for admin actions; Event Bus for propagating changes.

## Security notes
- Carefully scope permission keys.
- Prefer least privilege default for new roles.

## Test cases
1. Create role and assign to user; assert permission effective.
2. Update role permissions; assert affected users' access changes.

---

File: `docs/use-cases/UC07_Role_Permissions.md`