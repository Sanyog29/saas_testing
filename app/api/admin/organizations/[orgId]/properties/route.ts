import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/admin/organizations/[orgId]/properties
 * 
 * Get properties for a specific organization
 * Uses service role - bypasses RLS
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ orgId: string }> }
) {
    const { orgId } = await params;

    const { data, error } = await supabaseAdmin
        .from('properties')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Admin fetch properties error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }

    // Add default counts
    const propertiesWithStats = (data || []).map((property) => ({
        ...property,
        user_count: 0,
        active_user_count: 0,
        open_tickets_count: 0
    }));

    return NextResponse.json(propertiesWithStats);
}
