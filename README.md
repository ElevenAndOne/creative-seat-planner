# Creative Seat

pnpm + Turborepo monorepo. React 19, Base UI, Tailwind CSS v4, Vite, and Neon
(Lakebase Postgres, Neon Auth, Neon Functions).

```
apps/
  planner/        Social Planner — 12-week LinkedIn + Instagram posting calendar
  api/            Planner REST API, deployed as the `api` Neon Function
packages/
  ui/             @creative-seat/ui — brand tokens + Base UI–backed components
neon.ts           Neon services for the linked branch (auth, storage bucket, api function)
```

## Commands

```bash
pnpm install
pnpm dev          # planner on http://localhost:3000 (strict port)
pnpm build
pnpm typecheck
pnpm neon:deploy  # neon deploy: apply neon.ts and ship apps/api to the api function
pnpm db:migrate   # apply apps/api/db/schema.sql (idempotent)
pnpm db:seed      # insert the original 18 posts; never overwrites existing rows
```

## Neon setup

The repo is linked to Neon project `autumn-water-45702883`, branch `production`
(`.neon`, git-ignored). `neon link` / `neon deploy` write the branch's variables
to the root `.env.local`. The planner reads two of them from
`apps/planner/.env.local` (see `.env.example` there):

- `VITE_API_URL`: the `api` function URL (`NEON_FUNCTION_API_BASE_URL`)
- `VITE_NEON_AUTH_URL`: `NEON_AUTH_BASE_URL`

### Hosting on Vercel

`vercel.json` deploys the planner as the project's one service, `planner`
(`apps/planner`). The API stays on Neon: `/api/*` is a proxy rewrite to the
`api` Neon Function, which serves its routes under `/api` as well as at its root.
The browser therefore calls same-origin `/api`, so on Vercel leave
`VITE_API_URL` unset and set `VITE_NEON_AUTH_URL` only.

If the Neon branch or function changes, update the rewrite destination in
`vercel.json`. Add each Vercel domain to Neon Auth so sign-in can redirect back:

```bash
neon neon-auth domain add https://your-domain.vercel.app
```

`vercel dev -L` runs the setup locally.

### Artwork from Figma

Each brief shows its slides from the Creative Seat Figma file
(`9hpD5w4IPnt1gEzhW00IaI`, page **CS_Social Media**). Frames are matched by
name: `CS - <post title> - Slide 01`, `… - Slide 02`, and so on.

- **Stills — Refresh artwork.** An editor clicks **Refresh artwork** on a brief.
  The API finds the frames with Figma's REST API, renders them to PNG at 2× and
  stores them in the `storage` bucket. It needs a Figma personal access token
  with the `file_content:read` scope, created by someone with a Dev or Full seat
  (View-seat tokens are limited to a handful of calls a month). Add it to the root
  `.env.local` as `FIGMA_TOKEN=…`, then run `pnpm neon:deploy`.
- **Videos — the Figma plugin** (`apps/figma-plugin`). Figma's public API can't
  export video, but a plugin can. The plugin exports every matching frame as a
  PNG and, for frames with Motion keyframes, an MP4 rendered by Figma, then
  uploads them to the brief.

To install the plugin (Figma desktop app):

1. `pnpm --filter @creative-seat/figma-plugin build`
2. In Figma: **Plugins → Development → Import plugin from manifest…** and pick
   `apps/figma-plugin/manifest.json`.
3. In the planner, sign in as an editor, open **Figma plugin** in the header,
   create a key, and paste the key and API address into the plugin's
   **Connection** panel.
4. Open the CS_Social Media page, run the plugin, tick the posts and
   **Publish selected**.

Keys belong to the editor who made them and stop working if that person is
removed from `editors`. Revoke them from the same dialog.

Feedback, inspiration images and artwork are only visible to signed-in users.

### Who can edit

Anyone can view the plan. Changes go through the API, which verifies the
caller's Neon Auth JWT and only allows emails listed in the `editors` table:

```sql
insert into editors (email) values ('someone@example.com');
delete from editors where email = 'someone@example.com';
```

An editor signs in from **Sign in to edit** in the header (creating an account
the first time). Signed in, they can drag posts on the calendar, add posts, and
use **Edit brief** to change any field, add or remove art-direction rows, copy
lines and delivery sizes, or delete a post. Everyone else sees a read-only plan.

## `@creative-seat/ui`

Consumed as source (no build step). Apps import components from
`@creative-seat/ui` and the theme from `@creative-seat/ui/styles.css`:

```css
@import "tailwindcss";
@import "@creative-seat/ui/styles.css";
```

`styles.css` defines the brand palette (`ink`, `forest`, `volt`, `soft`,
`chalk`, `paper`, `line`, `muted`, status colours), fonts (`font-sans` Golos
Text, `font-serif` Instrument Serif, `font-hand` Caveat) and registers the
package with Tailwind via `@source`, so its classes are always generated.

| Component | Built on |
| --- | --- |
| `Button` (`outline` / `ink` with volt disc) | Base UI `Button` |
| `SegmentedTabs` (`md` / `sm`) | Base UI `Tabs` |
| `FilterChip` | Base UI `Toggle` |
| `Select` | Base UI `Select` |
| `TextField` | Base UI `Field` |
| `Input` | Base UI `Input` |
| `Dialog`, `ConfirmDialog` | Base UI `Dialog`, `AlertDialog` |
| `ToastProvider`, `useToast` | Base UI `Toast` |
| `TextArea` (auto-growing), `Pill`, `StatusDot`, `StatusLabel`, `Panel`, `Chair`, `Wordmark` | plain React |

## Planner

Calendar (drag posts between days, or onto the tray to unschedule), Content
(cards grouped by phase), and a one-page creative brief per post (`#p01`…`#p18`)
with copyable asset words and captions. Data lives in the `posts` table.
