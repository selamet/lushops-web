# Sentinel — Container Monitoring & Alarm Panel

Web interface for the operations panel that monitors services running with
Docker Compose on Google Cloud VMs (Django/FastAPI, Nginx, PostgreSQL, Redis,
Celery/Flower, RabbitMQ), raises alarms when threshold rules are triggered, and
can act on containers.

> Data comes from the Sentinel API in a separate repository (FastAPI,
> [`opsluh-api`](https://github.com/selamet/opsluh-api)). Sign-in uses JWT; on
> startup the app fetches the fleet and alarms and refreshes them every 15s.
> The API address is configured with `VITE_API_URL` (default `http://localhost:8000`).
> Run the backend first: `uvicorn app.main:app --reload` in the `opsluh-api` repo.

## Tech

- **React 18 + TypeScript + Vite**
- **React Router** — page routing
- **Zustand** — live fleet data and overlay (toast/modal/terminal) state
- **CSS variables** — design tokens in `src/styles/global.css`
- Charts are hand-written SVG (no dependencies)

## Commands

```bash
npm install      # dependencies
npm run dev      # dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the build
npm run lint     # ESLint
npm run format   # Prettier
```

## Screens

| Route                         | Screen           | Description                                          |
| ----------------------------- | ---------------- | --------------------------------------------------- |
| `/`                           | Overview         | Fleet KPIs + app cards                              |
| `/app/:id`                    | App detail       | VM info, dependency map, container table            |
| `/app/:id/container/:cid`     | Container detail | Metrics / logs / inspect / health + actions         |
| `/alarms`                     | Alarms           | Severity summary + status/severity filters          |
| `/incident/:id`               | Incident detail  | Timeline, runbook, related alarms                   |
| `/add`                        | Add app          | 3-step setup wizard                                 |
| `/settings`                   | Settings         | Alarm rules, auto-remediation, channels, general    |

Global: sidebar, topbar (live indicator + notification bell), critical-alarm
banner, command palette (⌘K), toast/confirm-modal/terminal overlays.

## Directory Structure

```
src/
  components/
    ui/        Shared primitives (Icon, Card, Button, Sparkline, …)
    layout/    Sidebar, Topbar, CriticalBanner, AlarmDropdown
    overlays/  Toast host, ConfirmModal, TerminalModal, CommandPalette
    form/       Field, TextInput, Toggle
    *.tsx       Feature components (AppCard, ContainerTable, DependencyMap, …)
  api/         API client, endpoints, types and adapters (map)
  data/        UI metadata (service / status / severity colors & labels)
  lib/         Helpers (health, series, routes, containerActions)
  screens/     Page components (one file per route + Login)
  store/       Zustand stores (auth, fleet, alarms, overlay)
  styles/      Design tokens and base styles
  types.ts     Domain model
```

## Design Tokens

Colors, typography and spacing are kept in a single place as CSS variables in
`src/styles/global.css`. UI components reference these tokens via `var(--…)` —
to change the theme you only need to update this one file.
