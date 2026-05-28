# Facebook Listing Import

This pipeline imports listings in reviewable stages:

1. `npm run facebook:fetch` writes raw Graph API posts to `data/facebook-import/raw-posts.json`.
2. `npm run facebook:extract` asks the configured AI model to structure posts into property payloads and writes `extracted-listings.json`.
3. `npm run facebook:validate` splits extracted listings into:
   - `valid-listings.json`
   - `needs-review-listings.json`
   - `rejected-listings.json`
4. `npm run facebook:import` inserts only `valid-listings.json` into MongoDB through Prisma.

Required environment values:

```env
FACEBOOK_PAGE_ID=
FACEBOOK_PAGE_ACCESS_TOKEN=
FACEBOOK_IMPORT_OWNER_EMAIL=
AI_API_KEY=
AI_MODEL=
```

Optional `postDetail` fields are intentionally omitted unless they are explicitly found in the Facebook post or supplied in a reviewed payload. Do not default amenities like `hasGym`, `hasSecurity`, or distances to `false` or `0` unless the source text actually says so.
