import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/about", label: "About" },
  { to: "/safety", label: "Safety" },
  { to: "/help", label: "Help Center" },
  { to: "/contact", label: "Contact" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms" },
  { to: "/pricing", label: "Pricing" },
] as const;

export function TrustFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <p className="text-sm text-muted-foreground">
          CHAT STATION is a free 18+ random video chat. Be kind, stay safe, and skip anyone
          who makes you uncomfortable.
        </p>
        <nav aria-label="Site pages" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} CHAT STATION · chatstation.in
        </p>
      </div>
    </footer>
  );
}
