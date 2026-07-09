# AGENTS.md

## Cursor Cloud specific instructions

This repo is a fork of RustDesk ("ATS Desk" / package `AlbesaMonitoring`): a Rust core
(`librustdesk`) plus two desktop UIs — the modern **Flutter** UI (`flutter/`, primary) and the
legacy **Sciter** UI (default `cargo run` target). Standard build/run commands live in
`CLAUDE.md`, `README.md`, `build.py` and `flutter/run.sh`; this section only records the
non-obvious, durable gotchas for running it here.

### Environment already provided (by the startup update script)
- System build deps (clang, cmake, gtk/gstreamer/pulse/xcb/xdo dev libs, nasm, ninja, xvfb, etc.).
  Note `libstdc++-14-dev` is required because the default `c++` is clang-18 targeting the gcc-14
  toolchain; without it vcpkg's compiler probe fails with `cannot find -lstdc++`.
- The `libs/hbb_common` **git submodule** (all config lives in `libs/hbb_common/src/config.rs`);
  nothing compiles without it.
- **vcpkg** at `~/vcpkg` (built codec libs `libvpx libyuv opus aom`); `VCPKG_ROOT=$HOME/vcpkg`
  must be exported for any `cargo build` (already exported in `~/.bashrc`).
- **Rust stable (1.96.x)** set as the default rustup toolchain. The repo's pinned floor is 1.75,
  and the app builds on the base image's 1.83, but the full `cargo test --workspace` needs
  Rust ≥1.87 because `hbb_common`'s **dev-dependency** `webrtc 0.14` pulls `webrtc-util 0.12`
  (uses the `is_multiple_of` API stabilized in 1.87). The app itself does not use that dev-dep.
- **Flutter 3.32.0** at `~/flutter` (on `PATH` via `~/.bashrc`). The CI still pins Flutter 3.24.5,
  but that is stale: the committed `flutter/pubspec.lock` requires `dart >=3.8.0` / `flutter >=3.29`
  (because `extended_text 15.0.2` needs Dart ≥3.7). Flutter 3.24.5 fails `pub get`.
- **libsciter-gtk.so** downloaded to `~/libsciter-gtk.so`; it must sit next to the built binary
  (e.g. `target/debug/libsciter-gtk.so`) for the Sciter UI to launch.

### Building
- Flutter core lib: `VCPKG_ROOT=$HOME/vcpkg cargo build --features flutter --lib`
  → produces `target/debug/liblibrustdesk.so`.
- Flutter Linux app: `cd flutter && flutter build linux --debug`
  → bundle at `flutter/build/linux/x64/debug/bundle/rustdesk`. CMake copies
  `target/<debug|release>/liblibrustdesk.so` into the bundle, so you MUST run the `cargo build`
  step above first (the Flutter build does not run cargo itself).
- Sciter (legacy) desktop: `VCPKG_ROOT=$HOME/vcpkg cargo build` → `target/debug/AlbesaMonitoring`
  (copy `~/libsciter-gtk.so` into `target/debug/` before running).

### Running (headless)
- No physical display: use the X server on **`DISPLAY=:1`** (the desktop the test/computer tooling
  sees) so the app renders with a window manager + working GL. A bare `Xvfb :99` also works for a
  smoke test but has no WM.
- The app is **single-instance** (IPC socket at `/tmp/RustDesk/ipc`). Kill any running instance
  before launching another UI, or the second one just defers to the first.
- On first launch the core registers with the public rendezvous server `rs-ny.rustdesk.com`,
  obtains a device ID + one-time password, and the status turns green "Ready". The repeated
  `failed to connect to ipc_service` / IPv6 warnings at startup are normal.

### Known issue — Flutter Linux UI renders a blank body
The Flutter Linux app builds and launches and the Rust backend initializes fully, but the main
window body renders **blank/white**. Cause: an unhandled `Null check operator used on a null value`
in `DesktopTabController.jumpTo` (`flutter/lib/desktop/widgets/tabbar_widget.dart:163` →
`PageController.jumpToPage` before the `PageView` has laid out) under Flutter ≥3.29. This is a
latent code/version bug (the fork is Windows-first). For a working GUI demo on Linux, use the
**Sciter** build, which renders the full home screen (ID, password, "Control Remote Desktop",
"Ready" status) and drives the real connection flow. Do not "fix" this by editing source unless
asked.

### Lint / test
- Rust tests: `cargo test --workspace --no-fail-fast -- --skip test_get_cursor_pos --skip test_get_key_state`
  (matches CI; needs the stable toolchain as noted above).
- Rust lint: `cargo clippy` (CI has clippy commented out).
- Flutter lint: `cd flutter && flutter analyze` (there are many pre-existing issues, incl. errors in
  the leftover template `flutter/test/widget_test.dart`).
