export function getTrackingUrl(
  partner: string | null | undefined,
  trackingNumber: string | null | undefined,
): string | null {
  if (!partner || !trackingNumber) return null;
  switch (partner) {
    case "UPS": return `https://www.ups.com/track?tracknum=${encodeURIComponent(trackingNumber)}`;
    case "FedEx": return `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(trackingNumber)}`;
    case "DHL": return `https://www.dhl.com/en/express/tracking.html?AWB=${encodeURIComponent(trackingNumber)}`;
    default: return null;
  }
}
