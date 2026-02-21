import { createClient } from '@/frontend/utils/supabase/client';
import { useEffect, useState } from 'react';

export interface AppSession {
    user_id: string;
    role: 'master_admin' | 'org_super_admin' | 'org_admin' | 'property_admin' | 'staff' | 'soft_service_manager' | 'soft_service_staff' | 'tenant';
    org_id: string;
    property_ids: string[];
    available_modules: string[];
}

export function useAppSession() {
    const [session, setSession] = useState<AppSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function getSessionData() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setSession(null);
                setIsLoading(false);
                return;
            }

            // In real implementation, fetch from organization_memberships / property_memberships
            // For this implementation, we simulate based on email/metadata
            let role = user.user_metadata.role || 'tenant';
            const org_id = user.user_metadata.org_id || 'default-org';

            // FORCE Master Admin role for these specific emails
            if (user.email === 'ranganathanlohitaksha@gmail.com') {
                role = 'master_admin';
            }

            // Fetch memberships
            const { data: orgMem } = await supabase
                .from('organization_memberships')
                .select('role')
                .eq('user_id', user.id)
                .maybeSingle();

            const { data: propMems } = await supabase
                .from('property_memberships')
                .select('property_id, role')
                .eq('user_id', user.id);

            // Prioritize roles: Org Member > Property Member > Metadata > Default (tenant)
            // Filter out generic roles if possible, or just take first non-empty
            const propRole = propMems?.find(p => p.role && p.role !== 'tenant')?.role || propMems?.[0]?.role;
            const membershipRole = orgMem?.role || propRole;

            console.log('[useAppSession] Role resolution:', {
                orgRole: orgMem?.role,
                propRole,
                metadataRole: role,
                resolved: membershipRole || role
            });

            setSession({
                user_id: user.id,
                role: (membershipRole || role) as any,
                org_id,
                property_ids: propMems?.map(pm => pm.property_id) || [],
                available_modules: ['ticketing', 'viewer', 'analytics', 'stock', 'sop']
            });
            setIsLoading(false);
        }

        getSessionData();
    }, [supabase]);

    return { session, isLoading };
}
