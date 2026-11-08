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

// A closed announcement stays hidden before first paint (AnnouncementBanner.tsx).
try {
  var closedAnnouncement = localStorage.getItem('hangar01-announcement-dismissed');
  if (closedAnnouncement) {
    document.documentElement.setAttribute('data-announcement-dismissed', closedAnnouncement);
  }
} catch {
  /* storage unavailable — the banner shows */
}
