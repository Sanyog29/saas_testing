'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    AlertCircle, MessageSquare, User, Building2, Clock, CheckCircle2,
    XCircle, RefreshCw, Filter, Send, ChevronRight, Camera, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ticket {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    resolved_at: string | null;
    organization: { id: string; name: string; code: string };
    property: { id: string; name: string; code: string } | null;
    creator: { id: string; full_name: string; email: string };
    assignee: { id: string; full_name: string; email: string } | null;
    ticket_comments: { count: number }[];
    photo_before_url?: string;
    photo_after_url?: string;
}

interface Comment {
    id: string;
    comment: string;
    is_internal: boolean;
    created_at: string;
    user: { id: string; full_name: string; email: string };
}

interface TicketsViewProps {
    propertyId?: string;
    canDelete?: boolean;
    onNewRequest?: () => void;
}

const TicketsView: React.FC<TicketsViewProps> = ({ propertyId, canDelete, onNewRequest }) => {
    const router = useRouter();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchTickets();
    }, [statusFilter]);

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            let url = statusFilter === 'all'
                ? '/api/tickets'
                : `/api/tickets?status=${statusFilter}`;

            if (propertyId) {
                const sep = url.includes('?') ? '&' : '?';
                url += `${sep}propertyId=${propertyId}`;
            }

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setTickets(data.tickets || []);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            setTickets([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                fetchTickets();
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
        }
    };

    const handleDelete = async (e: React.MouseEvent, ticketId: string) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this ticket?')) return;

        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchTickets();
            }
        } catch (error) {
            console.error('Error deleting ticket:', error);
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'critical': return 'text-error bg-error/10 border-error/20';
            case 'high': return 'text-warning bg-warning/10 border-warning/20';
            case 'medium': return 'text-secondary bg-secondary/10 border-secondary/20';
            case 'low': return 'text-text-tertiary bg-surface-elevated border-border';
            default: return 'text-text-tertiary bg-surface-elevated border-border';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved':
            case 'closed':
                return 'text-success bg-success/10 border-success/20';
            case 'in_progress': return 'text-info bg-info/10 border-info/20';
            case 'open': return 'text-error bg-error/10 border-error/20';
            default: return 'text-text-tertiary bg-surface-elevated border-border';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Filters */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-display font-bold text-text-primary">Support Tickets</h3>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-text-tertiary" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-9 px-3 bg-surface border border-border rounded-[var(--radius-md)] text-xs font-semibold font-body text-text-primary transition-smooth focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary hover:border-primary/50"
                        >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {onNewRequest && (
                        <button
                            onClick={onNewRequest}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-text-inverse text-xs font-bold rounded-[var(--radius-md)] hover:opacity-90 transition-smooth shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-4 h-4" /> New Request
                        </button>
                    )}
                    <button
                        onClick={fetchTickets}
                        className="p-2 hover:bg-surface-elevated rounded-[var(--radius-md)] transition-smooth"
                    >
                        <RefreshCw className="w-4 h-4 text-text-secondary" />
                    </button>
                </div>
            </div>

            {/* Tickets List */}
            <div className="glass-card overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-text-tertiary font-body">Loading tickets...</div>
                ) : tickets.length === 0 ? (
                    <div className="p-12 text-center text-text-tertiary font-body">No tickets found</div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {tickets.map((ticket) => (
                            <motion.div
                                key={ticket.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2 }}
                                className="p-6 hover:bg-surface-elevated/30 transition-smooth cursor-pointer"
                                onClick={() => router.push(`/tickets/${ticket.id}`)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h4 className="font-display font-semibold text-text-primary">{ticket.title}</h4>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-[var(--radius-sm)] border font-body ${getPriorityColor(ticket.priority)}`}>
                                                {ticket.priority}
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-[var(--radius-sm)] border font-body ${getStatusColor(ticket.status)}`}>
                                                {ticket.status === 'closed' || ticket.status === 'resolved' ? 'COMPLETE' : ticket.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="flex gap-4 mt-3">
                                            {ticket.photo_before_url && (
                                                <div className="shrink-0 relative group/thumb">
                                                    <img src={ticket.photo_before_url} alt="Site" className="w-16 h-16 rounded-lg object-cover border border-border/10" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 rounded-lg transition-smooth">
                                                        <Camera className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-text-secondary font-body mb-3 line-clamp-2">{ticket.description}</p>
                                                <div className="flex items-center gap-4 text-xs text-text-tertiary font-body">
                                                    <div className="flex items-center gap-1">
                                                        <Building2 className="w-3 h-3" />
                                                        {ticket.organization?.name || 'N/A'}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {ticket.creator?.full_name || 'System'}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                    {ticket.photo_before_url && (
                                                        <div className="flex items-center gap-1 text-primary font-bold ml-auto px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10">
                                                            <Camera className="w-3 h-3" />
                                                            SITE PHOTO
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {ticket.status === 'open' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateStatus(ticket.id, 'in_progress');
                                                }}
                                                className="px-3 py-1.5 bg-info text-text-inverse text-xs font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-smooth border border-info"
                                            >
                                                Start
                                            </button>
                                        )}
                                        {ticket.status === 'in_progress' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleUpdateStatus(ticket.id, 'resolved');
                                                }}
                                                className="px-3 py-1.5 bg-success text-text-inverse text-xs font-semibold rounded-[var(--radius-md)] hover:opacity-90 transition-smooth border border-success"
                                            >
                                                Resolve
                                            </button>
                                        )}
                                        <div className="flex flex-col gap-2 items-end">
                                            {canDelete && (
                                                <button
                                                    onClick={(e) => handleDelete(e, ticket.id)}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-smooth"
                                                    title="Delete Ticket"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <ChevronRight className="w-5 h-5 text-text-tertiary" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
};

export default TicketsView;
