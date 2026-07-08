export function formatCurrency(amount: number, symbol = "$") {
  return `${symbol}${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu Pembayaran",
  awaiting_verification: "Menunggu Verifikasi",
  verified: "Pembayaran Terverifikasi",
  processing: "Sedang Diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
};

export const ORDER_STATUS_ORDER = [
  "pending",
  "awaiting_verification",
  "verified",
  "processing",
  "completed",
];
