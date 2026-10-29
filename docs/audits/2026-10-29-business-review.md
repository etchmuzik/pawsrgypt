# Paws Egypt business workflow review — 29 October 2026

Scope: repository review of storefront checkout, website payment callbacks, staff order views, inventory availability, receipt summaries and email transport. This is not a financial statement audit or a fresh verification of all live settings.

## Verified code findings

- Delivery remains hardcoded to zero in both browser checkout and server pricing. Product creation/editing has no delivery-cost field. Adding a field alone would not change the amount charged; server pricing, cart display, saved orders and provider invoice must agree.
- Website orders and payment statuses are visible to authorized staff. Confirmed production online receipts are separated from POS invoices; unpaid, staging and labelled test orders are excluded.
- The paid webhook verifies signature and provider invoice before marking a payment paid. It does not reserve/decrement stock, create a sales invoice or post accounting entries.
- Website order detail screens display fulfillment status but do not provide fulfillment transition controls.
- Email transport falls back to logging when RESEND_API_KEY is absent. Actual production delivery and domain verification require live verification.
- Temporary stock values and untracked-stock ordering were explicitly authorized previously. They must not be treated as verified physical inventory for buying or margin decisions.

## Ranked quick wins

1. Configurable product delivery charges with a clear cart aggregation rule; default existing products to zero and show charges before payment.
2. Staff fulfillment controls: confirmed, packed/shipped, delivered and cancelled, with actor/time history and a separate payment state.
3. Verify customer confirmation and internal new-order email delivery; expose delivery failures to staff.
4. Add staff order search/filter/export by date, payment and fulfillment status.
5. Reconcile temporary quantities against physical stock and label untracked inventory clearly in staff views.
6. Define stock reservation/decrement and cancellation restoration once, with idempotency, before automating fulfillment.
7. Reconcile website receipts with POS/accounting without duplicate invoices; specify how COD collection is recorded.

## Delivery decision pending

Choose per unit, once per distinct product, or highest product fee once per order. This changes the amount charged for multi-item carts and must be decided before activation. Preserve historical order shipping amounts. Validate nonnegative EGP amounts and calculate payable totals on the server. Confirm tax treatment before changing the existing tax calculation.

## Acceptance still required

A successful owner-completed real purchase, verified callback and matching staff receipt; actual email delivery; fulfillment/COD collection handling; actual inventory reconciliation; backups and restoration access. No new real charge was made during this review.
