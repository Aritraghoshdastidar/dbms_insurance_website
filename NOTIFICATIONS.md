# Notifications Implementation Guide

This project implements database-driven notifications using MySQL triggers that write to the `reminder` table, plus backend APIs and a frontend panel to surface them.

## Data model

- Table: `reminder`
  - `notification_id` (PK)
  - `notification_date` (timestamp, default NOW)
  - `status` ENUM-like string: 'PENDING' or 'READ'
  - `message` (text)
  - `type` (e.g., CLAIM_UPDATE, PAYMENT_SUCCESS, POLICY_CREATED, POLICY_RENEWAL)
  - `customer_id` (FK → `customer.customer_id`)

Note: Earlier drafts/reference docs used names like `reminder_notification` or `policy_agent`. The canonical names used by this codebase are `reminder` and `agent_policy`.

## Triggers (DB)

Defined in `database_scripts/03_create_triggers.sql` and supported by `database_scripts/09_trigger_fixes.sql`:

1) after_claim_status_update (AFTER UPDATE ON claim)
   - When claim_status changes, inserts a `CLAIM_UPDATE` notification into `reminder`.

2) after_payment_success (AFTER INSERT ON payment)
   - When a payment row with status 'Success' is inserted, updates the policy to ACTIVE and inserts a `PAYMENT_SUCCESS` notification.
   - Backend’s mock activation now also inserts a canonical row into `payment` to ensure this trigger fires.

3) after_policy_insert (AFTER INSERT ON policy)
   - Attempts to insert a `POLICY_CREATED` notification by looking up `customer_policy`.
   - Some app flows insert the link after the policy; to guarantee the notification is created, use the supporting trigger below.

4) policy_renewal_reminder (BEFORE UPDATE ON policy)
   - If an ACTIVE policy’s end_date moves to within 30 days, inserts a `POLICY_RENEWAL` notification.

5) after_policy_insert_assign_agent (AFTER INSERT ON policy)
   - Assigns the least-loaded agent via `agent_policy`.

6) after_customer_policy_insert_notify (AFTER INSERT ON customer_policy) [supporting, in 09_trigger_fixes.sql]
   - Creates the welcome `POLICY_CREATED` notification reliably when the customer-policy link is created.

## Backend API

Implemented in `server.js`:

- GET `/api/notifications`
  - Returns `{ notifications: [...] }` for the logged-in customer.
  - Optional `?status=PENDING|READ` filter.

- PUT `/api/notifications/:notificationId/read`
  - Marks a notification as `READ` for the logged-in customer.

- POST `/api/policies/:policyId/mock-activate`
  - Besides the existing `initial_payment` write (if present), also inserts a row into `payment` (status 'Success') so DB triggers create a `PAYMENT_SUCCESS` notification and set policy to ACTIVE.

## Frontend UI

- `src/components/NotificationsPanel.js` – reusable panel that lists notifications and lets users mark as read.
- Included at the top of `src/components/Dashboard.js`.

## Verify triggers quickly

Run the setup and fixes (if not already applied):

1) Master setup (creates tables & triggers):
   - `database_scripts/07_master_setup.sql`

2) Supporting fix to ensure welcome notifications on link:
   - `database_scripts/09_trigger_fixes.sql`

### End-to-end checks

1) Claim status update → CLAIM_UPDATE
   - File a claim as a customer, then approve/decline it as admin.
   - Expect a new PENDING notification in the Dashboard panel.

2) Payment success → PAYMENT_SUCCESS
   - Customer clicks “Activate (Mock Pay)” for a policy in Dashboard.
   - Backend inserts into `payment`, trigger fires, policy becomes ACTIVE, notification appears.

3) Policy created → POLICY_CREATED
   - Purchase a policy in Dashboard.
   - Because the app links after creating policy, `after_customer_policy_insert_notify` guarantees the welcome notification.

4) Policy renewal reminder → POLICY_RENEWAL
   - Update an ACTIVE policy’s `end_date` to be within 30 days (via SQL) and save.
   - Expect a PENDING notification.

### Manual DB verification

- Show triggers: `SHOW TRIGGERS FROM dbms_database;`
- Show recent reminders: `SELECT * FROM reminder ORDER BY notification_date DESC LIMIT 20;`

## Notes

- If you previously imported `dbms_database_fixed.sql`, you may have slightly different trigger bodies. Re-running `03_create_triggers.sql` and `09_trigger_fixes.sql` ensures the expected behavior matches this codebase.
