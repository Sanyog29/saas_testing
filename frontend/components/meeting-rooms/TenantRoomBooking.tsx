'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Search, ChevronRight, CheckCircle2, AlertCircle, Loader2, ArrowLeft, Filter, RefreshCw, LayoutGrid, Bookmark, ChevronDown, Heart } from 'lucide-react';
import RoomCard from './RoomCard';
import { motion, AnimatePresence } from 'framer-motion';

interface TenantRoomBookingProps {
    propertyId: string;
    user: any;
}

const TenantRoomBooking: React.FC<TenantRoomBookingProps> = ({ propertyId, user }) => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activeCategory, setActiveCategory] = useState('Meeting Rooms');
    const [rooms, setRooms] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isRecurring, setIsRecurring] = useState(false);

    const [selectedCapacity, setSelectedCapacity] = useState<number>(0);

    // Generate next 14 days
    const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    const fetchRooms = async () => {
        setIsSearching(true);
        try {
            const dateStr = selectedDate.toISOString().split('T')[0];
            // Fetch all rooms for the property with capacity filter
            const res = await fetch(`/api/meeting-rooms/available?propertyId=${propertyId}&date=${dateStr}&capacity=${selectedCapacity}`);
            const data = await res.json();
            if (res.ok) {
                setRooms(data.rooms || []);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, [selectedDate, propertyId, selectedCapacity]);

    const handleBack = () => {
        window.history.back();
    };

    const handleBook = async (room: any, slot: any) => {
        const dateStr = selectedDate.toISOString().split('T')[0];
        if (!confirm(`Confirm booking for ${room.name} on ${dateStr} at ${slot.time}?`)) return;

        try {
            const res = await fetch('/api/meeting-room-bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    meetingRoomId: room.id,
                    propertyId,
                    date: dateStr,
                    startTime: slot.start,
                    endTime: slot.end
                })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Booking confirmed!');
                fetchRooms(); // Refresh availability
            } else {
                alert(data.error || 'Failed to create booking');
            }
        } catch (error) {
            alert('An error occurred during booking');
        }
    };

    return (
        <div className="min-h-screen bg-white xl:px-20 lg:px-12 md:px-6 px-4">
            {/* Header */}
            {/* ... header ... */}
            <header className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-6">
                    <button onClick={handleBack} className="p-2 -ml-2 hover:bg-slate-50 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 leading-tight">Meeting Rooms</h1>
                        <p className="text-sm text-slate-400 font-medium">Book your workspace</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <Search className="w-5 h-5 text-slate-400" />
                    </button>
                    <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                        <Filter className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </header>

            {/* Horizontal Date Picker */}
            <div className="px-6 py-4 border-b border-slate-50 overflow-x-auto no-scrollbar flex gap-4">
                {days.map((d, i) => {
                    const isSelected = d.toDateString() === selectedDate.toDateString();
                    return (
                        <button
                            key={i}
                            onClick={() => setSelectedDate(d)}
                            className={`flex flex-col items-center min-w-[70px] py-4 px-2 rounded-xl transition-all ${isSelected
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-200'
                                : 'text-slate-400 hover:bg-slate-50'
                                }`}
                        >
                            <span className="text-[10px] font-bold uppercase tracking-widest mb-1">
                                {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                            </span>
                            <span className="text-lg font-black leading-none mb-1">{d.getDate()}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                {d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Configuration Bar */}
            <div className="px-6 py-6 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-1 text-sm font-bold">
                    <span className="text-slate-800">Standard</span>
                    <span className="text-slate-300 mx-1">•</span>
                    <span className="text-slate-800">Meeting</span>
                    <button className="ml-2 text-blue-500 hover:underline">Change &gt;</button>
                </div>
            </div>

            {/* Filter Chips */}
            <div className="px-6 pb-6 flex flex-wrap items-center gap-3">
                {[
                    { label: 'Any Size', value: 0 },
                    { label: '2-4 People', value: 2 },
                    { label: '6-10 People', value: 6 },
                    { label: '12+ People', value: 12 }
                ].map((cap) => (
                    <button
                        key={cap.value}
                        onClick={() => setSelectedCapacity(cap.value)}
                        className={`px-5 py-2 border rounded-full text-sm font-bold transition-all ${selectedCapacity === cap.value
                            ? 'bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-100'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {cap.label}
                    </button>
                ))}
            </div>

            {/* Category Tabs */}
            <div className="px-6 border-b border-slate-100 flex gap-10">
                {['Meeting Rooms'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`py-4 text-sm font-bold transition-all relative ${activeCategory === cat
                            ? 'text-blue-500'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {activeCategory === cat && (
                            <motion.div layoutId="activeTabBadge" className="absolute top-1/2 -translate-y-1/2 -left-3 -right-3 h-[80%] bg-blue-500/10 rounded-xl -z-10" />
                        )}
                        <div className="flex items-center gap-2">
                            {cat === 'Meeting Rooms' && <Users className="w-4 h-4" />}
                            {cat === 'Hot Desks' && <LayoutGrid className="w-4 h-4" />}
                            {cat === 'Templates' && <Bookmark className="w-4 h-4" />}
                            {cat === 'Recurring' && <RefreshCw className="w-4 h-4" />}
                            {cat}
                        </div>
                        {activeCategory === cat && (
                            <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Results */}
            <div className="p-6">
                {isSearching ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Finding available rooms...</p>
                    </div>
                ) : rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-6 h-6 text-slate-200" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No rooms found</h3>
                        <p className="text-slate-400 text-sm max-w-xs">We couldn't find any rooms matching your current filters and date.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {rooms.map(room => (
                            <RoomCard
                                key={room.id}
                                room={room}
                                selectedDate={selectedDate.toISOString().split('T')[0]}
                                onBook={handleBook}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
export default TenantRoomBooking;
