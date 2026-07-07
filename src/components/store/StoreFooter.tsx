import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Mail, Instagram } from "lucide-react";
import logo from "@/assets/logo.png";
import { settingsQuery } from "@/lib/store";

export function StoreFooter() {
  const { data: settings } = useQuery(settingsQuery());
  const siteName = settings?.general.site_name ?? "AZ Group";
  const contact = settings?.contact;

  return (
    <footer className="mt-20 border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt={`${siteName} logo`} width={36} height={36} className="h-8 w-8" loading="lazy" />
            <span className="font-display text-lg font-bold">{siteName}</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            {settings?.general.tagline ?? "Premium Roblox Store"}. Instant delivery, unbeatable
            prices, and trusted support {settings?.general.support_hours ?? "daily"}.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Explore</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/shop" className="hover:text-foreground">Shop</Link></li>
            <li><Link to="/track" className="hover:text-foreground">Track Order</Link></li>
            <li><Link to="/cart" className="hover:text-foreground">Cart</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Get in touch</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {contact?.whatsapp_number && (
              <li>
                <a
                  href={`https://wa.me/${contact.whatsapp_number.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-foreground"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </li>
            )}
            {contact?.email && (
              <li>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-foreground">
                  <Mail className="h-4 w-4" /> {contact.email}
                </a>
              </li>
            )}
            {contact?.instagram && (
              <li>
                <a href={contact.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground">
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteName}. All rights reserved.
      </div>
    </footer>
  );
}
