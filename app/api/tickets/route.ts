import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * GET /api/tickets
 * 
 * Fetch tickets for the current user's organization, or all tickets if Master Admin
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if Master Admin
        const adminClient = createAdminClient();
        const { data: userRecord } = await adminClient
            .from('users')
            .select('is_master_admin')
            .eq('id', user.id)
            .single();

        const isMasterAdmin = userRecord?.is_master_admin === true;

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const organizationId = searchParams.get('organization_id');

        let query = supabase
            .from('tickets')
            .select(`
        *,
        organization:organizations(id, name, code),
        property:properties(id, name, code),
        raised_by_user:users!tickets_raised_by_fkey(id, full_name, email),
        assigned_to_user:users!tickets_assigned_to_fkey(id, full_name, email),
        ticket_comments(count)
      `)
            .order('created_at', { ascending: false });

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        const { data: tickets, error: fetchError } = await query;

        if (fetchError) {
            console.error('Error fetching tickets:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 });
        }

        return NextResponse.json(tickets || []);

    } catch (error) {
        console.error('Tickets API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/tickets
 * 
 * Create a new support ticket
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { organization_id, property_id, title, description, category, priority } = body;

        if (!organization_id || !title || !description || !category) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create the ticket
        const { data: ticket, error: insertError } = await supabase
            .from('tickets')
            .insert({
                organization_id,
                property_id,
                raised_by: user.id,
                title,
                description,
                category,
                priority: priority || 'medium',
                status: 'open'
            })
            .select(`
        *,
        organization:organizations(id, name, code),
        property:properties(id, name, code)
      `)
            .single();

        if (insertError) {
            console.error('Error creating ticket:', insertError);
            return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
        }

        return NextResponse.json(ticket, { status: 201 });

    } catch (error) {
        console.error('Create ticket API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
