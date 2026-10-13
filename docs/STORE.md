# Chrome Web Store handoff

## Upload artifact

Run `npm ci` then `npm run package`. Upload `release/tinkercomplete-0.1.0.zip`. Its root contains `manifest.json`; no node_modules, demo, tests, remote scripts, or development server are included.

This repository prepares an upload candidate. Store submission and publication are performed by the repository owner. Approval is not guaranteed.

## Listing draft

**Name:** TinkerComplete — Code Completion for Tinkercad

**Short description:** Arduino autocomplete, TAB snippets and compact documentation for Tinkercad Circuits. Local, fast, and AI-free.

**Language:** English

**Category suggestion:** Developer Tools

**Detailed description:**

Write Arduino code with fewer interruptions in Tinkercad Circuits. TinkerComplete brings compact suggestions to the line you are editing.

- Complete Arduino functions, constants, and your own sketch's variables and functions.
- Insert calls with editable arguments and move between them using TAB.
- Create loops, conditions, arrays, functions, and other common C++ structures with snippets.
- Explore Serial methods and bundled library catalogs, including Servo, LCD, Wire, EEPROM, SPI, and NeoPixel.
- Read a short explanation, then open more information when you need it.
- Keep suggestions on your computer: no AI, accounts, telemetry, or code uploads.

Open an Arduino circuit, choose Code → Text, and start typing. Press Ctrl + Space to request suggestions, use arrow keys to select, and TAB to insert. Settings let you pause completion or change automatic suggestion timing.

Supports the editable Arduino Text editor in Tinkercad Circuits. It does not add unsupported libraries to the simulator or replace a full C++ compiler/language server.

Independent community extension. Not affiliated with or endorsed by Autodesk, Tinkercad, or Arduino.

## Privacy and permission explanations

**Single purpose:** Assist editing Arduino code in Tinkercad Circuits through local completions, snippets, and function documentation.

**Tinkercad site access:** Find and integrate with the existing Circuits editor, including navigation to it from Tinkercad's dashboard. The runtime is limited to the Arduino text editor on circuit editing routes.

**Storage:** Save completion enablement, automatic suggestion preference, delay, and prefix threshold locally.

**Remote code:** No remote code or remote catalogs. All extension logic and catalogs are packaged.

**Data handling:** Code is processed locally for suggestions and is not collected or transmitted by the extension. Complete the current dashboard declarations to match this behavior.

**Privacy URL:** Publish/link the policy in `docs/PRIVACY.md` on a stable public URL. The extension also includes an offline copy in `privacy.html`.

## Owner's pre-submission checklist

- Install the ZIP unpacked in a current stable Chrome and test a disposable Tinkercad Arduino circuit. Verify suggestions, TAB, Undo, save/reload, simulator behavior, and mode changes. The local fixture cannot validate Chrome installation or Autodesk saving.
- Capture real extension screenshots in Tinkercad for the listing; do not present the local compatibility demo as Tinkercad.
- Set your publisher contact details and public privacy-policy URL in the store dashboard.
- Check the current required screenshots/promotion assets in the dashboard. Included 16/32/48/128 PNG icons cover the extension itself.
- Upload the archive, complete declarations, and submit for review.

Do not broaden site access or add remote executable code to make review easier.
