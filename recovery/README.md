# Catalog recovery snapshot

`catalog-snapshot.json` is the **real storefront catalog — 18 bags** as it stood
at the last local production build of this project (`.next`, 21 Sep). It was
recovered from the serialized React payload in that build output, not from the
database.

It exists because the Supabase project the site reads from
(`lmxrtgvfqjuxjhpejipn.supabase.co`) stopped resolving in DNS — Google and
Cloudflare both answer `NXDOMAIN` for it. With the database unreachable the site
fell back to the seven demo bags in `lib/products.ts`, which is why the real
bags "disappeared" from the site. Nothing was deleted by the app.

## Do this first

1. Open <https://supabase.com/dashboard>.
2. If the project shows **Paused** — press **Restore**. Free projects pause after
   about a week of inactivity, and restoring brings back every row *and* every
   uploaded photo. Don't wait: paused free projects are eventually removed.
3. If the project is gone, create a new one, run `supabase/schema.sql` against
   it, update `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   and `SUPABASE_SERVICE_ROLE_KEY` in Vercel, redeploy — then use the snapshot
   below to put the catalog back.

Restoring the project is always the better route. The snapshot has every bag's
name, material, dimensions, price, description, category and stock status, but
**11 of the 18 bags point their photos at Supabase Storage**, and those image
files only exist inside that project. Restore brings them back; re-creating from
the snapshot does not — those 11 photos would have to be uploaded again from the
admin panel.

## Putting the catalog back from the snapshot

Only needed if the project could not be restored. The script never touches a bag
that already exists, so it is safe to re-run.

```bash
node scripts/restore-products.mjs
```

That prints what it would insert and changes nothing. To actually write:

```bash
node scripts/restore-products.mjs --apply
```

It needs `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in
`.env.local` (`vercel env pull .env.local` fetches them).
