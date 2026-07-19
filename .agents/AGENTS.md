# Workspace Agent Rules

## 🛡️ Security & Secret Management Rules
- **NEVER hardcode secrets:** Never write plain text API keys, tokens (e.g. Discord tokens, Pterodactyl tokens, Render API keys), database credentials, or private access keys directly in codebase files (such as `.js`, `.mjs`, `.html`, `.json`, etc.).
- **ALWAYS use environment variables:** Load all secrets dynamically from process environment configurations (e.g. `process.env.VARIABLE_NAME`).
- **ALWAYS use gitignored configurations:** Put credentials inside `.env` files. Verify that the `.env` file is present in the `.gitignore` configuration before staging, committing, or pushing any files to remote repositories.
