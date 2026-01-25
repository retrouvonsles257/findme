# RETROUVONSLES - WebSocket Integration Examples

Real-world examples for using WebSocket services.

## Table of Contents
1. [Notification System](#notification-system)
2. [Collaborative Chat](#collaborative-chat)
3. [Real-time Tracking](#real-time-tracking)
4. [Activity Monitoring](#activity-monitoring)
5. [Automatic Matching](#automatic-matching)
6. [Dossier Collaboration](#dossier-collaboration)

---

## Notification System

### Complete Notification Center

```typescript
// components/NotificationCenter.tsx
import { useEffect, useState } from 'react';
import { getWebSocketService } from '@/services/websocket';
import type { Notification } from '@/services/websocket';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ws = getWebSocketService();

  useEffect(() => {
    // Subscribe to notifications
    const unsubscribe = ws.onNotification((notification) => {
      // Add to list
      setNotifications(prev => [notification, ...prev].slice(0, 50));

      // Update unread count
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
      }

      // Show toast notification
      showToast({
        title: notification.title,
        message: notification.content,
        type: getNotificationType(notification.type),
      });

      // Play sound for alerts
      if (notification.type === 'alert') {
        playSound('alert.mp3');
      }

      // Auto-navigate if action URL
      if (notification.actionUrl && notification.type === 'match') {
        setTimeout(() => {
          navigate(notification.actionUrl!);
        }, 2000);
      }
    });

    // Load notification history
    loadNotifications();

    return unsubscribe;
  }, []);

  const loadNotifications = async () => {
    const history = await ws.getNotifications(50, 0);
    setNotifications(history);
    setUnreadCount(history.filter(n => !n.read).length);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await ws.markNotificationAsRead(notificationId);
    
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleDelete = async (notificationId: string) => {
    await ws.deleteNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="notification-center">
      <div className="header">
        <h2>Notifications</h2>
        <Badge count={unreadCount} />
      </div>

      <div className="notifications-list">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification ${notif.read ? 'read' : 'unread'}`}>
            <div className="icon">
              <NotificationIcon type={notif.type} />
            </div>
            
            <div className="content">
              <h4>{notif.title}</h4>
              <p>{notif.content}</p>
              <span className="time">
                {new Date(notif.createdAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="actions">
              {!notif.read && (
                <button onClick={() => handleMarkAsRead(notif.id)}>
                  Mark as read
                </button>
              )}
              <button onClick={() => handleDelete(notif.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getNotificationType(type: string): 'success' | 'info' | 'warning' | 'error' {
  switch (type) {
    case 'alert': return 'warning';
    case 'match': return 'success';
    case 'update': return 'info';
    default: return 'info';
  }
}
```

---

## Collaborative Chat

### Dossier Discussion Room

```typescript
// components/DossierChat.tsx
import { useEffect, useRef, useState } from 'react';
import { getWebSocketService } from '@/services/websocket';
import type { ChatMessage, TypingIndicator } from '@/services/websocket';

export function DossierChat({ dossierId }: { dossierId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [typing, setTyping] = useState<Map<string, boolean>>(new Map());
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const ws = getWebSocketService();

  const roomId = `dossier-${dossierId}-chat`;

  useEffect(() => {
    // Join chat room
    ws.joinRoom(roomId);

    // Subscribe to messages
    const unsubMsg = ws.onChatMessage((message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    // Subscribe to typing indicators
    const unsubTyping = ws.onTyping((indicator) => {
      setTyping(prev => {
        const newTyping = new Map(prev);
        if (indicator.isTyping) {
          newTyping.set(indicator.userId, true);
        } else {
          newTyping.delete(indicator.userId);
        }
        return newTyping;
      });
    });

    // Load chat history
    loadChatHistory();

    return () => {
      unsubMsg();
      unsubTyping();
      ws.leaveRoom();
    };
  }, [dossierId, roomId, ws]);

  const loadChatHistory = async () => {
    const history = await ws.getChatHistory(roomId, 50, 0);
    setMessages(history);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Broadcast typing indicator
    ws.broadcastTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      ws.broadcastTyping(false);
    }, 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    setIsSending(true);

    try {
      // Stop typing indicator
      ws.broadcastTyping(false);

      // Send message
      const message = await ws.sendMessage(inputValue.trim());
      
      // Add to local state
      setMessages(prev => [...prev, message]);
      setInputValue('');
      scrollToBottom();
    } catch (error) {
      showError('Erreur lors de l\'envoi du message');
      console.error('Message send error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      await ws.editMessage(messageId, newContent);
      
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, content: newContent, edited: true }
            : m
        )
      );
    } catch (error) {
      showError('Erreur lors de la modification');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await ws.deleteMessage(messageId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      showError('Erreur lors de la suppression');
    }
  };

  const getTypingText = () => {
    const typingUsers = Array.from(typing.keys());
    if (typingUsers.length === 0) return '';
    if (typingUsers.length === 1) return `${typingUsers[0]} est en train d'écrire...`;
    return `${typingUsers.length} personnes écrivent...`;
  };

  return (
    <div className="dossier-chat">
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className="message-item">
            <div className="avatar">
              <UserAvatar userId={message.senderId} />
            </div>

            <div className="message-content">
              <div className="header">
                <strong>{message.senderName}</strong>
                <span className="time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <p>{message.content}</p>

              {message.edited && (
                <span className="edited">(modifié)</span>
              )}

              {message.attachments && message.attachments.length > 0 && (
                <div className="attachments">
                  {message.attachments.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      Pièce jointe {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="actions">
              <button onClick={() => handleEditMessage(message.id, prompt('Nouveau contenu'))}>
                Éditer
              </button>
              <button onClick={() => handleDeleteMessage(message.id)}>
                Supprimer
              </button>
            </div>
          </div>
        ))}

        {getTypingText() && (
          <div className="typing-indicator">
            <span>{getTypingText()}</span>
            <span className="dots">...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Tapez votre message..."
          disabled={isSending}
        />
        <button type="submit" disabled={isSending || !inputValue.trim()}>
          {isSending ? 'Envoi...' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
}
```

---

## Real-time Tracking

### Location Tracking Map

```typescript
// components/LocationTrackingMap.tsx
import { useEffect, useState } from 'react';
import { getWebSocketService } from '@/services/websocket';
import type { LocationUpdate } from '@/services/websocket';
import type { UUID } from '@/@types/database.types';

export function LocationTrackingMap() {
  const [locations, setLocations] = useState<Map<UUID, LocationUpdate>>(new Map());
  const ws = getWebSocketService();

  useEffect(() => {
    // Subscribe to location updates
    const unsubscribe = ws.onLocationUpdate((location) => {
      setLocations(prev => {
        const newMap = new Map(prev);
        newMap.set(location.userId, location);
        return newMap;
      });

      // Update map
      updateMapMarker(location);
    });

    // Start sending own location
    startLocationTracking();

    return () => {
      unsubscribe();
      stopLocationTracking();
    };
  }, []);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    // Send location every 30 seconds
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        ws.sendLocation(latitude, longitude, accuracy);
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  const stopLocationTracking = () => {
    // In a real app, you'd keep track of the watch ID
    // navigator.geolocation.clearWatch(watchId);
  };

  const updateMapMarker = (location: LocationUpdate) => {
    // Update map with new location
    const marker = getOrCreateMarker(location.userId);
    marker.setLatLng([location.latitude, location.longitude]);
    marker.bindPopup(`Accuracy: ${location.accuracy}m`);
  };

  return (
    <div className="location-tracking">
      <h3>Real-time Location Tracking</h3>
      
      <div id="map" className="map-container" />

      <div className="location-list">
        <h4>Active Users ({locations.size})</h4>
        {Array.from(locations.values()).map((loc) => (
          <div key={loc.userId} className="location-item">
            <span>{loc.userId}</span>
            <span>{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</span>
            <span className="accuracy">±{loc.accuracy.toFixed(0)}m</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Activity Monitoring

### Team Activity Dashboard

```typescript
// components/TeamActivityDashboard.tsx
import { useEffect, useState } from 'react';
import { getWebSocketService } from '@/services/websocket';
import type { UserActivity } from '@/services/websocket';

export function TeamActivityDashboard() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set<string>());
  const ws = getWebSocketService();

  useEffect(() => {
    // Subscribe to user activity
    const unsubscribe = ws.onUserActivity((activity) => {
      // Add activity to list
      setActivities(prev => [activity, ...prev].slice(0, 100));

      // Track online status
      if (activity.action === 'online') {
        setOnlineUsers(prev => new Set([...prev, activity.userId]));
      } else if (activity.action === 'offline') {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(activity.userId);
          return newSet;
        });
      }
    });

    // Load active users
    loadActiveUsers();

    // Announce own presence
    ws.broadcastActivity('online');

    return () => {
      unsubscribe();
      ws.broadcastActivity('offline');
    };
  }, []);

  const loadActiveUsers = async () => {
    const activeUsers = await ws.getActiveUsers();
    const onlineUserIds = new Set(
      activeUsers
        .filter(a => a.action !== 'offline')
        .map(a => a.userId)
    );
    setOnlineUsers(onlineUserIds);
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'viewing': return '👁️';
      case 'editing': return '✏️';
      case 'commenting': return '💬';
      case 'online': return '🟢';
      case 'offline': return '⚪';
      default: return '📝';
    }
  };

  const getActivityText = (activity: UserActivity) => {
    switch (activity.action) {
      case 'viewing':
        return `${activity.userName} views ${activity.resourceType} ${activity.resourceId}`;
      case 'editing':
        return `${activity.userName} edits ${activity.resourceType}`;
      case 'commenting':
        return `${activity.userName} comments on ${activity.resourceType}`;
      case 'online':
        return `${activity.userName} is online`;
      case 'offline':
        return `${activity.userName} went offline`;
      default:
        return `${activity.userName} ${activity.action}`;
    }
  };

  return (
    <div className="team-activity-dashboard">
      <div className="section">
        <h3>Online Users ({onlineUsers.size})</h3>
        <div className="user-list">
          {Array.from(onlineUsers).map(userId => (
            <div key={userId} className="user-badge online">
              <span className="status">🟢</span>
              <span>{userId}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <h3>Recent Activity</h3>
        <div className="activity-log">
          {activities.map((activity, i) => (
            <div key={i} className="activity-item">
              <span className="icon">{getActivityIcon(activity.action)}</span>
              <span className="text">{getActivityText(activity)}</span>
              <span className="time">
                {new Date(activity.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Automatic Matching

### Match Notifications

```typescript
// components/MatchNotifications.tsx
import { useEffect, useState } from 'react';
import { getWebSocketService } from '@/services/websocket';
import type { PersonneMatch } from '@/services/websocket';

export function MatchNotifications() {
  const [matches, setMatches] = useState<PersonneMatch[]>([]);
  const ws = getWebSocketService();

  useEffect(() => {
    // Subscribe to matches
    const unsubscribe = ws.onPersonneMatch((match) => {
      // Add to list
      setMatches(prev => [match, ...prev].slice(0, 20));

      // Show notification
      showNotification({
        title: `Match Found: ${(match.score * 100).toFixed(0)}%`,
        message: match.reason,
        action: () => navigate(`/personnes/${match.personneId1}`),
      });

      // Play sound
      playSound('match.mp3');
    });

    return unsubscribe;
  }, []);

  const handleIgnoreMatch = (matchId: string) => {
    setMatches(prev => prev.filter(m => m.matchId !== matchId));
  };

  const handleViewMatch = (matchId: string) => {
    const match = matches.find(m => m.matchId === matchId);
    if (match) {
      navigate(`/matching/${match.personneId1}/${match.personneId2}`);
    }
  };

  return (
    <div className="match-notifications">
      <h3>Potential Matches</h3>
      <div className="matches-list">
        {matches.map((match) => (
          <div key={match.matchId} className="match-card">
            <div className="score">
              {(match.score * 100).toFixed(0)}%
            </div>

            <div className="details">
              <h4>Possible Match Found</h4>
              <p>{match.reason}</p>
              <span className="timestamp">
                {new Date(match.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="actions">
              <button
                className="primary"
                onClick={() => handleViewMatch(match.matchId)}
              >
                View
              </button>
              <button
                className="secondary"
                onClick={() => handleIgnoreMatch(match.matchId)}
              >
                Ignore
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Dossier Collaboration

### Live Dossier Updates

```typescript
// components/DossierView.tsx
import { useEffect } from 'react';
import { getWebSocketService } from '@/services/websocket';

export function DossierView({ dossierId }: { dossierId: string }) {
  const ws = getWebSocketService();

  useEffect(() => {
    // Subscribe to dossier updates
    const unsubscribe = ws.onDossierUpdate((update) => {
      if (update.dossierId !== dossierId) return;

      switch (update.type) {
        case 'status_change':
          console.log('Status changed:', update.data);
          refreshDossierData();
          break;

        case 'comment':
          console.log('New comment:', update.data);
          addCommentToView(update.data);
          break;

        case 'updated':
          console.log('Dossier updated');
          refreshDossierData();
          break;

        case 'created':
          console.log('Dossier created');
          break;
      }
    });

    // Subscribe to this dossier
    ws.subscribeToDossier(dossierId as any);

    return () => {
      unsubscribe();
      ws.unsubscribeFromDossier(dossierId as any);
    };
  }, [dossierId]);

  const handleStatusChange = async (newStatus: string) => {
    // Update in database
    await updateDossierStatus(dossierId, newStatus);

    // Notify via WebSocket
    await ws.notifyDossierChange(dossierId as any, 'status_change', {
      oldStatus: getCurrentStatus(),
      newStatus,
    });
  };

  const handleAddComment = async (content: string) => {
    // Add to database
    const comment = await addComment(dossierId, content);

    // Notify via WebSocket
    await ws.notifyDossierChange(dossierId as any, 'comment', {
      id: comment.id,
      content: comment.content,
      author: getCurrentUserId(),
      timestamp: Date.now(),
    });
  };

  return (
    <div className="dossier-view">
      {/* Dossier content */}
    </div>
  );
}
```

---

## Complete Example: App Initialization

```typescript
// App.tsx
import { useEffect } from 'react';
import { initializeWebSocketService } from '@/services/websocket';
import { getCurrentUser } from '@/auth';

export function App() {
  useEffect(() => {
    const initWebSocket = async () => {
      try {
        const user = getCurrentUser();
        
        if (!user) {
          console.log('Not authenticated');
          return;
        }

        // Initialize WebSocket service
        const ws = await initializeWebSocketService(
          user.id,
          process.env.REACT_APP_WEBSOCKET_URL || 'wss://localhost:8080',
          5000 // reconnect interval
        );

        // Log connection status
        console.log('WebSocket initialized');
        console.log('Connected:', ws.isConnected());

        // Setup event listeners
        ws.onEvent?.('open', () => {
          console.log('WebSocket connected');
        });

        ws.onEvent?.('close', () => {
          console.log('WebSocket disconnected');
        });

        ws.onEvent?.('error', (event) => {
          console.error('WebSocket error:', event.error);
        });

        // Cleanup on unmount
        return () => {
          ws.close();
        };
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    };

    initWebSocket();
  }, []);

  return <YourApp />;
}
```

---

See [WEBSOCKET_SERVICES_COMPLETE.md](../WEBSOCKET_SERVICES_COMPLETE.md) for more examples and API reference.
