import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { JSDOM } from "jsdom";
const bundle = await build({
  entryPoints: ["src/settings-bridge.js"],
  bundle: true,
  format: "iife",
  write: false,
});
test("settings bridge only publishes validated preferences and never accepts page writes", async () => {
  const dom = new JSDOM(
      '<style id="tinkercomplete-runtime" data-status="ready"></style>',
      {
        url: "https://www.tinkercad.com/things/test/editel",
        runScripts: "outside-only",
      },
    ),
    w = dom.window;
  let storageListener, messageListener;
  const sent = [];
  w.postMessage = (message, origin) => sent.push({ message, origin });
  w.chrome = {
    storage: {
      local: {
        get: async () => ({
          settings: { enabled: true, auto: false, delay: 200, threshold: 2 },
        }),
      },
      onChanged: { addListener: (f) => (storageListener = f) },
    },
    runtime: { onMessage: { addListener: (f) => (messageListener = f) } },
  };
  try {
    w.eval(bundle.outputFiles[0].text);
    await Promise.resolve();
    await Promise.resolve();
    assert.equal(sent.at(-1).origin, "https://www.tinkercad.com");
    assert.equal(sent.at(-1).message.settings.auto, false);
    const count = sent.length;
    w.dispatchEvent(
      new w.MessageEvent("message", {
        source: w,
        origin: w.location.origin,
        data: { type: "tinkercomplete:settings", settings: { enabled: false } },
      }),
    );
    assert.equal(
      sent.length,
      count,
      "page messages must not persist or echo settings",
    );
    w.dispatchEvent(
      new w.MessageEvent("message", {
        source: w,
        origin: "https://unrelated.example",
        data: { type: "tinkercomplete:ready" },
      }),
    );
    assert.equal(sent.length, count);
    w.dispatchEvent(
      new w.MessageEvent("message", {
        source: w,
        origin: w.location.origin,
        data: { type: "tinkercomplete:ready" },
      }),
    );
    assert.equal(sent.length, count + 1);
    storageListener(
      {
        settings: { newValue: { enabled: false, delay: -500, threshold: 99 } },
      },
      "local",
    );
    assert.equal(sent.at(-1).message.settings.delay, 0);
    assert.equal(sent.at(-1).message.settings.threshold, 4);
    let status;
    messageListener({ type: "status" }, {}, (value) => (status = value));
    assert.equal(status.status, "ready");
  } finally {
    w.close();
  }
});
