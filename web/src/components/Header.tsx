import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/asistente", label: "Médico Virtual" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b-2 border-sun-gold/25 bg-botanical/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-forest to-leaf-bright text-lg text-white shadow-md ring-2 ring-sun-gold/30">
            🌿
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight text-forest">Farmacia Viva</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-sun-amber">
              Plantas medicinales
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-forest transition hover:bg-cream hover:text-leaf-bright"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
