export function Footer() {
  return (
    <footer className="mt-10 flex items-center justify-between border-t border-border px-1 py-5 text-xs text-muted">
      <span>© {new Date().getFullYear()} LASG PTS 2.0</span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-status-good" />
        All systems operational
      </span>
    </footer>
  );
}
