# Analisi tecnica — PubSub Viewer v2

## Contesto e obiettivo

Riscrittura del tool `pubsub-ui` da un singolo file Express (~165 righe, HTML inline) a un'applicazione Next.js 15 con UI moderna, autenticazione e gestione messaggi strutturata.

---

## Decisioni architetturali

### Framework: Next.js 15 (App Router)

**Alternativa valutata**: Angular + PrimeNG + Express separato

**Motivo della scelta**:
- Next.js unifica frontend e backend API in un unico processo/porta, semplificando il deploy e la configurazione
- App Router + React 19 offre Server Components e API Route Handlers nativi
- shadcn/ui si integra perfettamente con il tooling Next.js (Tailwind, TypeScript)
- Per un dev tool interno, la semplicità di un processo singolo è preferibile a due processi separati

**Trade-off**:
- Meno struttura di Angular (ma non necessaria per un tool di questa dimensione)
- Tailwind v3 invece di v4 per compatibilità shadcn stabile

---

### UI: shadcn/ui + Tailwind CSS

**Alternativa valutata**: PrimeNG (con Angular), MUI

**Motivo della scelta**:
- shadcn/ui non è una libreria installata come dipendenza: i componenti sono copiati nel sorgente e completamente personalizzabili
- Zero overhead di bundle (solo Radix Primitives + CVA + Tailwind)
- Componenti usati: Button, Input, Label, Badge, Table, Sheet (drawer), Select, Separator, ScrollArea, Card

---

### Real-time: polling via `setInterval`

**Alternativa valutata**: WebSocket, Server-Sent Events (SSE)

**Motivo della scelta**:
- Semplicità implementativa: `setInterval` + `fetch` in un Client Component React
- Nessun custom server richiesto (WebSocket avrebbe richiesto un server HTTP custom che avvolge Next.js)
- Per un dev tool locale con pochi utenti, 1 richiesta/s non è un problema
- SSE sarebbe stato elegante ma richiederebbe gestione reconnect e streaming API routes

**Interval**: 1000ms (configurabile in `MessageTable.tsx:POLL_INTERVAL_MS`)

---

### Auth: iron-session v8

**Alternativa valutata**: NextAuth.js, JWT manuale, Basic Auth HTTP

**Motivo della scelta**:
- iron-session è leggero, stateless, senza dipendenze esterne (DB, Redis)
- Cookie cifrati con AES-GCM via Web Crypto API
- Supporto nativo Next.js App Router (middleware Edge + route handler Node.js)
- Nessuna configurazione OAuth necessaria per un tool interno

**Utenti**: definiti in `AUTH_USERS` env var come JSON array → nessun DB necessario

---

### Store messaggi: in-memory singleton

**Alternativa valutata**: SQLite (via better-sqlite3), LevelDB, Redis

**Motivo della scelta**:
- Tool di sviluppo locale: la persistenza non è requisito
- Singleton a livello processo Node.js con `global.__messageStore` per sopravvivere all'HMR Next.js
- Map<id, Message> per deduplicazione e O(1) lookup (ack per ID)
- Array ordinato per mantenere inserimento LIFO senza re-sorting
- Max 500 messaggi con trim automatico

---

### PubSub: singleton globale con HMR safety

**Problema**: Next.js in dev mode esegue hot reload dei moduli → il singleton verrebbe ricreato ad ogni salvataggio, aprendo connessioni multiple all'emulator.

**Soluzione**: pattern `global.__pubsubClient` / `global.__activeSubscription` — l'oggetto sopravvive all'HMR perché `global` non viene ricreato con i moduli.

---

## Struttura API

| Endpoint | Metodo | Funzione |
|---|---|---|
| `/api/auth/login` | POST | Login → sessione cookie |
| `/api/auth/logout` | POST | Distrugge sessione |
| `/api/subscriptions` | GET | Lista subscription disponibili |
| `/api/listen` | POST | Avvia listener su subscription |
| `/api/listen` | DELETE | Ferma listener |
| `/api/messages` | GET | Messaggi + stats + activeSubscription |
| `/api/messages` | DELETE | Svuota store |
| `/api/ack/[id]` | POST | Marca messaggio come acked |

---

## Funzionalità UI

| Feature | Componente | Note |
|---|---|---|
| Login | `LoginForm` | Form username/password → `POST /api/auth/login` |
| Selezione subscription | `SubscriptionSelector` | Select + Connect + Disconnect |
| Tabella messaggi | `MessageTable` | Polling 1s, ricerca, click → drawer |
| Dettaglio messaggio | `MessageDrawer` | Sheet laterale, JSON pretty-print, copy, ack |
| Statistiche | `StatsBar` | Total/Acked/Last60s + Clear + Export + Pause |
| Export | `StatsBar` → download | Blob JSON scaricato client-side |
| Pausa polling | `MessageTable` | `pausedRef` per skip fetch senza cleanup interval |

---

## Note di sicurezza

- Cookie `httpOnly: true`, `sameSite: lax`, `secure: true` in produzione
- `SESSION_SECRET` deve essere ≥ 32 caratteri, generato casualmente
- Password utenti in env var (non nel codice)
- Nessun input dell'utente viene eseguito o interpretato come codice

---

## Possibili evoluzioni future

1. **Multi-subscription**: ascoltare più subscription contemporaneamente (richiede modifiche a store e pubsub singleton)
2. **WebSocket/SSE**: eliminare il polling per push real-time (richiederebbe custom server)
3. **Persistenza**: SQLite con better-sqlite3 per storico messaggi tra restart
4. **Dark mode**: toggle già supportato da shadcn (classe `dark` su `<html>`)
5. **Replay**: re-pubblicare un messaggio su un topic per test
6. **Filtro per attributi**: UI per filtrare per key/value degli attributi
