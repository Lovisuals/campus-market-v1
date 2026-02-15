"use client";

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { useRouter } from 'next/navigation';

export function MobileBridge() {
    const router = useRouter();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // 1. Handle Native Back Button (Android)
        const backListener = App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                window.history.back();
            } else {
                App.exitApp();
            }
        });

        // 2. Initialize Push Notifications
        const initPush = async () => {
            let perm = await PushNotifications.checkPermissions();

            if (perm.receive !== 'granted') {
                perm = await PushNotifications.requestPermissions();
            }

            if (perm.receive === 'granted') {
                await PushNotifications.register();
            }
        };

        PushNotifications.addListener('registration', (token) => {
            console.log('Push registration success, token: ' + token.value);
            // TODO: Send this token to Supabase backend associated with user
        });

        PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ' + JSON.stringify(notification));
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ' + JSON.stringify(notification));
            if (notification.notification.data?.url) {
                router.push(notification.notification.data.url);
            }
        });

        initPush();

        return () => {
            backListener.then(l => l.remove());
            PushNotifications.removeAllListeners();
        };
    }, [router]);

    return null;
}
