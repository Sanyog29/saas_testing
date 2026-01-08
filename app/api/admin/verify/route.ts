import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * GET /api/admin/verify
 * 
 * Verify if the current user is a Master Admin
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ isMasterAdmin: false }, { status: 401 });
        }

        // Check is_master_admin column from database
        const adminClient = createAdminClient();
        const { data: userRecord, error: checkError } = await adminClient
            .from('users')
            .select('is_master_admin')
            .eq('id', user.id)
            .single();

        if (checkError) {
            console.error('❌ Error checking master admin status:', checkError);
            return NextResponse.json({ isMasterAdmin: false }, { status: 500 });
        }

        console.log('🔍 Master Admin Check - User ID:', user.id);
        console.log('🔍 User Record:', userRecord);
        console.log('🔍 is_master_admin value:', userRecord?.is_master_admin);
        console.log('🔍 Final result:', userRecord?.is_master_admin === true);

        return NextResponse.json({
            isMasterAdmin: userRecord?.is_master_admin === true
        });

    } catch (error) {
        console.error('Verify admin API error:', error);
        return NextResponse.json({ isMasterAdmin: false }, { status: 500 });
    }
}
