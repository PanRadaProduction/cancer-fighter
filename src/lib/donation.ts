export const DONATION = {
  platform: "Tipply",
  url: "https://qr.tipply.pl/q/886sLO",
  qrPath: "/donate-qr.png",
  cta: "Zeskanuj telefonem i wesprzyj walkę z rakiem dziecięcym",
  cause: "Charytatywna gra Cancer Fighter — Heroes of Hope",
} as const;

export type Donation = typeof DONATION;
