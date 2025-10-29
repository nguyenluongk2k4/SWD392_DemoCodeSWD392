# UC14 — Sao lưu / Phục hồi dữ liệu (Backup & Restore)

## Mục tiêu
Cung cấp khả năng sao lưu toàn bộ dữ liệu hệ thống (DB, configs, broker snapshots if applicable) và phục hồi khi cần thiết.

## Actors
- Admin
- System (Backup Manager)

## System Components (Lifelines)
- Admin UI
- API Gateway (REST)
- BackupService / RestoreService
- Database (MongoDB)
- File Storage (local / S3)
- Config store (env / config files)
- Scheduler/Cron (for automated backups)
- Event Bus
- Audit/Logs

## Preconditions
- Admin với quyền backup/restore.
- Storage destination configured and reachable.

## Postconditions
- Backup archive saved in storage with metadata; restore operation recreates data to expected state or creates staging environment.

---

## Main Flow (Manual backup)
Participants: Admin → UI → API Gateway → BackupService → Database / FileStore → BackupService → Storage → DB

1. Admin requests `POST /api/backup` or triggers from UI selecting scope (full DB, partial collections, config only).
2. API Gateway authenticates and authorizes.
3. BackupService validates request and creates a backup job record in DB with status `running`.
4. BackupService performs database dump (e.g., `mongodump` or native export) and collects config files.
5. BackupService compresses dump with metadata (timestamp, version, checksum) and uploads to configured storage (S3/local backup location).
6. On success, BackupService updates job record to `completed` and stores backup metadata (path, checksum, size).
7. Event `BACKUP_COMPLETED` emitted and Admin UI displays backup result.

## Main Flow (Automated scheduled backup)
Participants: Scheduler → BackupService → Storage → Event Bus

1. Scheduler triggers BackupService job at configured cron.
2. Same steps as manual backup.

## Main Flow (Restore)
Participants: Admin → UI → API Gateway → RestoreService → Storage → RestoreService → Database → Event Bus → UI

1. Admin selects backup file and issues `POST /api/restore` with backup id and options (overwrite, restore to staging).
2. API Gateway authenticates and authorizes.
3. RestoreService creates a restore job record with status `running`.
4. RestoreService downloads backup archive from storage, verifies checksum.
5. RestoreService applies DB restore (e.g., `mongorestore`) to target database (production or staging as selected).
6. On success, job status set to `completed`, `RESTORE_COMPLETED` event emitted.
7. Notify Admin of completion and any warnings (e.g., schema mismatch, partial restore).

## Alternate Flows
- AF1: Storage unreachable — job fails and retries per backoff policy; notify admin.
- AF2: Checksum mismatch — abort restore and mark job `failed`.
- AF3: Version/schema mismatch — require staging restore and manual verification.

## Data contracts
- Backup job record:
```json
{ "id":"bk-123", "scope":"full-db", "startedAt":"...","completedAt":"...","status":"completed","location":"s3://bucket/backups/bk-123.tar.gz", "checksum":"abcd1234" }
```

## Diagram notes
- Sequence diagrams: backup flow (Admin→API→BackupService→DB→Storage), restore flow (Admin→API→RestoreService→Storage→DB).
- Communication diagram: show storage (S3) as external; BackupService interacts with DB and storage; Event Bus for job results; scheduler for automated backups.

## Safety & best practices
- Always support restore to staging before production overwrite.
- Keep retention policy and automatic pruning of old backups.
- Encrypt backups at rest; support KMS for keys.
- Test restores periodically and store restore runbook.

## Test cases
1. Execute backup job; verify archive in storage and checksum.
2. Restore archive to staging and validate key collections and app start.

---

File: `docs/use-cases/UC14_Backup_Restore.md`