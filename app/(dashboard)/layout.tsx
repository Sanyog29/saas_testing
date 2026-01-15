'use client';

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ContextBar } from "@/components/layout/ContextBar";
import DashboardSidebar, { MobileHeader } from "@/components/layout/DashboardSidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    // Close mobile sidebar on route change
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (isMobileSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileSidebarOpen]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-primary font-display font-bold">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm animate-pulse tracking-widest uppercase">Initializing...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const isFullDashboard = pathname?.endsWith('/dashboard');

    if (isFullDashboard) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen bg-[#fafbfc]">
            {/* Mobile Header */}
            <MobileHeader onMenuToggle={() => setIsMobileSidebarOpen(true)} />

            {/* Sidebar */}
            <DashboardSidebar
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 pt-[56px] lg:pt-0">
                {/* Context Bar - Hidden on mobile, shown on desktop */}
                <div className="hidden lg:block">
                    <ContextBar />
                </div>

                <main className="flex-1 overflow-y-auto touch-scroll responsive-container py-4 lg:py-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
