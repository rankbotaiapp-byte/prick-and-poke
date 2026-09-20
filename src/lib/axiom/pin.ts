export async function hashPin(businessId: string, pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(`axiom:v1:${businessId}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Same hash the chair desk checks: hashPin(`crew:${slug}:${memberId}`, pin) */
export async function hashChairPin(slug: string, memberId: number, pin: string): Promise<string> {
  return hashPin(`crew:${slug}:${memberId}`, pin);
}

export function assertPinShape(pin: string): string {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN must be four digits");
  }
  return pin;
}
