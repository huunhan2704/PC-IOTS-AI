import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let globalClient: Client | null = null;
let clientSubscribers = 0;

const rawBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL as string | undefined;
const wsEndpoint = rawBaseUrl ? `${rawBaseUrl.replace(/\/$/, '')}/ws` : '/ws';

function getStompClient(): Client {
  if (!globalClient) {
    globalClient = new Client({
      webSocketFactory: () => new SockJS(wsEndpoint),
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: () => {}, // silence debug logs in production
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
    clientSubscribers++;
    const client = getStompClient();

    let subscription: any = null;

    const setupSubscription = () => {
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

    if (client.connected) {
      setupSubscription();
    } else {
      const origOnConnect = client.onConnect;
      client.onConnect = (frame) => {
        if (origOnConnect) origOnConnect(frame);
        setupSubscription();
      };
    }

    client.onWebSocketClose = () => {
      setConnected(false);
    };

    return () => {
      if (subscription) {
        subscription.unsubscribe();
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
