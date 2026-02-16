'use client';

import React from 'react';
import { Users, MapPin, Monitor, Maximize2, Trash2, Edit2, CheckCircle, XCircle, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

interface RoomCardProps {
    room: any;
    selectedDate?: string;
    onBook?: (room: any, slot: any) => void;
    isAdmin?: boolean;
    onEdit?: (room: any) => void;
    onDelete?: (id: string) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, selectedDate = new Date().toISOString().split('T')[0], onBook, isAdmin, onEdit, onDelete }) => {
    // Standard time slots for the design (9:00 AM to 6:00 PM)
    const slots = [
        { time: '09:00 AM', start: '09:00', end: '10:00', type: 'STANDARD' },
        { time: '10:15 AM', start: '10:15', end: '11:15', type: 'PREMIUM' },
        { time: '11:30 AM', start: '11:30', end: '12:30', type: 'STANDARD' },
        { time: '12:00 PM', start: '12:00', end: '13:00', type: 'PREMIUM' },
        { time: '01:00 PM', start: '13:00', end: '14:00', type: 'STANDARD' },
        { time: '03:00 PM', start: '15:00', end: '16:00', type: 'PREMIUM' },
        { time: '05:00 PM', start: '17:00', end: '18:00', type: 'STANDARD' },
        { time: '06:00 PM', start: '18:00', end: '19:00', type: 'PREMIUM' },
    ];

    const checkIsBooked = (slot: any) => {
        if (!room.bookings) return false;
        return room.bookings.some((b: any) => {
            const bStart = b.start_time;
            const bEnd = b.end_time;
            // Overlap logic: (StartA < EndB) and (EndA > StartB)
            return (slot.start < bEnd) && (slot.end > bStart);
        });
    };

    return (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all border-l-4 border-l-blue-500 relative flex flex-col h-full">
            <span className="absolute top-6 right-6 text-[10px] font-bold text-slate-300 uppercase tracking-widest">Available</span>

            <div className="flex gap-6 mb-6">
                {/* Room Photo */}
                <div className="w-24 h-24 rounded-2xl bg-slate-50 flex-shrink-0 overflow-hidden border border-slate-100">
                    {room.photo_url ? (
                        <img
                            src={room.photo_url}
                            alt={room.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                            <Monitor className="w-8 h-8" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-slate-800 truncate">{room.name}</h3>
                        {!isAdmin && (
                            <button className="p-1 hover:bg-slate-50 rounded-full transition-colors flex-shrink-0">
                                <Heart className="w-4 h-4 text-slate-300 hover:text-rose-500" />
                            </button>
                        )}
                    </div>
                    <p className="text-sm font-medium text-slate-400 truncate">
                        Capacity: {room.capacity} • {room.location}
                    </p>
                    <p className="text-sm font-bold text-emerald-500 mt-1">Cancellation available</p>
                </div>
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-x-2 text-xs font-bold text-slate-400 mb-6">
                {(room.amenities || []).map((amenity: string, i: number) => (
                    <React.Fragment key={amenity}>
                        {i > 0 && <span className="text-slate-200">•</span>}
                        <span>{amenity}</span>
                    </React.Fragment>
                ))}
            </div>

            <div className="mt-auto">
                {isAdmin ? (
                    /* Admin Actions */
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                        <button
                            onClick={() => onEdit?.(room)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit Room
                        </button>
                        <button
                            onClick={() => onDelete?.(room.id)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    </div>
                ) : (
                    /* Time Slots Grid (Tenant View) */
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {slots.map((slot, i) => {
                            const isPremium = slot.type === 'PREMIUM';
                            const isBooked = checkIsBooked(slot);

                            return (
                                <button
                                    key={i}
                                    disabled={isBooked}
                                    onClick={() => onBook?.(room, slot)}
                                    className={`p-3 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center gap-0.5 ${isBooked
                                        ? 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
                                        : isPremium
                                            ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-500 text-emerald-700'
                                            : 'bg-orange-50 border-orange-100 hover:border-orange-500 text-orange-700'
                                        }`}
                                >
                                    <span className={`text-[11px] font-black ${isBooked ? 'text-slate-400' : 'text-slate-800'}`}>
                                        {slot.time}
                                    </span>
                                    <span className={`text-[9px] font-black tracking-widest ${isBooked ? 'text-slate-300' : isPremium ? 'text-emerald-500' : 'text-orange-500'
                                        }`}>
                                        {slot.type}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomCard;
