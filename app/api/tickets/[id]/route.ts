import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * PATCH /api/tickets/[id]
 * 
 * Update ticket status, assignment, etc. (Master Admin only)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: ticketId } = await params;
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify Master Admin
        const adminClient = createAdminClient();
        const { data: userRecord } = await adminClient
            .from('users')
            .select('is_master_admin')
            .eq('id', user.id)
            .single();

        if (!userRecord?.is_master_admin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { status, assigned_to, priority } = body;

        const updateData: any = {};

        if (status) updateData.status = status;
        if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
        if (priority) updateData.priority = priority;

        // If marking as resolved, set timestamp
        if (status === 'resolved' && !updateData.resolved_at) {
            updateData.resolved_at = new Date().toISOString();
        }

        updateData.updated_at = new Date().toISOString();

        const { data: ticket, error: updateError } = await adminClient
            .from('tickets')
            .update(updateData)
            .eq('id', ticketId)
            .select(`
        *,
        organization:organizations(id, name, code),
        property:properties(id, name, code),
        raised_by_user:users!tickets_raised_by_fkey(id, full_name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, full_name, email)
      `)
            .single();

        if (updateError) {
            console.error('Error updating ticket:', updateError);
            return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
        }

        return NextResponse.json(ticket);

    } catch (error) {
        console.error('Update ticket API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
