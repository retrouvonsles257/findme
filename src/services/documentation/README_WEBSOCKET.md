# RETROUVONSLES - WebSocket Services

Production-ready WebSocket services pour le temps réel.

## 📡 Utilisation

**WebSocket** est utilisé dans RETROUVONSLES pour:

1. **Notifications en temps réel**
   - Alertes de nouvelles personnes disparues
   - Mises à jour de statut
   - Notifications de correspondances

2. **Chat collaboratif**
   - Messages entre enquêteurs
   - Discussions sur les dossiers
   - Alerts d'équipe

3. **Synchronisation d'état**
   - Modifications simultanées
   - Mises à jour multi-utilisateurs

4. **Localisation en temps réel**
   - Suivi des enquêteurs
   - Coordination sur le terrain

5. **Activité en direct**
   - Qui est connecté
   - Qui regarde quel dossier
   - Typing indicators

6. **Correspondances automatiques**
   - Alerte quand correspondance trouvée
   - Scores en temps réel

## 🚀 Quick Start

### Initialize

```typescript
import { initializeWebSocketService } from '@/services/websocket';

const ws = await initializeWebSocketService(
  userId,
  'wss://your-websocket-server.com'
);
```

### Notifications

```typescript
// Subscribe
ws.onNotification((notif) => {
  console.log(notif.title);
});

// Send
await ws.sendNotification({
  type: 'alert',
  title: 'Nouvelle info',
  content: 'Description'
});
```

### Chat

```typescript
// Join room
await ws.joinRoom('dossier-123-chat');

// Send message
await ws.sendMessage('Hello team!');

// Listen
ws.onChatMessage((msg) => {
  console.log(`${msg.senderName}: ${msg.content}`);
});
```

### Activity

```typescript
// Broadcast activity
await ws.broadcastActivity('viewing', 'dossier', 'doc-123');

// Listen
ws.onUserActivity((activity) => {
  console.log(`${activity.userName} is ${activity.action}`);
});
```

### Location

```typescript
// Send location
await ws.sendLocation(latitude, longitude, accuracy);

// Listen
ws.onLocationUpdate((loc) => {
  updateMap(loc);
});
```

## 📚 Complete Documentation

See [WEBSOCKET_SERVICES_COMPLETE.md](../WEBSOCKET_SERVICES_COMPLETE.md) for:
- Complete API reference
- Real-world examples
- Configuration options
- Error handling
- Monitoring & debugging

## 🏗️ Architecture

```
WebSocket Client Manager
├── Connection management
├── Reconnection logic
├── Heartbeat/Ping-Pong
├── Message queuing
└── Error handling

WebSocket Service
├── Notifications
├── Chat & Messages
├── User Activity
├── Typing Indicators
├── Location Tracking
├── Personne Matching
└── Dossier Updates
```

## 🔧 Configuration

```env
REACT_APP_WEBSOCKET_URL=wss://your-websocket-server.com
REACT_APP_WEBSOCKET_RECONNECT_INTERVAL=5000
```

```typescript
// Initialize
await initializeWebSocketService(userId, wsUrl, reconnectInterval);

// Or with full config
const client = WebSocketClientManager.getInstance();
await client.initialize({
  url: wsUrl,
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 30000,
  messageTimeout: 30000
});
```

## 📡 Message Types

- `notification` - Notifications
- `chat` - Chat messages
- `activity` - User activity
- `typing` - Typing indicators
- `location` - Location updates
- `match` - Personne matches
- `dossier_update` - Dossier changes

## 🔄 Features

✅ Automatic reconnection with exponential backoff  
✅ Message queuing during disconnection  
✅ Heartbeat/Ping-Pong for health check  
✅ Request-response pattern  
✅ Event-driven architecture  
✅ Type-safe operations  
✅ Comprehensive error handling  
✅ Memory-efficient implementations  

## 🛡️ Error Handling

```typescript
import {
  WebSocketError,
  WebSocketConnectionError,
  WebSocketTimeoutError
} from '@/services/websocket';

try {
  await ws.sendMessage(type, payload);
} catch (error) {
  if (error instanceof WebSocketConnectionError) {
    // Handle connection error
  } else if (error instanceof WebSocketTimeoutError) {
    // Handle timeout
  }
}
```

## 🎯 Common Patterns

### Subscribe & Unsubscribe

```typescript
const unsubscribe = ws.onNotification(callback);
// Later...
unsubscribe();
```

### Request-Response

```typescript
// Send and wait for response
const response = await ws.sendNotification({...});
```

### Broadcasting

```typescript
// No response expected
ws.broadcastActivity('viewing', 'dossier', 'id');
ws.broadcastTyping(true);
ws.sendLocation(lat, lng);
```

## 🚨 Connection Status

```typescript
// Check connection
if (ws.isConnected()) {
  // Send message
}

// Monitor stats
const stats = ws.getStats();
console.log(stats.reconnectAttempts);
console.log(stats.pendingMessages);
console.log(stats.queuedMessages);
```

## 🧹 Cleanup

```typescript
// Unsubscribe from event
const unsubscribe = ws.onNotification(callback);
unsubscribe();

// Close connection
ws.close();

// Reset service
ws.reset();
```

## 📊 Monitoring

The service includes built-in stats:
- Connection status
- Reconnect attempts
- Pending messages
- Queued messages

```typescript
const stats = ws.getStats();
console.log('WebSocket Stats:', stats);
```

## ⚙️ Implementation Files

- `websocketClient.ts` - Low-level client
- `websocketService.ts` - High-level service
- `index.ts` - Barrel export

## 🔗 Related Services

- **Supabase Realtime**: [SUPABASE_SERVICES_COMPLETE.md](../SUPABASE_SERVICES_COMPLETE.md)
- **Authentication**: [SUPABASE_QUICK_START.md](../SUPABASE_QUICK_START.md)

## 📖 Full Documentation

→ [WEBSOCKET_SERVICES_COMPLETE.md](../WEBSOCKET_SERVICES_COMPLETE.md)

## ✅ Status

- Implementation: **COMPLETE**
- Type Safety: **100%**
- Error Handling: **COMPREHENSIVE**
- Documentation: **COMPLETE**
- Production Ready: **YES**
