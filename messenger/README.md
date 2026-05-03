# 💬 Simple Messenger App - Technical Documentation

### 🚀 Quick Start

To run this project locally, ensure you have the correct parameters set at the top of the entry file:

- **`id`**: Your current user ID.
- **`guestId`**: The ID of the user you are messaging.

**Example Configuration:**
`id=1&guestId=2`

**Execution:**

- **Backend:** `cd server && npm run start`
- **Frontend:** `cd client && npm run dev`

---

### 🧠 Logic & Communication

This platform is designed to master the transition from standard **HTTP request-response** cycles to persistent **WebSocket** connections.

- **Session Handling**: The application uses the `id` and `guestId` parameters to map specific user sessions and manage active broadcasting logic.
- **Binary Data**: Focused on working with **Buffers** and **Strings** to ensure efficient data encoding across the wire.
- **Real-time State**: Uses an event-driven architecture to manage active sessions and provide low-latency updates via React hooks.

### 🛠 Tech Stack

- **Backend**: Node.js with `ws` library (or Socket.io)
- **Frontend**: React (Hooks-based state management)
- **Core Concepts**: WS/WSS protocols, Binary Buffers, and Networking fundamentals.
