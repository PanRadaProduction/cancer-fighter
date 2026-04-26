import Image from "next/image";
import { DONATION } from "@/lib/donation";

type DonateQRProps = {
  size?: number;
  showCta?: boolean;
  className?: string;
};

export function DonateQR({
  size = 220,
  showCta = true,
  className = "",
}: DonateQRProps) {
  return (
    <a
      href={DONATION.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${DONATION.cta} — ${DONATION.platform}`}
      className={`group inline-flex flex-col items-center gap-3 ${className}`}
    >
      <div className="rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/10 transition-transform duration-200 group-hover:scale-[1.02] group-focus-visible:scale-[1.02]">
        <Image
          src={DONATION.qrPath}
          alt={`Kod QR donacji — ${DONATION.platform}`}
          width={size}
          height={size}
          priority
          unoptimized
        />
      </div>
      {showCta && (
        <p className="max-w-xs text-center text-sm text-white/90">
          {DONATION.cta}
        </p>
      )}
    </a>
  );
}
