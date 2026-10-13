import { defaults, normalizeSettings } from "./settings.js";
let settings = defaults;
const publish = () =>
  window.postMessage(
    { type: "tinkercomplete:settings", settings },
    location.origin,
  );
chrome.storage.local.get("settings").then((data) => {
  settings = normalizeSettings(data.settings);
  publish();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.settings) {
    settings = normalizeSettings(changes.settings.newValue);
    publish();
  }
});
window.addEventListener("message", (e) => {
  if (
    e.source === window &&
    e.origin === location.origin &&
    e.data?.type === "tinkercomplete:ready"
  )
    publish();
});
chrome.runtime.onMessage.addListener((message, _sender, reply) => {
  if (message?.type === "status")
    reply({
      status:
        document.getElementById("tinkercomplete-runtime")?.dataset.status ??
        "waiting",
    });
});
