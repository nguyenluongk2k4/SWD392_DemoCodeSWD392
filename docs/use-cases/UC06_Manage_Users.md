# UC06 — Quản lý người dùng (Manage Users)

## Mục tiêu
Cho phép Admin/Owner thực hiện CRUD tài khoản, gán vai trò và kiểm soát quyền truy cập.

## Actors
- Admin / Owner
- Dashboard Admin UI

## System Components (Lifelines)
- UI
- API Gateway (REST)
- AuthService / UserController
- UserService
- UserRepository (DB)
- RoleService / RoleRepository
- Event Bus
- Audit/ActionLog

## Preconditions
- Admin đã đăng nhập và có quyền quản trị.

## Postconditions
- Người dùng được tạo/cập nhật/xóa; permission changes take effect (optionally via token invalidation).

---

## Main Flow (Create user)
Participants: UI → API Gateway → UserController → UserService → UserRepository → DB → Event Bus → AuthService

1. Admin opens "Create User" form, fills username, email, roleIds, initial password.
2. UI sends `POST /api/users` with payload.
3. API Gateway authenticates the Admin and authorizes action.
4. UserController validates payload, then calls UserService.createUser(payload).
5. UserService hashes password (bcrypt) and ensures username/email uniqueness.
6. UserService calls UserRepository.create(user).
7. DB returns saved user (without password).
8. UserService emits `USER_CREATED` event (useful for provisioning/notifications).
9. UserController returns HTTP 201 with created user.

## Update user (including role change)
1. Admin calls `PUT /api/users/{id}` with updatable fields (email, roles, active flag).
2. UserService updates DB and emits `USER_UPDATED` event.
3. If roles changed, AuthService may revoke existing tokens (emit `USER_ROLES_CHANGED`) to force re-login.

## Delete user
1. Admin calls `DELETE /api/users/{id}`.
2. UserService performs soft-delete (recommended) and emits `USER_DELETED`.
3. Audit log entry created.

## Alternate Flows
- AF1: Duplicate username/email — return HTTP 409.
- AF2: Weak password — validation rejects with HTTP 400.
- AF3: Self-deletion attempt by an admin — enforce policy (deny or require transfer).

## Security considerations
- Passwords never returned in responses.
- Role changes require higher privilege and may require 2FA.
- Token invalidation: when roles change or user disabled, existing JWT tokens should be revoked; implement token blacklist or short-lived tokens.

## Data contracts
- Create payload:
```json
{ "username":"tech01", "email":"tech@example.com", "password":"Secret123!", "roles":["technician"] }
```
- User object returned (no password):
```json
{ "id":"u-123", "username":"tech01", "email":"tech@example.com", "roles":["technician"], "isActive":true }
```

## Diagram notes
- Sequence diagram: UI→API→UserService→DB→EventBus→AuthService.
- Communication diagram: REST between UI/API/UserService; Event Bus for provisioning/notifications.

## Test cases
1. Create user valid → assert created, password hashed, event emitted.
2. Update roles → assert `USER_ROLES_CHANGED` and token invalidation.
3. Delete user → assert soft-delete and audit log entry.

## Additional Specifications
- **RBAC matrix:** chỉ Admin/Owner với permission `users:manage`; system disallow tự chỉnh role nếu không có quyền cao hơn role đích.
- **Password policy:** tối thiểu 12 ký tự, yêu cầu uppercase/lowercase/number/special; kiểm tra trên server và hiển thị yêu cầu trên UI.
- **Identity providers:** hỗ trợ import tài khoản từ SSO (OIDC) qua webhook `user.synced`; UserService hợp nhất hoặc tạo mới tùy policy `autoProvision`.
- **Audit & compliance:** mọi thao tác CRUD ghi vào `UserAudit` với `oldValue`, `newValue`, `changedBy`, `reason`; lưu 1 năm.
- **Notification hooks:** `USER_CREATED` kích hoạt email set-password link (qua NotificationService) nếu `ENABLE_EMAIL_ALERTS`; `USER_DISABLED` phát sự kiện để revoke sessions.
- **Rate limiting:** API `POST /api/users` giới hạn 20 yêu cầu/giờ/người dùng để tránh lạm dụng; trả `429` khi vượt.

---

File: `docs/use-cases/UC06_Manage_Users.md`