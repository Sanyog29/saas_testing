'use client';

import MasterAdminDashboard from '@/components/dashboard/MasterAdminDashboard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useMasterAdminCheck } from '@/hooks/useMasterAdminCheck';

export default function MasterPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { isMasterAdmin, isLoading: checkingRole } = useMasterAdminCheck();
    const router = useRouter();

    const isLoading = authLoading || checkingRole;

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }

        if (!isLoading && user && !isMasterAdmin) {
            router.push('/organizations');
        }
    }, [user, isMasterAdmin, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
                <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!user || !isMasterAdmin) return null;

    return <MasterAdminDashboard />;
}
