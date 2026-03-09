(() => {
  const port = window.HUGO_DRAFT_TOGGLE_PORT || "8765";
  const scheme = window.HUGO_DRAFT_TOGGLE_SCHEME || window.location.protocol.replace(":", "");
  const host = window.location.hostname;
  const base = `${scheme}://${host}:${port}`;

  const button = document.createElement("button");
  button.type = "button";
  button.style.position = "fixed";
  button.style.right = "16px";
  button.style.bottom = "16px";
  button.style.zIndex = "9999";
  button.style.padding = "8px 12px";
  button.style.borderRadius = "999px";
  button.style.border = "1px solid #111";
  button.style.background = "#fff";
  button.style.color = "#111";
  button.style.fontSize = "12px";
  button.style.fontFamily = "system-ui, -apple-system, sans-serif";
  button.style.cursor = "pointer";
  button.textContent = "Drafts: ?";

  const setLabel = (on) => {
    button.textContent = on ? "Drafts: on" : "Drafts: off";
  };

  const fetchState = async () => {
    const res = await fetch(`${base}/state`);
    const data = await res.json();
    setLabel(!!data.drafts);
  };

  button.addEventListener("click", async () => {
    const res = await fetch(`${base}/toggle`, { method: "POST" });
    const data = await res.json();
    setLabel(!!data.drafts);
    setTimeout(() => window.location.reload(), 500);
  });

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(button);
    fetchState();
  });
})();
