import { normalizeSettings } from "./settings.js";
const fields = ["enabled", "auto", "threshold", "delay"];
const data = await chrome.storage.local.get("settings");
const settings = normalizeSettings(data.settings);
for (const key of fields) {
  const e = document.getElementById(key);
  if (e.type === "checkbox") e.checked = settings[key];
  else e.value = settings[key];
  e.addEventListener("change", async () => {
    settings[key] = e.type === "checkbox" ? e.checked : Number(e.value);
    try {
      await chrome.storage.local.set({ settings: normalizeSettings(settings) });
      await refresh();
    } catch {
      document.getElementById("status").textContent =
        "Settings could not be saved. Please reopen the popup.";
    }
  });
}
async function refresh() {
  const status = document.getElementById("status");
  if (!settings.enabled) {
    status.textContent = "Suggestions are paused.";
    return;
  }
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const reply = await chrome.tabs.sendMessage(tab.id, { type: "status" });
    status.textContent =
      reply?.status === "ready"
        ? "Ready in your Arduino editor."
        : "Open Code → Text in an editable Arduino circuit. Reload Tinkercad after installing.";
  } catch {
    status.textContent =
      "Open a Tinkercad circuit to get started. Reload it after installing.";
  }
}
await refresh();
