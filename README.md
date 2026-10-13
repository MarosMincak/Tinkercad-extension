# TinkerComplete

**Code completion for Tinkercad Circuits.** Arduino suggestions, TAB snippets, and compact English documentation. Everything runs locally, without AI, accounts, or telemetry.

Independent community extension; not affiliated with Autodesk, Tinkercad, or Arduino.

## Install for development

Requires Node.js 20.19+ and Chrome 111+ (use a current stable Chrome release).

```sh
npm ci
npm run build
```

1. Open Chrome's extension manager (`chrome://extensions`).
2. Enable **Developer mode**, choose **Load unpacked**, and select this project's **dist** folder.
3. Reload any Tinkercad tab that was already open.
4. Open an Arduino circuit and choose **Code → Text**. Type `pin`, then press **TAB**.

The `dist` folder is the extension. The repository root and the ZIP itself are not unpacked-extension folders. If you download a ZIP, extract it first and select the folder containing `manifest.json`.

## What it does

- Arduino Uno function and constant suggestions, including `Serial` and `String` methods.
- Your sketch's variable names, function names/parameters, basic declared types, and macros. Suggestions respect ordinary block and function scope.
- Templates for `if`, `ifelse`, `for`, `while`, `dowhile`, `switch`, `case`, `setup`, `loop`, `function`, `array`, `const`, `struct`, `enum`, `class`, `return`, `break`, and `continue`.
- Functions insert editable arguments; TAB selects the first argument. Repeated fields such as the index in a `for` loop update together.
- Automatic suggestions after two characters (120 ms delay), immediately after a member-access dot, or manually with Ctrl + Space. Both automatic settings are configurable in the extension popup.
- Compact descriptions; click **i** or press **Alt + I** for parameters, examples where available, and a reference link.
- Suggestions avoid comments and strings. Existing call arguments, normal TAB indentation, and editor Undo/Redo remain under CodeMirror's control.
- Only editable C++ text editors are enabled. Blocks, Blocks + Text, Python, and read-only/simulation states are ignored.

### Keyboard

| Key                        | Action                                           |
| -------------------------- | ------------------------------------------------ |
| Ctrl + Space / Alt + Space | Show suggestions                                 |
| ↑ / ↓                      | Select suggestion                                |
| TAB / Enter                | Accept selected suggestion                       |
| TAB / Shift + TAB          | Next / previous snippet field                    |
| Alt + I                    | Toggle expanded documentation                    |
| Escape                     | Close suggestions; press again to exit a snippet |

Operating systems can reserve shortcuts. Alt + Space is an alternative to Ctrl + Space. TAB is only intercepted when a suggestion or snippet field is active.

### Bundled library catalogs

`Servo.h`, `LiquidCrystal.h`, `LiquidCrystal_I2C.h`, `Wire.h`, `EEPROM.h`, `SPI.h`, `Stepper.h`, `SoftwareSerial.h`, `Adafruit_NeoPixel.h`, `Keypad.h`, and `SD.h`.

Type `#include <` for header suggestions. A completed include enables the matching catalog. For example, after `#include <Servo.h>` and `Servo arm;`, typing `arm.` offers servo methods. Libraries are not downloaded or installed. Catalogs describe common APIs, not every overload; the simulator decides which library/version can actually compile. LiquidCrystal_I2C uses the common `init()` variant.

## Build, test, and package

```sh
npm test          # Pure completion logic + real CodeMirror 4.7 integration in JSDOM
npm run check     # Tests, build, manifest/offline bundle validation
npm run package   # release/tinkercomplete-0.1.0.zip
npm run dev       # Local test page on http://127.0.0.1:4173/things/demo/editel
```

An optional GitHub Actions configuration is included in `docs/ci-workflow.example.yml`. To enable it, a maintainer with workflow write permission can copy it to `.github/workflows/check.yml`. It is not active in this branch.

The preview is a local CodeMirror 4.7 compatibility fixture, not Tinkercad. It runs the same editor bundle. It does not test Chrome's extension installation, isolated-world storage bridge, or Tinkercad's save/simulation pipeline. See [verification notes](docs/VERIFICATION.md) and [Chrome Web Store handoff](docs/STORE.md).

The CodeMirror 4.7 **development-only** dependency deliberately matches the version observed in Tinkercad. It has a known upstream advisory and must not be used as a new production editor. It is **not packaged** in the extension; production uses Tinkercad's existing editor. Production dependencies pass `npm audit --omit=dev` at the recorded verification date.

## Architecture

- Manifest V3, restricted to `https://www.tinkercad.com/*` for Tinkercad SPA navigation; runtime attaches only under `/things/:id/editel`.
- The `MAIN` content script accesses the existing CodeMirror instance, registers a native keymap, and performs changes through the editor API. No replacement editor or private Autodesk API.
- An isolated script reads local preferences and sends only validated settings into the page. The page cannot ask it to write storage or make network requests.
- Lezer C++ parsing supplies a local symbol index. Original catalogs and snippet templates are bundled. The popup uses a Shadow DOM boundary and text-only rendering for all content.
- Editor instances are discovered as panels open; swapped documents and removed instances clear snippets and listeners.

No public service/API, backend, API key, remote JavaScript, or remote catalog is required. Third-party notices for the bundled MIT-licensed Lezer packages are generated into `dist/THIRD_PARTY_NOTICES.txt`.

## Limits

This is a completion assistant, not a C++ compiler or full language server. It does not perform full type inference, macro expansion, overload resolution, template deduction, inheritance lookup, or arbitrary user-defined class member completion. Complex conditional compilation can produce extra suggestions. Catalogs target ordinary Arduino Uno sketches. Analysis is capped at 120,000 characters to avoid freezing the editor.

Nested function snippets replace the active snippet session; plain variable and constant completions inside an argument preserve its remaining TAB stops. No AI, remote library loading, linting, circuit editing, or simulation control is included.

Tinkercad may change its editor implementation. If its expected editor is unavailable, the extension does not edit code; the popup shows a waiting state. Reload after installing/updating, and check Text mode, Arduino selection, and edit permissions.

[Privacy](docs/PRIVACY.md) · [API sources](docs/SOURCES.md) · [Report a problem](https://github.com/MarosMincak/Tinkercad-extension/issues)
