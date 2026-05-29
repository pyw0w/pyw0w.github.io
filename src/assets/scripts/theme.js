export function initTheme() {
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) return;

  const updateThemeColor = () => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    themeColor.setAttribute('content', isDark ? '#1a1a2e' : '#ffffff');
  };

  updateThemeColor();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor);
}
