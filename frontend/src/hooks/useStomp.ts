import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let globalClient: Client | null = null;
let clientSubscribers = 0;
const connectListeners = new Set<() => void>();
const disconnectListeners = new Set<() => void>();

const rawBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
const normalizedBase = rawBaseUrl
  ? (/^https?:\/\//i.test(rawBaseUrl.trim()) ? rawBaseUrl.trim() : `https://${rawBaseUrl.trim()}`).replace(/\/$/, '')
  : '';
const wsEndpoint = normalizedBase ? `${normalizedBase}/ws` : '/ws';

function getStompClient(): Client {
  if (!globalClient) {
    globalClient = new Client({
      webSocketFactory: () => new SockJS(wsEndpoint),
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {}, // silence debug logs in production
      onConnect: () => {
        connectListeners.forEach((fn) => {
          try {
            fn();
          } catch (e) {
            console.error('STOMP connect listener error', e);
          }
        });
      },
      onWebSocketClose: () => {
        disconnectListeners.forEach((fn) => {
          try {
            fn();
          } catch (e) {}
        });
      },
    });
    globalClient.activate();
  }
  return globalClient;
}

export function useStompTopic<T>(topic: string, onMessage: (data: T) => void) {
  const [connected, setConnected] = useState(false);
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    if (!topic || topic.endsWith('/')) {
      setConnected(false);
      return;
    }

    clientSubscribers++;
    const client = getStompClient();

    let subscription: any = null;

    const setupSubscription = () => {
      if (!client.connected) return;
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (e) {}
        subscription = null;
      }
      setConnected(true);
      subscription = client.subscribe(topic, (msg) => {
        try {
          const payload = JSON.parse(msg.body) as T;
          callbackRef.current(payload);
        } catch (e) {
          console.error('Failed to parse STOMP message', e);
        }
      });
    };

    const handleDisconnect = () => {
      setConnected(false);
    };

    connectListeners.add(setupSubscription);
    disconnectListeners.add(handleDisconnect);

    if (client.connected) {
      setupSubscription();
    }

    return () => {
      connectListeners.delete(setupSubscription);
      disconnectListeners.delete(handleDisconnect);
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (e) {}
        subscription = null;
      }
      clientSubscribers--;
      if (clientSubscribers <= 0 && globalClient) {
        globalClient.deactivate();
        globalClient = null;
      }
    };
  }, [topic]);

  return { connected };
}
