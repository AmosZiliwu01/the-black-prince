export function formatCurrency(amount: number, symbol = "$") {
  return `${symbol}${Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Payment",
  awaiting_verification: "Awaiting Verification",
  verified: "Payment Verified",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_ORDER = [
  "pending",
  "awaiting_verification",
  "verified",
  "processing",
  "completed",
];
