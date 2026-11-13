# PubSub Viewer — Contesto progetto

## Descrizione

Tool interno per visualizzare messaggi Google Cloud Pub/Sub in tempo reale, con autenticazione, tabella messaggi e possibilità di ack.

## Stack

| Layer | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| UI | shadcn/ui + Tailwind CSS v3 |
| Auth | iron-session v8 (cookie cifrato) |
| Data fetching | polling via `setInterval` ogni 1s |
| PubSub | @google-cloud/pubsub v4 |
| Config | `.env.local` |

## Come avviare

```bash
# Prerequisito: emulator Pub/Sub attivo
gcloud beta emulators pubsub start --project=$PUBSUB_PROJECT_ID

# Avvia il viewer
cd pubsub-ui
npm run dev
# → http://localhost:3030
```

## Variabili d'ambiente

Copia `.env.example` → `.env.local` e configura:

| Variabile | Descrizione |
|---|---|
| `PUBSUB_PROJECT_ID` | ID progetto GCP |
| `PUBSUB_EMULATOR_HOST` | Host emulator (default `localhost:8085`) |
| `AUTH_USERS` | JSON array `[{username, password}]` |
| `SESSION_SECRET` | Stringa ≥32 caratteri per cifrare i cookie |
| `MAX_MESSAGES` | Messaggi tenuti in memoria (default 500) |
| `NEXT_PUBLIC_POLL_INTERVAL_MS` | Intervallo di polling UI in ms (default 1000) |
| `LEGACY_VIEWER_PORT` | Porta di `server.js` (default 3080) |
| `LEGACY_VIEWER_MAX_MESSAGES` | Messaggi tenuti da `server.js` (default 100) |

## Struttura sorgenti

```
src/
├── app/
│   ├── api/
│   │   ├── auth/{login,logout}/route.ts  ← autenticazione
│   │   ├── subscriptions/route.ts        ← lista subscription
│   │   ├── listen/route.ts               ← avvia/ferma listener
│   │   ├── messages/route.ts             ← messaggi + stats
│   │   └── ack/[id]/route.ts             ← ack messaggio
│   ├── login/page.tsx                    ← schermata login
│   └── page.tsx                          ← dashboard principale
├── components/
│   ├── ui/                               ← shadcn components
│   ├── LoginForm.tsx
│   ├── SubscriptionSelector.tsx
│   ├── MessageTable.tsx                  ← polling + ricerca
│   ├── MessageDrawer.tsx                 ← dettaglio + ack
│   └── StatsBar.tsx
├── lib/
│   ├── pubsub.ts   ← singleton PubSub client + startListening
│   ├── store.ts    ← in-memory message store (singleton globale)
│   ├── session.ts  ← config iron-session
│   └── utils.ts    ← cn() helper
└── types/index.ts  ← PubSubMessage, SessionData, MessagesResponse
```

## Note architetturali

- **Store in-memory**: singleton a livello di processo Node.js, usa `global.__messageStore` per sopravvivere all'HMR in dev. Max `MAX_MESSAGES` messaggi (default 500, LIFO).
- **PubSub singleton**: `global.__pubsubClient` e `global.__activeSubscription` per lo stesso motivo.
- **Messaggi non acked automaticamente**: l'utente decide esplicitamente dal drawer.
- **Middleware auth**: proteggе tutte le route tranne `/login` e `/api/auth/*`.
- **serverExternalPackages**: `@google-cloud/pubsub` è escluso dal bundle Next.js (usa gRPC native).
