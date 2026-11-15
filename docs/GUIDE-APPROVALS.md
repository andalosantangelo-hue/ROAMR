# Approving Verified Guides

Guides apply in the app: **Profile → Become a verified guide** (route `/guide/apply`).
Each application is a private document only the guide and admins can see. Nothing is
public until you approve it.

## Review an application

1. Firebase console → **Firestore Database** → collection **`guideApplications`**.
   Each document is named by the guide's user ID; new ones have `status: "pending"`.
2. Check, before approving:
   - **`license`**: look the number up with the issuing state or agency (for example a
     state outfitter/guide licensing board, or a federal land-management permit).
   - **`insuranceProvider` / `insurancePolicy` / `insuranceExpires`**: ask the guide for
     a certificate of insurance and check that it covers guiding and hasn't expired.
   - **`certifications`**: optional, but worth confirming (e.g. Wilderness First Responder).
   - **`fullName`**: should match the licence and the insurance certificate.

## Approve or reject

- **Approve:** change `status` to `approved`. Within a few seconds the guide's profile
  shows **Verified guide · <specialties>** and they get a notification. Only their
  specialties and region go on the profile; licence and insurance details stay private.
- **Reject:** change `status` to `rejected`. The guide is notified and can edit and
  resubmit. If they were approved before, the badge is removed.
- **Revoke later** (e.g. insurance lapsed): set `status` to `rejected`. The badge comes off.

An approved application is locked: guides can't edit it themselves. If they need to
change their details, set it back to `rejected` so they can resubmit.

Do this before taking any payments: `PROGRESS.md` lists the legal check (outfitter /
booking-agent rules) to do with a lawyer before ROAMR takes a cut of paid trips.
