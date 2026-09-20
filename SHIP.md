# Ship a shop from this template

You only change one file: `src/config/business.ts`.

## Fast path

1. On GitHub open **axiomHalotemplate** → green **Use this template** → new repo named after the shop (`new-hope-tattoos`).
2. In that new repo, open `src/config/business.ts`.
3. Edit only the block that starts with `= {`.
4. Connect that repo to Vercel and deploy.
5. Give the owner two links:
   - shop: `https://their-repo.vercel.app`
   - desk: `https://their-repo.vercel.app/admin`
   - owner PIN: `4242` until they change it

## What to put in business.ts

```
active: true
id: "new-hope-tattoos"      // lowercase, dashes, no spaces
name: "New Hope Tattoos"    // what customers see
niche: "tattoo"             // barber | tattoo | food_truck
halo: "ink"                 // ember | ink | solstice
pin: "4242"
```

Paste Scout over that object if you already ran a hunt. Then still set `active: true`.

Leave photos empty. The owner uploads those in Desk.

## What each person sees

- Customer → the one shop. Not Factory. Not the other niches.
- Owner → `/admin` → **Owner** → `4242`
- Employee → `/admin` → **Chair** → their name → their PIN (`1111` / `2222` on a fresh demo chair)

## Do not

- Do not edit axiomHalotemplate for a client.
- Do not use GitHub **Import repository**.
- Do not change `name: string` lines. Those are types, not the shop.
- Do not delete barber / tattoo / food from the code. `niche` picks one.
