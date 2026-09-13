# Contributing to Momentum

Thanks for helping with Momentum.

## Before you start

1. Open an issue for a new feature or a larger behavior change.
2. Keep the local-first promise: do not add a server, analytics, account system, or remote storage without a clearly documented opt-in decision.
3. Keep the web, desktop, and Android builds aligned with the same frontend behavior.

## Pull requests

1. Fork the repository or create a branch from `main`.
2. Make a focused change.
3. Run:

   ```bash
   pnpm install
   pnpm run typecheck
   pnpm run build:web
   ```

4. Describe the user-facing change and how you verified it.
5. Open a pull request into `main`.

All changes to `main` go through pull requests and required CI checks. Direct pushes and force pushes are disabled for the protected branch; only repository maintainers may merge approved changes.

## Style

- Prefer small, readable components and existing design tokens.
- Preserve keyboard access, responsive layouts, and clear empty states.
- Avoid native date pickers when a custom Momentum-styled control is appropriate.
- Do not commit secrets, signing keys, generated Android build output, or local data.