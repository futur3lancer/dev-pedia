// Runs before React hydrates so the correct theme class is on <html> for
// the very first paint — otherwise a saved "light" preference would flash
// dark (or vice versa) for a frame. Kept as a tiny inline script rather
// than a useEffect, which only runs after the initial render.
const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = window.localStorage.getItem("devpedia-theme");
    var prefersLight =
      stored === "light" ||
      (!stored && window.matchMedia("(prefers-color-scheme: light)").matches);
    if (prefersLight) {
      document.documentElement.classList.add("light");
    }
  } catch (e) {}
})();
`;

export function ThemeScript() {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
