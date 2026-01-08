import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/organizations/[orgId]/metrics
 * 
 * Get organization metrics
 * Uses service role - bypasses RLS
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const { orgId } = await params;

    // Count users via organization_memberships
    const { count: totalUsers } = await supabaseAdmin
        .from('organization_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);

    // Count properties
    const { count: propertiesCount } = await supabaseAdmin
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);

    return NextResponse.json({
        total_users: totalUsers || 0,
        user_status: {
            active: totalUsers || 0,
            inactive: 0,
            dead: 0
        },
        properties: propertiesCount || 0,
        storage_used_gb: 0,
        storage_percentage: 0,
        db_load_req_per_sec: 0
    });
}
