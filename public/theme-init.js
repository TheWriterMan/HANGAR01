// Applies the saved theme before first paint to avoid a dark → light flash.
// Loaded as a blocking external script because the CSP disallows inline scripts.
// Keep the storage key in sync with src/hooks/useTheme.ts.
try {
  if (localStorage.getItem('hangar01-theme') === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
} catch {
  /* storage unavailable — stay on the default dark theme */
}
