import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/asistente", label: "Asistente" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-forest/10 bg-botanical/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-hero-green text-lg text-white shadow-sm">
            🌿
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-forest">Farmacia Viva</p>
            <p className="text-xs text-earth-soft">Plantas medicinales</p>
          </div>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-forest transition hover:bg-mint-light hover:text-forest"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
