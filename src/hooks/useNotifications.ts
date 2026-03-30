import { useRef, useCallback } from 'react';

// Генерируем звук через Web Audio API (не нужны внешние файлы)
function createNotificationSound(ctx: AudioContext, type: 'message' | 'chat' = 'message') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'message') {
    // Два коротких тона — как колокольчик старых перьев
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } else {
    // Мягкий гонг
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  }
}

export function useNotifications() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const permissionRef = useRef<NotificationPermission>('default');

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') {
      permissionRef.current = 'granted';
      return true;
    }
    if (Notification.permission !== 'denied') {
      const perm = await Notification.requestPermission();
      permissionRef.current = perm;
      return perm === 'granted';
    }
    return false;
  }, []);

  const playSound = useCallback((type: 'message' | 'chat' = 'message') => {
    try {
      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => createNotificationSound(ctx, type));
      } else {
        createNotificationSound(ctx, type);
      }
    } catch (e) {
      // Браузер заблокировал — молчим
    }
  }, [getAudioCtx]);

  const showPushNotification = useCallback((title: string, body: string, chatId?: string) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Не показываем если вкладка активна
    if (!document.hidden) return;

    const n = new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: chatId || 'folio-msg',
      silent: true, // звук уже играет через Web Audio
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };

    setTimeout(() => n.close(), 5000);
  }, []);

  const notifyNewMessage = useCallback((sender: string, text: string, chatName: string, chatId?: string) => {
    playSound('message');
    showPushNotification(
      `📜 ${chatName}`,
      `${sender}: ${text.slice(0, 60)}`,
      chatId
    );
  }, [playSound, showPushNotification]);

  return { requestPermission, playSound, showPushNotification, notifyNewMessage };
}
