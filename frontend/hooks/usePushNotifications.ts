'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/frontend/utils/supabase/client';
import { requestForToken, onMessageListener, app } from '@/frontend/lib/firebase';

export function usePushNotifications() {
    const [token, setToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const initializePush = async () => {
            if (!app) {
                console.warn('Push Notifications: Firebase app not initialized. Check your .env configuration.');
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Register Service Worker
            let registration: ServiceWorkerRegistration | undefined;
            if ('serviceWorker' in navigator) {
                try {
                    registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    await navigator.serviceWorker.ready; // Wait for it to be ready
                    console.log('Push Service Worker registered and ready');
                } catch (err) {
                    console.error('Service Worker registration failed:', err);
                }
            }

            if (!registration) {
                console.warn('Cannot obtain token without service worker registration.');
                return;
            }

            // Get FCM Token
            const fcmToken = await requestForToken(registration);
            if (fcmToken) {
                setToken(fcmToken);

                // Fetch property membership to populate property_id
                const { data: membershipData } = await supabase
                    .from('property_memberships')
                    .select('property_id')
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .limit(1)
                    .maybeSingle();

                const propertyId = membershipData?.property_id || null;

                // Save token to database
                const { error } = await supabase
                    .from('push_tokens')
                    .upsert({
                        user_id: user.id,
                        token: fcmToken,
                        browser: navigator.userAgent,
                        property_id: propertyId,
                        is_active: true,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'token'
                    });

                if (error) {
                    console.error('Error saving push token to database:', error);
                } else {
                    console.log('Push token saved successfully to database via hook for property:', propertyId);
                }
            } else {
                console.warn('FCM Token could not be retrieved.');
            }
        };

        initializePush();

        // Listen for foreground messages
        if (app) {
            onMessageListener().then((payload: any) => {
                setNotification(payload);
                console.log('Foreground notification received:', payload);
            });
        }
    }, []);

    return { token, notification };
}
