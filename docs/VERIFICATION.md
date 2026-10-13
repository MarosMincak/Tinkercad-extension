# Verification — 0.1.0

Date: October 13, 2026.

## Automated

`npm run package` passes 24 tests, builds the extension, validates the manifest and icons, checks for unexpected networking or dynamic execution primitives, and creates the release ZIP.

Coverage includes:

- Prefix matching, case-insensitive matching, camel-case initials, and replacing a partially typed identifier.
- Comments, ordinary strings, raw strings, include completion, and include-controlled library availability.
- Variables, parameter scope, prototypes, functions, nested scope, shadowing, and incomplete function bodies.
- Serial/String/Servo methods and nested SPI default arguments.
- Semicolons in statements versus expressions, preserving existing parentheses/arguments, multiline indentation, linked snippet fields, and final cursor placement.
- Integration with the actual CodeMirror 4.7 library in JSDOM: TAB/Shift+TAB, replacing and deleting placeholders, Undo, document swaps, read-only/Python rejection, Escape, info buttons, cancellation, and nested constant completion.
- Pending native textarea input immediately before TAB, including linked loop fields. This regression was discovered in the real browser; using CodeMirror's native keymap avoids losing the final typed character.
- Settings bridge validation, preference propagation, status replies, ignored foreign origins, and rejected page-side write requests.

`npm audit --omit=dev`: zero vulnerabilities. The intentionally pinned CodeMirror 4.7 development fixture has a known upstream advisory; it is excluded from the production bundle.

## Browser checks

The supplied signed-in Tinkercad circuit was inspected without modifying its sketch. Its loaded application assets establish CodeMirror 4.7, the wrapper instance property, Arduino C++ mode, and read-only behavior for Blocks + Text. This was integration discovery, not a loaded-extension end-to-end test.

In a local browser fixture using CodeMirror 4.7 and the same production editor bundle:

- `pin` opens `pinMode`; TAB inserts the function and selects `pin`.
- Typing `LED_BUILTIN` followed immediately by TAB retains the final `N` and selects `OUTPUT`.
- `for` inserts a loop; replacing `i` with `index` changes all three occurrences and TAB selects `0`.
- `#include <Servo.h>` plus `Servo arm;` enables `arm.` suggestions.
- `Serial.` opens its method list, and the info button / Alt+I expands documentation.
- Suggestions are visually checked next to the cursor, including expanded information near the bottom of the window.

## Before publication

The remaining owner acceptance check is to load `dist` into an actual Chrome extension session and test on a disposable Tinkercad circuit, especially settings persistence, save/reload, simulation, component changes, and Text versus Blocks + Text. This environment's in-app browser does not expose an extension-installation API, so this check is not claimed as completed. Capture real Tinkercad screenshots for the store after this check. The included demo must not be presented as a screenshot of Tinkercad.

Publication, store review, and publisher account details are not performed by this build.
