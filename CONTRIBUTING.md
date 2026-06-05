# Contributing to ROAMR

ROAMR is an outdoor-recreation app. This guide describes how we organize work in this repository so the codebase stays clean and releases stay safe.

## Branch workflow

- `main` is the protected, production branch. It always reflects shippable code. Direct pushes are restricted; all changes land through reviewed Pull Requests.
- Each feature is developed on its own `feature/<name>` branch, created from `main`.
- When a feature is ready, open a Pull Request into `main`. At least one review and approval is required before merging.

### Day-to-day rules

- Pull `main` before you start a new branch so you begin from the latest code.
- Commit in small, focused increments with clear messages.
- Push often so your work is backed up and visible.
- Never commit secrets, API keys, or service-account files.
- If a change affects data access, update the security rules on `feature/security-rules` and note it in your PR.

## Feature branches

Each branch maps to a ROAMR feature area:

| Branch | Covers |
| --- | --- |
| `feature/auth` | Authentication: sign up, sign in, sign out, password reset, session handling |
| `feature/onboarding` | First-run onboarding flow and initial profile / interest setup |
| `feature/profile` | User profile viewing and editing |
| `feature/premium` | Premium tier, subscriptions, and paywalled features |
| `feature/tribes` | Tribes (groups / communities): create, join, manage |
| `feature/home-feed` | Home feed and posts: composing, displaying, and interacting with posts |
| `feature/activities` | Outdoor activities: logging, browsing, and managing activities |
| `feature/marketplace` | Marketplace: listings for gear and services |
| `feature/search` | Search and discovery across users, tribes, activities, and listings |
| `feature/follow` | Follow / unfollow relationships and the social graph |
| `feature/notifications` | Push and in-app notifications |
| `feature/moderation` | Moderation: reporting and blocking users or content |
| `feature/account-deletion` | Account deletion and associated data cleanup |
| `feature/offline-persistence` | Offline data persistence and sync |
| `feature/analytics` | Product analytics and event tracking |
| `feature/crash-reporting` | Crash and error reporting |
| `feature/security-rules` | Firestore and Storage security rules |

## Opening a Pull Request

1. Push your `feature/<name>` branch.
2. Open a Pull Request into `main` and fill out the PR template.
3. Request a review. Address feedback, then merge once approved.
