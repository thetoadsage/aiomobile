# Browser test instructions

- Maintain a local `memory.md` for project context; keep it Git-ignored and exclude it from commits and release archives.

- Playwright browser processes may crash during macOS GUI application registration inside the Codex sandbox.
- Always use `npm run test:e2e` for browser tests.
- Run `npm run test:e2e` with escalated/outside-sandbox permission when required.
- Do not repeatedly retry Playwright inside the restricted sandbox.
