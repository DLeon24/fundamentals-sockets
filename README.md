# Fundamentals Sockets

## Technical Description

A real-time, bidirectional messaging server built with **Node.js**, **Express**, and **Socket.IO**. The project demonstrates the foundations of WebSocket communication: persistent connections, server-acknowledged events, and broadcast messaging. A lightweight HTML client connects automatically on page load, exchanges messages with the server, and receives broadcasts from other connected clients — all without HTTP polling.

This is a **learning-oriented** project focused on understanding the Socket.IO event model, acknowledgment callbacks, and the separation between server bootstrapping and socket event handling.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                     │
│                                                             │
│  public/index.html ─── loads ──► public/js/socket-custom.js │
│                                       │                     │
│                                  io() connection            │
└───────────────────────────────────────┬─────────────────────┘
                                        │
                              WebSocket (ws://)
                           upgraded from HTTP GET
                                        │
┌───────────────────────────────────────┴─────────────────────┐
│                     Node.js Server (port 3000)              │
│                                                             │
│  ┌──────────────┐     ┌───────────────────────────────┐     │
│  │  Express.js   │     │         Socket.IO Server      │     │
│  │              │     │                               │     │
│  │ Static files │     │  server/sockets/socket.js     │     │
│  │ from public/ │     │  ┌───────────────────────┐    │     │
│  └──────────────┘     │  │  Event: connection     │    │     │
│         ▲              │  │  Event: disconnect     │    │     │
│         │              │  │  Event: sendMessage    │    │     │
│  server/server.js     │  └───────────────────────┘    │     │
│  (HTTP + WS bootstrap)│                               │     │
│                        └───────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Design Pattern: Event-Driven with Pub/Sub Broadcasting

The application follows an **event-driven architecture** built on top of Socket.IO's pub/sub model:

| Concept | Implementation |
|---|---|
| **Transport** | WebSocket (with HTTP long-polling fallback, managed by Socket.IO) |
| **Event model** | Named events (`sendMessage`) emitted and listened on both client and server |
| **Acknowledgments** | Server-side callbacks confirm receipt and validate payload before responding to the sender |
| **Broadcasting** | `client.broadcast.emit()` fans out messages to every connected socket **except** the sender |
| **Connection lifecycle** | `connection` and `disconnect` events track client presence on the server |

> **Note:** This project is a single-process monolith. There are no microservices, message queues, or external brokers. Socket.IO's in-memory adapter handles all pub/sub internally. For horizontal scaling, an external adapter (e.g., `@socket.io/redis-adapter`) would be required.

### Module Responsibility

| Module | Responsibility |
|---|---|
| `server/server.js` | Creates the HTTP server, mounts Express static middleware, initializes the Socket.IO instance, and exports it for use by event handlers |
| `server/sockets/socket.js` | Registers all socket event listeners (`connection`, `disconnect`, `sendMessage`). Separated from the server bootstrap to keep concerns isolated |
| `public/index.html` | Minimal HTML shell that loads the Socket.IO client library and the custom client script |
| `public/js/socket-custom.js` | Client-side logic: connects to the server, emits a `sendMessage` event with an acknowledgment callback, and listens for incoming broadcasts |

## Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | v12+ | JavaScript server runtime |
| HTTP framework | Express.js | ^4.16.3 | Static file serving and HTTP layer |
| WebSocket library | Socket.IO (server) | ^3.0.4 | Real-time bidirectional event-based communication |
| WebSocket client | Socket.IO Client | Auto-served | Bundled by the server at `/socket.io/socket.io.js` |
| Frontend | Vanilla HTML/JS | — | No framework; plain DOM and console output |

> **Cloud services:** None. The project runs entirely on localhost. It can be deployed to any Node.js-compatible platform (Heroku, Railway, AWS EC2, etc.) by setting the `PORT` environment variable.

## Installation and Setup

### Prerequisites

- **Node.js** v12 or higher ([download](https://nodejs.org/))
- **npm** (bundled with Node.js)

### Step-by-step

1. **Clone the repository**

```bash
git clone https://github.com/<your-username>/fundamentals-sockets.git
cd fundamentals-sockets
```

2. **Install dependencies**

```bash
npm install
```

This installs `express` and `socket.io` as declared in `package.json`.

3. **Start the server**

```bash
npm start
```

Expected output:

```
Server running on port 3000
```

4. **Open the client**

Navigate to [http://localhost:3000](http://localhost:3000) in your browser. Open the browser DevTools console (`F12` > Console) to see real-time socket events.

## Environment Configuration

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3000` | TCP port the HTTP + WebSocket server binds to |

Example with a custom port:

```bash
PORT=8080 npm start
```

> **Note:** There are no API keys, database credentials, or secret tokens required. The project has no `.env` file. If extended to production, sensitive values should be managed via environment variables and **never** committed to the repository.

## Socket Events Reference

### Server to Client

| Event | Payload | Trigger |
|---|---|---|
| `sendMessage` | `{ user: string, message: string }` | Emitted once on connection (welcome message from `Admin`), and whenever another client broadcasts a message |

### Client to Server

| Event | Payload | Acknowledgment Callback |
|---|---|---|
| `sendMessage` | `{ user: string, message: string }` | `{ resp: string }` — returns `"Message sent successfully!"` if `user` is present, or `"Error: user is required"` otherwise |

### Lifecycle Events (built-in)

| Event | Direction | Description |
|---|---|---|
| `connection` | Server-side | Fires when a new client establishes a WebSocket connection |
| `disconnect` | Both | Fires when a client loses or closes the connection |
| `connect` | Client-side | Fires when the client successfully connects to the server |

## Usage Examples

### Example 1 — Observe the default flow

1. Start the server: `npm start`
2. Open `http://localhost:3000` in **two** browser tabs
3. Open the DevTools console in both tabs

**Tab 1 console output:**

```
Connected to server
Server response:  { resp: 'Message sent successfully!' }
Server:  { user: 'Admin', message: 'Welcome to this app' }
```

**Tab 2 console output (receives Tab 1's broadcast):**

```
Connected to server
Server response:  { resp: 'Message sent successfully!' }
Server:  { user: 'Admin', message: 'Welcome to this app' }
Server:  { user: 'Diego', message: 'Hello World' }
```

**Server terminal output:**

```
Server running on port 3000
User connected
{ user: 'Diego', message: 'Hello World' }
User connected
{ user: 'Diego', message: 'Hello World' }
```

### Example 2 — Emit a custom message from the browser console

Open the DevTools console in any connected tab and run:

```javascript
socket.emit('sendMessage', { user: 'Alice', message: 'Hello from Alice' }, function(resp) {
  console.log('Ack:', resp);
});
// Ack: { resp: 'Message sent successfully!' }
```

All **other** connected tabs will see:

```
Server:  { user: 'Alice', message: 'Hello from Alice' }
```

### Example 3 — Test validation (missing user)

```javascript
socket.emit('sendMessage', { message: 'No user here' }, function(resp) {
  console.log('Ack:', resp);
});
// Ack: { resp: 'Error: user is required' }
```

### Example 4 — Connect with a Socket.IO client from Node.js

```bash
npm install socket.io-client
```

```javascript
const { io } = require('socket.io-client');
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
  socket.emit('sendMessage', { user: 'Bot', message: 'Automated hello' }, (ack) => {
    console.log('Server ack:', ack);
  });
});

socket.on('sendMessage', (data) => {
  console.log('Received:', data);
});
```

## Project Structure

```
fundamentals-sockets/
├── public/                     # Static assets served by Express
│   ├── index.html              # HTML shell — loads Socket.IO client + custom script
│   └── js/
│       └── socket-custom.js    # Client-side socket logic (connect, emit, listen)
├── server/
│   ├── server.js               # Express app, HTTP server, Socket.IO init, static middleware
│   └── sockets/
│       └── socket.js           # Socket event handlers (connection, messaging, disconnect)
├── .gitignore                  # Ignores node_modules/
├── package.json                # Project metadata and dependencies
├── package-lock.json           # Locked dependency tree
└── README.md
```

## Security Considerations and Best Practices

### Current State (development only)

- **No authentication:** Any client that can reach the server can connect and emit events. There is no token, session, or credential verification.
- **No input validation:** The `sendMessage` handler checks only for the presence of `data.user`. Message content is not sanitized, which could allow XSS if rendered as HTML in a future UI.
- **No CORS restriction:** Socket.IO 3.x disables CORS by default, but no explicit origin whitelist is configured. If CORS is enabled, a strict `origin` list should be defined.
- **No rate limiting:** A malicious client could flood `sendMessage` events without throttling.
- **No HTTPS:** The server runs on plain HTTP. WebSocket traffic (`ws://`) is unencrypted.

### Recommendations for Production

| Area | Recommendation |
|---|---|
| **Authentication** | Validate a JWT or session token in the Socket.IO `connection` middleware before accepting the socket |
| **Input sanitization** | Sanitize `data.message` with a library like `xss` or `DOMPurify` before broadcasting |
| **CORS** | Configure `cors: { origin: ['https://yourdomain.com'] }` in the Socket.IO server options |
| **Rate limiting** | Implement per-socket event throttling (e.g., max 10 messages/second) to prevent abuse |
| **HTTPS / WSS** | Terminate TLS with a reverse proxy (NGINX, Cloudflare) or use Node.js `https.createServer()` |
| **Horizontal scaling** | Replace the default in-memory adapter with `@socket.io/redis-adapter` to share events across multiple server instances |
| **Monitoring** | Add structured logging (e.g., `pino`, `winston`) and health-check endpoints for observability |
| **Environment management** | Use `dotenv` for local development and inject secrets via the platform's environment variable system in production |

## Assumptions

- The project is intended as a **learning exercise** for Socket.IO fundamentals, not as a production-ready application.
- No database or persistent storage is used; all messages exist only in memory during the server's lifetime.
- The `socket.io-client` library is auto-served by the Socket.IO server at `/socket.io/socket.io.js` — no CDN or separate install is needed for the browser client.
- The `main` field in `package.json` points to `index.js`, but the actual entry point is `server/server.js` (invoked via `npm start`). This is a cosmetic mismatch with no runtime impact.