# Fawaterak by Payten payments

The checkout offers cash on delivery and Fawaterak's hosted payment page. Payment methods come from the merchant account on that page; IDs are not hardcoded. Card details stay with the provider.

## Configuration

Set these in the Node server's private environment. See `.env.example` for placeholders. The merchant key must never use a `NEXT_PUBLIC_` name.

| Variable | Value |
| --- | --- |
| `FAWATERAK_API_KEY` | Merchant API key |
| `FAWATERAK_ENVIRONMENT` | `production` for `app.fawaterk.com`, `staging` for `staging.fawaterk.com` |
| `FAWATERAK_ENABLED` | `false` until setup is complete; `true` exposes online checkout |
| `NEXT_PUBLIC_SITE_URL` | `https://pawsegypt.com` on production; a trusted preview origin for testing |
| `SUPABASE_SERVICE_ROLE_KEY` | The existing Paws project's server credential |

Production and staging use separate merchant credentials. `.env.local` is ignored by Git; configuring a local file does not configure the deployed server.

## Database and deployment

1. Use the Paws database account to review and apply `supabase/migrations/20261027195424_fawaterak_payments.sql`. Do not apply the entire historical migration directory blindly: some historical migrations were never committed and the live schema has drifted.
2. Deploy this branch to the actual Hostinger Node application, with the existing Paws environment plus the payment variables. The migration and application must be released in a coordinated maintenance window: the migration removes guest direct writes used by the old checkout.
3. Set the paid webhook URL in the Fawaterak dashboard's Integration settings:

   `https://pawsegypt.com/api/payments/fawaterak/webhook_json`

   Each new invoice also supplies that URL through `redirectionUrls.webhookUrl`. The `_json` suffix is intentional.
4. Confirm `/api/payments/fawaterak` returns JSON directly, without a locale redirect. Confirm a forged callback is rejected and guest REST clients cannot read payment sessions or other people's orders.
5. Complete an end-to-end transaction using **separate staging merchant credentials and an isolated test database/deployment**. Any real-money production acceptance payment requires an agreed amount and a real tester.
6. Enable production checkout with `FAWATERAK_ENABLED=true` once deployment, callback configuration, and acceptance checks are complete.

## Behavior

- Catalog prices and active variants are re-read on the server. A changed total is rejected before an order is created. The existing 14% checkout calculation and free shipping are preserved.
- The service-only `create_website_checkout` function writes the order and payment session in one transaction. Browser retries reuse a unique checkout request ID.
- Payment state is separate from delivery state. A redirect saying “success” cannot mark an order paid.
- A paid callback needs the documented HMAC signature, then a server API lookup that matches invoice ID, key, amount, currency, and paid state. Duplicate callbacks do not duplicate updates.
- Disabling new checkouts still permits callbacks for existing invoices with the configured credentials.
- Pending customers can resume their saved hosted checkout. An uncertain initiation failure retains an order reference and directs the customer to the store before retrying; it does not automatically issue another invoice.
- Refunds, chargebacks, offline reference expiry, inventory reservations, and accounting posting are not automated by this change. Fulfillment status remains staff-controlled.
- Token-protected order pages use a server-side exact-token lookup and are not cached. Payment keys are kept in a table inaccessible to browser roles.

## Validation

```sh
npm run test:payments
bash scripts/test-payments-db.sh
npx tsc --noEmit
npm run build
```

The database test creates a temporary PostgreSQL cluster and removes it when done; it never targets the live database. HTTP route tests mock Supabase and Fawaterak. Browser checks used a mocked availability response and hosted redirect, with no production order insertion.

## Official API references

- [Hosted invoice creation](https://fawaterak-api.readme.io/reference/sendpayment)
- [Available payment methods](https://fawaterak-api.readme.io/reference/initiatepayment)
- [Paid webhook and HMAC](https://fawaterak-api.readme.io/reference/web-hook)
- [Invoice verification](https://fawaterak-api.readme.io/reference/get-transaction-data)
