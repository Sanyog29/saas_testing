'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle2, XCircle, Search, Filter, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Booking {
    id: string;
    meeting_room_id: string;
    user_id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
    status: 'confirmed' | 'cancelled' | 'completed';
    created_at: string;
    meeting_room: {
        name: string;
        photo_url: string;
        location: string;
    };
    tenant: {
        full_name: string;
        email: string;
    };
}

interface AdminBookingListProps {
    propertyId: string;
}

const AdminBookingList: React.FC<AdminBookingListProps> = ({ propertyId }) => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');

    useEffect(() => {
        fetchBookings();
    }, [propertyId]);

    const fetchBookings = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/meeting-room-bookings?propertyId=${propertyId}`);
            const data = await res.json();
            if (res.ok) {
                setBookings(data.bookings || []);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredBookings = bookings.filter(booking => {
        const matchesSearch =
            booking.tenant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            booking.meeting_room.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        const matchesDate = !dateFilter || booking.booking_date === dateFilter;
        return matchesSearch && matchesStatus && matchesDate;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'cancelled': return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'completed': return 'bg-slate-50 text-slate-700 border-slate-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex-1 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by tenant or room..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold placeholder:text-slate-300 focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 transition-all cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex flex-col gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredBookings.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">No bookings found</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredBookings.map((booking) => (
                        <motion.div
                            key={booking.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                    <img src={booking.meeting_room.photo_url} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">{booking.meeting_room.name}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Calendar className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{booking.booking_date}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">{booking.start_time} - {booking.end_time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:items-end gap-2">
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-700">{booking.tenant.full_name}</span>
                                </div>
                                <span className={`self-start md:self-end px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(booking.status)}`}>
                                    {booking.status}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminBookingList;
