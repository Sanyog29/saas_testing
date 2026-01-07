import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

interface CreateUserRequest {
    email: string
    password?: string
    full_name: string
    organization_id: string
    role?: 'member' | 'admin' | 'owner'
    username?: string
}

/**
 * POST /api/users/create
 * 
 * Directly create a user account and add them to an organization.
 * Use this for admin-initiated user creation (no email verification required).
 * 
 * Required: Caller must be an admin/owner of the organization.
 */
export async function POST(request: NextRequest) {
    try {
        const body: CreateUserRequest = await request.json()
        const {
            email,
            password,
            full_name,
            organization_id,
            role = 'member',
            username
        } = body

        // Validation
        if (!email || !full_name || !organization_id) {
            return NextResponse.json(
                { error: 'Missing required fields: email, full_name, organization_id' },
                { status: 400 }
            )
        }

        if (!email.includes('@')) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }

        // Get the current user's session to verify permissions
        const supabase = await createClient()
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()

        if (authError || !currentUser) {
            return NextResponse.json(
                { error: 'Unauthorized. Please log in.' },
                { status: 401 }
            )
        }

        // Check if current user is org admin
        const { data: isAdmin, error: permError } = await supabase
            .rpc('current_user_is_org_admin', { org_uuid: organization_id })

        if (permError || !isAdmin) {
            return NextResponse.json(
                { error: 'Forbidden. You must be an organization admin to create users.' },
                { status: 403 }
            )
        }

        // Use admin client for user creation (bypasses RLS)
        const adminClient = createAdminClient()

        // Generate a secure temporary password if not provided
        const userPassword = password || generateTempPassword()

        // Create the auth user
        const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password: userPassword,
            email_confirm: true, // Auto-confirm email for admin-created users
            user_metadata: {
                full_name,
                username: username || email.split('@')[0],
                created_by: currentUser.id,
                organization_id,
            }
        })

        if (createError) {
            console.error('User creation error:', createError)

            // Handle duplicate user
            if (createError.message.includes('already registered')) {
                return NextResponse.json(
                    { error: 'A user with this email already exists' },
                    { status: 409 }
                )
            }

            return NextResponse.json(
                { error: createError.message },
                { status: 500 }
            )
        }

        if (!userData.user) {
            return NextResponse.json(
                { error: 'User creation failed - no user returned' },
                { status: 500 }
            )
        }

        // The database trigger will auto-create user_profiles
        // Now create organization membership
        const { error: memberError } = await adminClient
            .from('organization_members')
            .insert({
                organization_id,
                user_id: userData.user.id,
                role,
            })

        if (memberError) {
            console.error('Membership creation error:', memberError)
            // Don't fail - user was created, membership can be fixed manually
        }

        return NextResponse.json({
            success: true,
            message: `User ${email} created successfully`,
            user: {
                id: userData.user.id,
                email: userData.user.email,
                full_name,
                role,
            },
            // Only include temp password in response if it was generated
            ...(password ? {} : { temp_password: userPassword }),
        })

    } catch (error) {
        console.error('Create user API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * Generate a secure temporary password
 */
function generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}
