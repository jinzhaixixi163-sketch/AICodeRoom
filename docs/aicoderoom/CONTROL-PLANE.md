# AICodeRoom control plane

This document records the first real, non-Mock account and task boundary in the AICodeRoom fork.

## Responsibilities

| Component | Owns | Does not own |
| --- | --- | --- |
| AICodeRoom Server | Accounts, login sessions, project membership, durable task records | Local Git worktrees, terminals, agent processes |
| AO daemon | Local projects, sessions, Git/worktree lifecycle, agent adapters | User accounts, invitations, cloud authorization |
| Desktop app | Authenticated user experience and coordination between the two services | Plaintext password or server credential storage |

The server is additive. It does not replace or modify `session_manager`, lifecycle code, workspace adapters, or agent adapters.

## Implemented first vertical slice

- PostgreSQL migrations for users, hashed sessions, projects, members, and tasks.
- Registration, login, current-user, and logout endpoints.
- Per-user project listing and owner/editor/viewer membership enforcement.
- Durable project and task creation, including a stable link to the local AO project/session IDs.
- Electron account token storage encrypted with the operating system's credential encryption.
- Desktop login gate. Creating a local project or worker task also creates its control-plane record.
- Per-project backup policy persistence for device-only, local mirror, or GitHub targets.
- Local mirror paths remain in Electron's device-local storage; the control plane stores no local absolute paths.
- GitHub repository URLs and branches are accepted only without embedded credentials. OAuth tokens are not stored by this slice.

Passwords are hashed with salted scrypt. Raw access tokens are returned only to the client; the database stores SHA-256 token hashes. Server deployment passwords are deliberately not part of this schema.

## Local development

Prerequisites: Node.js 22+, npm, and PostgreSQL 16+.

```bash
createdb aicoderoom_dev # only once
npm run server:install
npm run server:migrate
npm run server:dev
```

The local server listens on `127.0.0.1:8788` by default. In a second terminal, start the existing desktop development process from `frontend/` as documented in `docs/development.md`.

Configuration is documented in `server/.env.example`. Production must use a restricted PostgreSQL role, TLS at the public edge, an explicit origin allowlist, and a secret manager for later deployment credentials.

## Current boundary

This slice persists a user's project/task metadata, links it to local AO execution, and now persists the user's backup policy. The file mirror watcher, GitHub OAuth/App connection, automatic commits/pushes, conflict recovery, and sync history worker are not implemented yet, so saving a policy must not be presented as a completed backup. Invitations, file upload/object storage, cloud workers, result archives/downloads, and user-approved SSH deployment are also still pending. None of these modules should store plaintext access tokens or server passwords.
