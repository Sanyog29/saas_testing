import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/frontend/utils/supabase/server';

/**
 * POST /api/tickets/batch-assign
 * Accepts an array of assignments: { ticket_id, assigned_to }
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { assignments } = body;

        if (!Array.isArray(assignments) || assignments.length === 0) {
            return NextResponse.json({ error: 'Invalid assignments data' }, { status: 400 });
        }

        const now = new Date().toISOString();
        const results = [];
        const auditLogs = [];
        const notifications = [];

        // In a real production app, use an RPC or transaction
        // For this implementation, we'll iterate and update (Supabase doesn't support transactions via REST easily)
        for (const assignment of assignments) {
            const { ticket_id, assigned_to } = assignment;

            // 1. Update Ticket
            const updates: any = {
                updated_at: now,
                assigned_to: assigned_to,
                status: assigned_to ? 'assigned' : 'waitlist',
                assigned_at: assigned_to ? now : null
            };

            const { data: ticket, error: updateError } = await supabase
                .from('tickets')
                .update(updates)
                .eq('id', ticket_id)
                .select('id, ticket_number, title')
                .single();

            if (updateError) {
                console.error(`[Batch Assign] Failed to update ticket ${ticket_id}:`, updateError);
                continue;
            }

            results.push(ticket);

            // 2. Prepare Audit Log
            auditLogs.push({
                ticket_id: ticket_id,
                user_id: user.id,
                action: assigned_to ? 'assigned' : 'unassigned',
                new_value: assigned_to || 'waitlist'
            });

            // 3. Prepare Notification if assigned
            if (assigned_to) {
                notifications.push({
                    type: 'ticket_assigned',
                    recipient_role: 'MST',
                    recipient_id: assigned_to,
                    title: 'New ticket assigned',
                    body: `${ticket.ticket_number || 'A ticket'} has been assigned to you`,
                    entity_id: ticket_id
                });
            }
        }

        // Batch insert audit logs
        if (auditLogs.length > 0) {
            await supabase.from('ticket_activity_log').insert(auditLogs);
        }

        // Batch insert notifications
        if (notifications.length > 0) {
            const { error: notifError } = await supabase.from('notifications').insert(notifications);
            if (notifError) {
                console.error('[Batch Assign] Notification insert error:', notifError);
            }
        }

        // Audit Event (PRD 8)
        console.log('[Audit] ticket.assignment_saved', {
            tickets: results.map(t => t.id),
            actor: user.id,
            timestamp: now
        });

        return NextResponse.json({
            success: true,
            updated_count: results.length
        });

    } catch (error) {
        console.error('[Batch Assign API] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
