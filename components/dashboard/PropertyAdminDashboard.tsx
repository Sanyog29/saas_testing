'use client';

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Users, Ticket, Settings,
    Search, Plus, Filter, Bell, LogOut, ChevronRight, MapPin, Building2,
    Calendar, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';

// Types
type Tab = 'overview' | 'units' | 'tenants' | 'tickets' | 'settings';

interface Property {
    id: string;
    name: string;
    code: string;
    address: string;
    organization_id: string;
}

interface TicketData {
    id: string;
    title: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
}

const PropertyAdminDashboard = () => {
    const { user, signOut } = useAuth();
    const params = useParams();
    const router = useRouter();
    const orgSlug = params?.orgId as string;
    const propertyId = params?.propertyId as string;

    // State
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [property, setProperty] = useState<Property | null>(null);
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    const supabase = createClient();

    useEffect(() => {
        if (propertyId) {
            fetchPropertyDetails();
        }
    }, [propertyId]);

    const fetchPropertyDetails = async () => {
        setIsLoading(true);
        setErrorMsg('');

        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', propertyId)
            .maybeSingle();

        if (error || !data) {
            setErrorMsg('Property not found.');
        } else {
            setProperty(data);
        }
        setIsLoading(false);
    };

    const navItems: { id: Tab, label: string, icon: any }[] = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'units', label: 'Units', icon: Building2 },
        { id: 'tenants', label: 'Tenants', icon: Users },
        { id: 'tickets', label: 'Tickets', icon: Ticket },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                <p className="text-slate-500 font-bold">Loading property dashboard...</p>
            </div>
        </div>
    );

    if (!property) return (
        <div className="p-10 text-center">
            <h2 className="text-xl font-bold text-red-600">Error Loading Dashboard</h2>
            <p className="text-slate-600 mt-2">{errorMsg || 'Property not found.'}</p>
            <button onClick={() => router.back()} className="mt-4 text-emerald-600 font-bold hover:underline">Go Back</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FC] flex font-inter text-slate-900">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-100 flex flex-col fixed h-full z-10">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-slate-200">
                            {property?.name?.substring(0, 1) || 'P'}
                        </div>
                        <div>
                            <h2 className="font-bold text-sm leading-tight text-slate-900 truncate max-w-[160px]">{property?.name}</h2>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Property Manager</p>
                        </div>
                    </div>
                </div>

                <nav className="space-y-2 flex-1 px-4">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm ${activeTab === item.id
                                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="pt-8 border-t border-slate-100 p-6">
                    {/* User Profile Section */}
                    <div className="flex items-center gap-3 px-2 mb-6">
                        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-slate-200">
                            {user?.email?.[0].toUpperCase() || 'P'}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-bold text-sm text-slate-900 truncate">
                                {user?.user_metadata?.full_name || 'Property Admin'}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate font-medium">
                                {user?.email}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (window.confirm('Are you sure you want to log out?')) {
                                signOut();
                            }
                        }}
                        className="flex items-center gap-3 px-4 py-3.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl w-full transition-all duration-300 text-sm font-bold group"
                    >
                        <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-72 p-8 lg:p-12 overflow-y-auto min-h-screen">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{activeTab}</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">{property.address || 'Property Management Hub'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-black text-slate-900 tracking-tight">Access Level</span>
                            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Property admin</span>
                        </div>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'overview' && <OverviewTab />}
                        {activeTab === 'tickets' && <div className="p-12 text-center text-slate-400 font-bold italic bg-white rounded-3xl border border-slate-100 shadow-sm">Property Ticketing Module Loading...</div>}
                        {activeTab === 'tenants' && <div className="p-12 text-center text-slate-400 font-bold italic bg-white rounded-3xl border border-slate-100 shadow-sm">Tenant Directory Loading...</div>}
                        {activeTab === 'units' && <div className="p-12 text-center text-slate-400 font-bold italic bg-white rounded-3xl border border-slate-100 shadow-sm">Unit Management Loading...</div>}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

const OverviewTab = () => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Active Tenants" value="24" icon={Users} color="text-blue-600" bg="bg-blue-50" />
            <StatCard title="Occupancy Rate" value="92%" icon={Building2} color="text-emerald-600" bg="bg-emerald-50" />
            <StatCard title="Open Tickets" value="8" icon={Ticket} color="text-amber-600" bg="bg-amber-50" />
            <StatCard title="Due Payments" value="3" icon={Clock} color="text-rose-600" bg="bg-rose-50" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-900">Recent Activity</h3>
                    <button className="text-slate-900 text-xs font-black hover:underline uppercase tracking-widest">View All</button>
                </div>
                <div className="space-y-6">
                    <ActivityItem
                        icon={Ticket}
                        color="bg-amber-100 text-amber-600"
                        title="New Maintenance Request"
                        desc="Leaking faucet in Unit 302"
                        time="2h ago"
                    />
                    <ActivityItem
                        icon={CheckCircle2}
                        color="bg-emerald-100 text-emerald-600"
                        title="Rent Payment Received"
                        desc="Unit 105 - John Doe"
                        time="5h ago"
                    />
                    <ActivityItem
                        icon={Users}
                        color="bg-slate-100 text-slate-600"
                        title="New Tenant Check-in"
                        desc="Sarah Parker - Unit 412"
                        time="Yesterday"
                    />
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-900">Upcoming Inspections</h3>
                    <Calendar className="w-5 h-5 text-slate-400" />
                </div>
                <div className="space-y-4">
                    <InspectionItem date="Jan 15" unit="Unit 201" status="Scheduled" />
                    <InspectionItem date="Jan 18" unit="Unit 505" status="Scheduled" />
                    <InspectionItem date="Jan 20" unit="Lobby Area" status="Maintenance" />
                </div>
            </div>
        </div>
    </div>
);

const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className={`w-12 h-12 ${bg} ${color} rounded-2xl flex items-center justify-center mb-4`}>
            <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-3xl font-black text-slate-900">{value}</p>
    </div>
);

const ActivityItem = ({ icon: Icon, color, title, desc, time }: any) => (
    <div className="flex gap-4">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shrink-0`}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-500">{desc}</p>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{time}</span>
    </div>
);

const InspectionItem = ({ date, unit, status }: any) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-4">
            <div className="bg-white w-12 py-2 rounded-xl text-center border border-slate-200">
                <span className="block text-[8px] font-black text-slate-400 uppercase tracking-tighter">Jan</span>
                <span className="block font-black text-sm text-slate-900 leading-none">{date.split(' ')[1]}</span>
            </div>
            <div>
                <p className="font-bold text-slate-900 text-sm">{unit}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{status}</p>
            </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
    </div>
);

export default PropertyAdminDashboard;
