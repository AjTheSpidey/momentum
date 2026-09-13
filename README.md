# Momentum

> A fun, simple three-hour project built **WITH AI** because I was bored.

Momentum turns a messy task dump into a realistic daily plan: three focused tasks, a lightweight inbox, recurring rhythms, and a history view that keeps progress visible without turning productivity into a scoreboard.

## Why it is useful

- **Choose less:** Today highlights three meaningful items instead of presenting an endless list.
- **Capture quickly:** Inbox keeps ideas and future work out of the way until they are ready.
- **Keep rhythms:** Repeating routines can run every day or on selected weekdays.
- **Stay flexible:** Tasks can stay in the inbox, land on Today, or be scheduled for a specific date.
- **Own your data:** Momentum stores tasks and routines in the device's browser storage. There is no account, server sync, analytics pipeline, or database in this app. Clearing site/app data removes the local copy, so export or backup support can be added later if needed.

## Downloadable apps

The web app is the source of truth for every package:

- **Windows:** `.exe` installer built with Electron Builder.
- **Linux:** `.AppImage` and `.deb` packages built with Electron Builder.
- **Android:** `.apk` package built with Capacitor and Gradle.

GitHub Releases are used for these binary downloads. GitHub Packages is designed for registries such as npm and containers; Releases are the safer, user-friendly place for installers and APKs. The release workflow in `.github/workflows/release.yml` builds the web bundle, Windows installer, Linux packages, and Android APK from the same source.

The Android workflow currently produces a debug APK for direct installation and testing. A future signed release APK should use a maintainer-owned keystore stored in GitHub Actions secrets before publishing to an app store.

## Development

Requirements: Node.js 22+ and pnpm 10+.

```bash
pnpm install
pnpm run dev
```

Useful checks:

```bash
pnpm run typecheck
pnpm run build:web
pnpm run typecheck
pnpm run build
```

Build desktop packages locally on the matching operating system:

```bash
pnpm run package:desktop
```

Android builds are intentionally performed in GitHub Actions, where the Android SDK and Gradle toolchain are reproducible. See `.github/workflows/release.yml`.

## Privacy and storage

Momentum is local-first by design. Tasks and routine completions are serialized into `localStorage` on the current browser profile. Electron and Capacitor package the same frontend, so their data also stays on that device. No backend is required for normal use, and uninstalling or clearing app storage may remove the data.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the pull-request workflow. Please open an issue before larger changes so the project stays intentionally small and calm.

## License

MIT. See [`LICENSE`](./LICENSE).