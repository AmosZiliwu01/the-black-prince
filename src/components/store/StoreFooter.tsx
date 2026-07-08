import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, Instagram, Facebook } from "lucide-react";
import logo from "@/assets/logo.png";
import { settingsQuery } from "@/lib/store";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.01c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.076.076 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.955 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />
    </svg>
  );
}

interface SocialLink {
  key: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export function StoreFooter() {
  const { data: settings } = useQuery(settingsQuery());
  const siteName = settings?.general.site_name ?? "AZ Group";
  const contact = settings?.contact;

  const socials: SocialLink[] = [];

  if (contact?.whatsapp_number) {
    socials.push({
      key: "whatsapp",
      href: "https://wa.me/" + contact.whatsapp_number.replace(/\D/g, ""),
      icon: MessageCircle,
      label: "WhatsApp",
    });
  }
  if (contact?.discord) {
    socials.push({ key: "discord", href: contact.discord, icon: DiscordIcon, label: "Discord" });
  }
  if (contact?.instagram) {
    socials.push({ key: "instagram", href: contact.instagram, icon: Instagram, label: "Instagram" });
  }
  if (contact?.tiktok) {
    socials.push({ key: "tiktok", href: contact.tiktok, icon: TikTokIcon, label: "TikTok" });
  }
  if (contact?.facebook) {
    socials.push({ key: "facebook", href: contact.facebook, icon: Facebook, label: "Facebook" });
  }

  return (
    <footer className="mt-20 border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt={"Logo " + siteName} width={36} height={36} className="h-8 w-8" loading="lazy" />
            <span className="font-display text-lg font-bold">{siteName}</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            {settings?.general.tagline ?? "Toko Roblox Premium"}. Pengiriman instan, harga terbaik, dan dukungan terpercaya {settings?.general.support_hours ?? "setiap hari"}.
          </p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Jelajahi</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/shop" className="hover:text-foreground">Toko</Link>
            </li>
            <li>
              <Link to="/track" className="hover:text-foreground">Lacak Pesanan</Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-foreground">Keranjang</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Hubungi Kami</h4>
          {socials.length > 0 ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <li key={s.key}>
                    <a href={s.href} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground">
                      <Icon className="h-4 w-4" /> {s.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada kontak yang tersedia.</p>
          )}
        </div>
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteName}. Hak cipta dilindungi.
      </div>
    </footer>
  );
}