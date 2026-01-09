'use client';

import React, { useState, useEffect } from 'react';
import {
    Users, Clock, LogIn, LogOut, Search, FileDown,
    ChevronRight, CheckCircle2, XCircle, User, Truck, Building2
} from 'lucide-react';
import { motion } from 'framer-motion';

interface VMSAdminDashboardProps {
    propertyId: string;
}

interface VisitorLog {
    id: string;
    visitor_id: string;
    category: string;
    name: string;
    mobile: string;
    coming_from: string;
    whom_to_meet: string;
    photo_url: string;
    checkin_time: string;
    checkout_time: string | null;
    status: string;
}

const VMSAdminDashboard: React.FC<VMSAdminDashboardProps> = ({ propertyId }) => {
    const [visitors, setVisitors] = useState<VisitorLog[]>([]);
    const [stats, setStats] = useState({ total_today: 0, checked_in: 0, checked_out: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'checked_in' | 'checked_out'>('all');

    useEffect(() => {
        fetchVisitors();
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchVisitors, 30000);
        return () => clearInterval(interval);
    }, [propertyId, statusFilter]);

    const fetchVisitors = async () => {
        try {
            const params = new URLSearchParams({
                date: 'today',
                status: statusFilter,
            });
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`/api/vms/${propertyId}?${params}`);
            const data = await response.json();

            if (response.ok) {
                setVisitors(data.visitors || []);
                setStats(data.stats || { total_today: 0, checked_in: 0, checked_out: 0 });
            }
        } catch (err) {
            console.error('Error fetching visitors:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchVisitors();
    };

    const handleExport = async () => {
        // Generate CSV
        const headers = ['Visitor ID', 'Name', 'Category', 'Mobile', 'Coming From', 'Whom to Meet', 'Check-in', 'Check-out', 'Status'];
        const rows = visitors.map(v => [
            v.visitor_id,
            v.name,
            v.category,
            v.mobile || '-',
            v.coming_from || '-',
            v.whom_to_meet,
            new Date(v.checkin_time).toLocaleString(),
            v.checkout_time ? new Date(v.checkout_time).toLocaleString() : '-',
            v.status,
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `visitors_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'visitor': return <User className="w-4 h-4" />;
            case 'vendor': return <Truck className="w-4 h-4" />;
            default: return <Building2 className="w-4 h-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'visitor': return 'bg-blue-100 text-blue-600';
            case 'vendor': return 'bg-orange-100 text-orange-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Visitors</p>
                            <p className="text-3xl font-black text-slate-900">{stats.total_today}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                            <LogIn className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Currently In</p>
                            <p className="text-3xl font-black text-emerald-600">{stats.checked_in}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
                            <LogOut className="w-6 h-6 text-rose-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checked Out</p>
                            <p className="text-3xl font-black text-rose-600">{stats.checked_out}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Visitors Table */}
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Visitor Log</h3>
                        <p className="text-slate-500 text-xs font-medium mt-1">Real-time visitor tracking</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by Visitor ID or Name"
                                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-slate-400 focus:ring-0 w-64"
                            />
                        </form>

                        {/* Status Filter */}
                        <div className="flex border border-slate-200 rounded-xl overflow-hidden">
                            {(['all', 'checked_in', 'checked_out'] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    {status === 'all' ? 'All' : status === 'checked_in' ? 'In' : 'Out'}
                                </button>
                            ))}
                        </div>

                        {/* Export */}
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all"
                        >
                            <FileDown className="w-4 h-4" /> Export
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Visitor</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Whom to Meet</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time In</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {visitors.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                        No visitors found for today.
                                    </td>
                                </tr>
                            ) : (
                                visitors.map((visitor) => (
                                    <tr key={visitor.id} className="hover:bg-slate-50/50 transition-all">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {visitor.photo_url ? (
                                                    <img
                                                        src={visitor.photo_url}
                                                        alt={visitor.name}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-100"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                                        <User className="w-5 h-5 text-slate-400" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm">{visitor.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{visitor.visitor_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getCategoryColor(visitor.category)}`}>
                                                {getCategoryIcon(visitor.category)}
                                                {visitor.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{visitor.whom_to_meet}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {new Date(visitor.checkin_time).toLocaleTimeString('en-IN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {visitor.status === 'checked_in' ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                                                    <Clock className="w-3 h-3" /> In
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-wider border border-slate-200">
                                                    <CheckCircle2 className="w-3 h-3" /> Out
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VMSAdminDashboard;
