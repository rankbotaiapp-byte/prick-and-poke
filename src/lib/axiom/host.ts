import { BUSINESS } from "@/config/business";

/** Public shop for this install. Customers land here when one-shop is on. Desk is /admin. */
export const HOST_SLUG = BUSINESS.active ? BUSINESS.id : "ember-fade";
