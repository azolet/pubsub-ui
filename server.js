const express = require('express')
const cors = require('cors')
const { PubSub } = require('@google-cloud/pubsub')

const app = express()
app.use(cors())
app.use(express.json())

// 👉 CONFIG (from .env.local)
try { process.loadEnvFile('.env.local') } catch {}
const PROJECT_ID = process.env.PUBSUB_PROJECT_ID
const PORT = Number(process.env.LEGACY_VIEWER_PORT ?? 3080)

const pubsub = new PubSub({ projectId: PROJECT_ID })

// 👉 stato runtime
let currentSubscription = null
let subscriptionStream = null
const messages = []
const MAX_MESSAGES = Number(process.env.LEGACY_VIEWER_MAX_MESSAGES ?? 100)

function addMessage(msg) {
  messages.unshift(msg)
  if (messages.length > MAX_MESSAGES) messages.pop()
}

// 🧠 Stop vecchio subscriber
function stopListening() {
  if (subscriptionStream) {
    subscriptionStream.removeAllListeners()
    subscriptionStream = null
    console.log('🛑 Stopped previous subscription')
  }
}

// 🧠 Start nuovo subscriber
function startListening(subName) {
  stopListening()

  console.log('🎧 Listening to:', subName)

  const subscription = pubsub.subscription(subName)
  currentSubscription = subName

  subscriptionStream = subscription

  subscription.on('message', message => {
    const parsed = {
      id: message.id,
      data: message.data.toString(),
      attributes: message.attributes,
      publishTime: message.publishTime,
    }

    console.log('📩', parsed.data)

    addMessage(parsed)

    // ❌ NO ACK
  })

  subscription.on('error', err => {
    console.error('❌ Subscriber error:', err.message)
  })
}

// 📡 API — lista subscriptions
app.get('/subscriptions', async (req, res) => {
  try {
    const [subs] = await pubsub.getSubscriptions()
    const list = subs.map(s => s.name.split('/').pop())
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 📡 API — seleziona subscription
app.post('/listen', (req, res) => {
  const { subscription } = req.body

  if (!subscription) {
    return res.status(400).send('Missing subscription')
  }

  messages.length = 0
  startListening(subscription)

  res.sendStatus(200)
})

// 📡 API — messaggi
app.get('/messages', (req, res) => {
  res.json(messages)
})

// 📡 UI
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>PubSub Viewer</title>
        <style>
          body { font-family: sans-serif; background: #111; color: #eee; }
          .msg { border-bottom: 1px solid #333; padding: 10px; }
          select, button { margin: 10px 5px; }
          pre { white-space: pre-wrap; }
        </style>
      </head>
      <body>
        <h1>📡 PubSub Viewer</h1>

        <div>
          <select id="subs"></select>
          <button onclick="connect()">Connect</button>
        </div>

        <div id="messages"></div>

        <script>
          async function loadSubscriptions() {
            const res = await fetch('/subscriptions')
            const subs = await res.json()

            const select = document.getElementById('subs')
            select.innerHTML = subs.map(s => 
              '<option value="' + s + '">' + s + '</option>'
            ).join('')
          }

          async function connect() {
            const sub = document.getElementById('subs').value

            await fetch('/listen', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subscription: sub })
            })
          }

          async function loadMessages() {
            const res = await fetch('/messages')
            const data = await res.json()

            document.getElementById('messages').innerHTML =
              data.map(m => \`
                <div class="msg">
                  <div><b>ID:</b> \${m.id}</div>
                  <div><b>Time:</b> \${m.publishTime}</div>
                  <pre>\${m.data}</pre>
                </div>
              \`).join('')
          }

          setInterval(loadMessages, 1000)
          loadSubscriptions()
        </script>
      </body>
    </html>
  `)
})

app.listen(PORT, () => {
  console.log(`🚀 Viewer su http://localhost:${PORT}`)
})
