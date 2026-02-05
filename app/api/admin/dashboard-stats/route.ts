import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/frontend/utils/supabase/server'
import { createAdminClient } from '@/frontend/utils/supabase/admin'

/**
 * GET /api/admin/dashboard-stats
 * 
 * Securely fetch global stats for the Master Admin console.
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Verify Authentication & Master Admin Status
        const supabase = await createClient()
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const adminClient = createAdminClient()

        const { data: masterAdminCheck, error: checkError } = await adminClient
            .from('users')
            .select('is_master_admin')
            .eq('id', currentUser.id)
            .single()

        if (checkError || !masterAdminCheck?.is_master_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 2. Fetch Aggregated Stats

        // Count Licensed Entities (Properties)
        const { count: entitiesCount, error: entityError } = await adminClient
            .from('properties')
            .select('*', { count: 'exact', head: true });

        // Count Active Sessions (session_end is null)
        const { count: activeSessionsCount, error: sessionError } = await adminClient
            .from('user_sessions')
            .select('*', { count: 'exact', head: true })
            .is('session_end', null);

        // Count Security Alerts (recent audit logs - last 24h)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { count: securityAlertsCount, error: alertError } = await adminClient
            .from('audit_logs')
            .select('*', { count: 'exact', head: true })
            .gte('event_at', yesterday.toISOString());

        // Count Pending Deletions (Organizations with is_deleted = true)
        const { count: pendingDeletionsCount, error: deletionError } = await adminClient
            .from('organizations')
            .select('*', { count: 'exact', head: true })
            .eq('is_deleted', true);

        // 3. Return Data with nice fallbacks
        return NextResponse.json({
            entities: entitiesCount || 0,
            activeSessions: activeSessionsCount || 0,
            securityAlerts: securityAlertsCount || 0,
            pendingDeletions: pendingDeletionsCount || 0,
            status: 'operational'
        });

    } catch (error) {
        console.error('Admin stats API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
