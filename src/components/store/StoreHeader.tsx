import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Menu, X, Gamepad2 } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";
import { useCart } from "@/context/cart";
import { settingsQuery } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { to: "/", label: "Beranda" },
  { to: "/shop", label: "Toko" },
  { to: "/join-grup", label: "Join Grup" },
  { to: "/track", label: "Lacak Pesanan" },
];

export function StoreHeader() {
  const { count } = useCart();
  const { data: settings } = useQuery(settingsQuery());
  const [open, setOpen] = useState(false);
  const siteName = settings?.general.site_name ?? "AZ Group";
  const supportEnabled = settings?.support?.support_enabled;

  const links = supportEnabled
    ? [...navLinks, { to: "/dukung-admin", label: "Dukung Admin" }]
    : navLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt={`Logo ${siteName}`} width={40} height={40} className="h-9 w-9" />
          <span className="font-display text-xl font-bold tracking-tight">
            {siteName.split(" ")[0]}
            <span className="text-gradient"> {siteName.split(" ").slice(1).join(" ")}</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/cart" aria-label="Keranjang">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>

          <div className="md:hidden">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="mt-8 flex flex-col gap-1">
                  {links.map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
                      activeProps={{ className: "text-foreground bg-secondary" }}
                      activeOptions={{ exact: l.to === "/" }}
                    >
                      <Gamepad2 className="h-4 w-4" /> {l.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}