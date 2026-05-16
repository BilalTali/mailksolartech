import { useState, useCallback, useEffect } from 'react';
import api from '@/services/axios';

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            navigator.serviceWorker.ready.then((reg) => {
                reg.pushManager.getSubscription().then((sub) => {
                    setIsSubscribed(sub !== null);
                });
            });
        }
    }, []);

    const subscribe = useCallback(async () => {
        if (!isSupported) return false;

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return false;

            const registration = await navigator.serviceWorker.ready;
            
            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_KEY)
                });
            }

            const subData = subscription.toJSON();

            await api.post('/push/subscribe', {
                endpoint: subData.endpoint,
                keys: subData.keys
            });

            setIsSubscribed(true);
            return true;
        } catch (err) {
            console.error('Failed to subscribe:', err);
            return false;
        }
    }, [isSupported]);

    return { isSupported, isSubscribed, subscribe };
}
