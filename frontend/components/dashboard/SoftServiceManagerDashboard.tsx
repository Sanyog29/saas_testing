'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Sparkles, Package, ClipboardCheck, LogOut, Menu, X, LayoutDashboard, Settings, UserCircle, Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { createClient } from '@/frontend/utils/supabase/client';
import { useAuth } from '@/frontend/context/AuthContext';
import Skeleton from '@/frontend/components/ui/Skeleton';
import SignOutModal from '@/frontend/components/ui/SignOutModal';
import NotificationBell from './NotificationBell';

const StockDashboard = dynamic(
    () => import('@/frontend/components/stock/StockDashboard'),
    { ssr: false, loading: () => <div className="p-8"><Skeleton className="h-96" /></div> }
);

const SOPDashboard = dynamic(
    () => import('@/frontend/components/sop/SOPDashboard'),
    { ssr: false, loading: () => <div className="p-8"><Skeleton className="h-96" /></div> }
);

type Tab = 'stock' | 'sop' | 'settings' | 'profile';

interface SoftServiceManagerDashboardProps {
    propertyId: string;
}

const SoftServiceManagerDashboard: React.FC<SoftServiceManagerDashboardProps> = ({ propertyId }) => {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const supabase = useMemo(() => createClient(), []);

    const [activeTab, setActiveTab] = useState<Tab>('stock');
    const [property, setProperty] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showSignOutModal, setShowSignOutModal] = useState(false);

    useEffect(() => {
        const fetchProperty = async () => {
            const { data } = await supabase
                .from('properties')
                .select('*')
                .eq('id', propertyId)
                .maybeSingle();
            setProperty(data);
        };
        fetchProperty();
    }, [propertyId, supabase]);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setSidebarOpen(false);
    };

    return (
        <div className="min-h-screen bg-white flex font-inter text-text-primary">
            {/* Mobile Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside className={`
                w-72 bg-white border-r border-slate-300 flex flex-col h-screen z-50 transition-all duration-300
                fixed top-0
                ${sidebarOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 lg:translate-y-0 lg:translate-x-0 lg:opacity-100'}
            `}>
                {/* Mobile Close Button */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 lg:hidden p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <X className="w-5 h-5 text-text-secondary" />
                </button>
                <div className="p-4 lg:p-5 pb-2">
                    <div className="flex flex-col items-center gap-1 mb-3">
                        <img src="/autopilot-logo-new.png" alt="Autopilot Logo" className="h-10 w-auto object-contain" />
                        <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.2em]">Soft Service Manager</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 overflow-y-auto">
                    {/* Operations */}
                    <div className="mb-6">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-3 flex items-center gap-2">
                            <span className="w-0.5 h-3 bg-primary rounded-full"></span>
                            Operations
                        </p>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleTabChange('stock')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${activeTab === 'stock'
                                    ? 'bg-primary text-text-inverse shadow-sm'
                                    : 'text-text-secondary hover:bg-muted hover:text-text-primary'
                                    }`}
                            >
                                <Package className="w-4 h-4" />
                                Stock Management
                            </button>
                            <button
                                onClick={() => handleTabChange('sop')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${activeTab === 'sop'
                                    ? 'bg-primary text-text-inverse shadow-sm'
                                    : 'text-text-secondary hover:bg-muted hover:text-text-primary'
                                    }`}
                            >
                                <ClipboardCheck className="w-4 h-4" />
                                SOP Checklists
                            </button>
                        </div>
                    </div>

                    {/* System & Personal */}
                    <div className="mb-6">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 mb-3 flex items-center gap-2">
                            <span className="w-0.5 h-3 bg-primary rounded-full"></span>
                            System & Personal
                        </p>
                        <div className="space-y-1">
                            <button
                                onClick={() => handleTabChange('settings')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${activeTab === 'settings'
                                    ? 'bg-primary text-text-inverse shadow-sm'
                                    : 'text-text-secondary hover:bg-muted hover:text-text-primary'
                                    }`}
                            >
                                <Settings className="w-4 h-4" />
                                Settings
                            </button>
                            <button
                                onClick={() => handleTabChange('profile')}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-bold text-sm ${activeTab === 'profile'
                                    ? 'bg-primary text-text-inverse shadow-sm'
                                    : 'text-text-secondary hover:bg-muted hover:text-text-primary'
                                    }`}
                            >
                                <UserCircle className="w-4 h-4" />
                                Profile
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="px-4 py-3 border-t border-border mt-auto">
                    <button
                        onClick={() => setShowSignOutModal(true)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-text-secondary hover:bg-red-50 hover:text-red-600 transition-all font-bold text-xs"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            <SignOutModal
                isOpen={showSignOutModal}
                onClose={() => setShowSignOutModal(false)}
                onConfirm={signOut}
            />

            {/* Main Content */}
            <main className="flex-1 lg:ml-72 flex flex-col bg-white border-l border-slate-300 shadow-[-4px_0_12px_-4px_rgba(0,0,0,0.05)] relative z-10 min-h-screen">
                <header className="h-20 flex justify-between items-center px-4 md:px-8 lg:px-12 border-b border-border/10">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 lg:hidden text-text-tertiary hover:text-text-primary transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight capitalize">{activeTab.replace(/_/g, ' ')}</h1>
                            <p className="text-text-tertiary text-xs md:text-sm font-medium mt-0.5">{property?.address || 'Property Management Hub'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <NotificationBell />

                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => handleTabChange('profile')}
                                className="flex items-center gap-4 group transition-all"
                            >
                                <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center text-text-inverse font-bold text-base group-hover:scale-105 transition-transform shadow-sm shadow-primary/20">
                                    {user?.email?.[0].toUpperCase() || 'M'}
                                </div>
                                <div className="text-left hidden md:block">
                                    <h4 className="text-[15px] font-black text-text-primary leading-none mb-1 group-hover:text-primary transition-colors">
                                        {user?.user_metadata?.full_name || 'Soft Service Manager'}
                                    </h4>
                                    <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.15em]">
                                        View Profile
                                    </p>
                                </div>
                            </button>

                            <div className="hidden lg:flex flex-col items-end border-l border-border pl-6 h-8 justify-center">
                                <span className="text-[11px] font-black text-text-tertiary uppercase tracking-widest leading-none mb-1">Access Level</span>
                                <span className="text-xs text-primary font-black uppercase tracking-widest leading-none">Manager</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:px-12 pt-4 md:pt-8 pb-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            {activeTab === 'stock' && (
                                <StockDashboard propertyId={propertyId} />
                            )}

                            {activeTab === 'sop' && (
                                <SOPDashboard propertyId={propertyId} />
                            )}

                            {activeTab === 'settings' && (
                                <div className="p-12 text-center text-slate-400 font-bold italic bg-white rounded-3xl border border-slate-100 shadow-sm">
                                    <Settings className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 font-inter not-italic">Settings</h3>
                                    <p className="text-slate-500 font-inter not-italic font-medium">Settings management loading...</p>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="p-12 text-center text-slate-400 font-bold italic bg-white rounded-3xl border border-slate-100 shadow-sm">
                                    <UserCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 font-inter not-italic">Profile</h3>
                                    <p className="text-slate-500 font-inter not-italic font-medium">User profile loading...</p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};
export default SoftServiceManagerDashboard;
