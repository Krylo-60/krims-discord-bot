# Workspace Agent Rules

## 🛡️ Security & Secret Management Rules
- **NEVER hardcode secrets:** Never write plain text API keys, tokens (e.g. Discord tokens, Pterodactyl tokens, Render API keys), database credentials, or private access keys directly in codebase files (such as `.js`, `.mjs`, `.html`, `.json`, etc.).
- **ALWAYS use environment variables:** Load all secrets dynamically from process environment configurations (e.g. `process.env.VARIABLE_NAME`).
- **ALWAYS use gitignored configurations:** Put credentials inside `.env` files. Verify that the `.env` file is present in the `.gitignore` configuration before staging, committing, or pushing any files to remote repositories.

## 📝 Response & Documentation Standard
- **ALWAYS provide a report, summary, and suggestion after every prompt:** After completing any task or prompt, end responses with a clear report, summary of work accomplished, and a helpful next-step suggestion.
- **ALWAYS update the architecture report on D: drive:** Whenever any code, feature, or structural changes are made, immediately append the updates under the `## 📝 Recent Feature & Session Work Log` section in `D:\KryloSMP work Done\krylosmp_architecture_report.md` so the handover documentation stays 100% up-to-date!
