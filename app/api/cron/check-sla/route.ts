import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/frontend/utils/supabase/server';

/**
 * GET /api/cron/check-sla
 * Checks active tickets for approaching SLA breaches (e.g., due in < 30 mins).
 * Inserts notifications for assigned MSTs.
 * Intended to be called by an external cron service (e.g., Vercel Cron, GitHub Actions).
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // 1. Fetch tickets nearing SLA (Mock logic: 'in_progress' tickets created > 2 hours ago for this demo)
        // In reality, this would check `due_at` vs `now()`. 
        // For this demo, let's find tickets that are 'in_progress' and NOT yet notified to avoid spam.
        // We'll calculate "due_at" dynamically (e.g. 4 hours from creation) just for the simulation.

        const { data: tickets, error } = await supabase
            .from('tickets')
            .select(`
                id, ticket_number, title, created_at, assigned_to
            `)
            .eq('status', 'in_progress')
            .not('assigned_to', 'is', null);

        if (error) throw error;

        const notifications = [];
        const now = new Date();

        for (const ticket of tickets || []) {
            const createdAt = new Date(ticket.created_at);
            const dueAt = new Date(createdAt.getTime() + 4 * 60 * 60 * 1000); // Mock 4h SLA
            const timeRemaining = dueAt.getTime() - now.getTime();
            const minutesRemaining = Math.floor(timeRemaining / 60000);

            // Notify if between 0 and 30 mins remaining
            // For demo purposes, we might relax this to just "active tickets" to show it working
            if (minutesRemaining > 0 && minutesRemaining <= 30) {
                // Check if already notified recently (omitted for MVP simplicity)

                notifications.push({
                    type: 'sla_warning',
                    recipient_role: 'MST',
                    recipient_id: ticket.assigned_to,
                    title: 'SLA At Risk',
                    body: `${ticket.ticket_number} is expiring in ${minutesRemaining} minutes.`,
                    entity_id: ticket.id
                });
            }
        }

        if (notifications.length > 0) {
            const { error: insertError } = await supabase
                .from('notifications')
                .insert(notifications);

            if (insertError) throw insertError;
        }

        return NextResponse.json({
            success: true,
            checked: tickets?.length,
            notifications_sent: notifications.length
        });

    } catch (error) {
        console.error('[SLA Cron] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
