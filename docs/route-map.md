# Route map

## New Creative OS routes

| Path | Purpose | Existing logic used |
| --- | --- | --- |
| `/dashboard` | Personal home | `workspace.overview` |
| `/build` | Notes, tasks, AI | `Post` captures, project tasks, `assistant.ask` |
| `/studio` | Creative workspace | events, creators, feed |
| `/studio/session` | Build Night room | local timer/checklist/recap |
| `/community` | Builders and activity | creators + feed |
| `/marketplace` | Monetization layer | shop + rooms + laundry links |
| `/learn` | Knowledge hub | published `BlogPost`s |
| `/founder` | Operator console | role-gated aggregates |
| `/settings` | Theme and account links | NextAuth session |

## Preserved routes

`/`, `/shop`, `/projects`, `/feed`, `/rooms`, `/rentals`, `/laundry`, `/events`, `/calendar`, `/careers`, `/admin`, `/suppliers`, `/drivers`, `/creators`, `/profile`, `/auth/*`, and all payment webhooks stay in place.

Mobile tabs: Home, Build, Community, Projects, Profile.
Desktop sidebar: Dashboard, Build, Projects, Studio, Community, Marketplace, Learn, Events, Profile, Settings.
