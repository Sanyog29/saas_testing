'use client';

import React from 'react';
import Image from 'next/image';
import { Pencil, Trash2 } from 'lucide-react';

/**
 * THE Standard Ticket Card Component
 * 
 * This is the ONLY ticket card component allowed in the application.
 * Any ticket appearing in a list MUST use this component.
 * 
 * Contract: See TICKET_CARD_CONTRACT.md
 */

export interface TicketCardProps {
    // Core Data
    id: string;
    title: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'OPEN';

    // Metadata
    ticketNumber: string;
    createdAt: string; // ISO date string

    // Optional
    assignedTo?: string; // Full name
    photoUrl?: string;

    // Actions
    onClick: () => void;
    onEdit?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
}

const PRIORITY_STYLES = {
    LOW: 'bg-blue-50 text-blue-700 border-blue-200',
    MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
} as const;

const STATUS_STYLES = {
    OPEN: 'bg-gray-100 text-gray-700',
    ASSIGNED: 'bg-blue-100 text-blue-700',
    IN_PROGRESS: 'bg-green-100 text-green-700',
    COMPLETED: 'bg-gray-100 text-gray-500',
} as const;

export default function TicketCard({
    id,
    title,
    priority,
    status,
    ticketNumber,
    createdAt,
    assignedTo,
    photoUrl,
    onClick,
    onEdit,
    onDelete,
}: TicketCardProps) {
    const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    return (
        <div
            onClick={onClick}
            className="
                @container w-full bg-white rounded-2xl border border-gray-200 
                p-[clamp(0.75rem,4cqw,1.25rem)] cursor-pointer transition-all hover:shadow-lg
                flex flex-col gap-[clamp(0.75rem,3cqw,1.25rem)]
            "
        >
            {/* Header: Title, Photo + Actions */}
            <div className="flex items-start justify-between gap-[clamp(0.5rem,3cqw,1.5rem)]">
                <div className="flex-1 flex items-start gap-[clamp(0.5rem,3cqw,1.25rem)] min-w-0">
                    {/* Photo Thumbnail */}
                    {photoUrl && (
                        <div className="shrink-0">
                            <Image
                                src={photoUrl}
                                alt="Site photo"
                                width={64}
                                height={64}
                                className="w-[clamp(3.5rem,14cqw,4.5rem)] h-[auto] aspect-square rounded-xl object-cover"
                            />
                        </div>
                    )}

                    {/* Title */}
                    <h3 className="flex-1 text-[clamp(0.9375rem,4.5cqw,1.125rem)] font-semibold text-gray-900 line-clamp-2 leading-snug min-w-0">
                        {title}
                    </h3>
                </div>

                {/* Actions Container: Grouped and Top-Right */}
                <div className="flex items-center gap-[clamp(0.125rem,1cqw,0.375rem)] shrink-0 bg-gray-50/80 p-1 rounded-xl border border-gray-100">
                    {onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(e);
                            }}
                            className="p-[clamp(0.375rem,1.5cqw,0.5rem)] text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                            title="Edit Request"
                        >
                            <Pencil className="w-[clamp(0.875rem,2.5cqw,1rem)] h-[clamp(0.875rem,2.5cqw,1rem)]" />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(e);
                            }}
                            className="p-[clamp(0.375rem,1.5cqw,0.5rem)] text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                            title="Delete Request"
                        >
                            <Trash2 className="w-[clamp(0.875rem,2.5cqw,1rem)] h-[clamp(0.875rem,2.5cqw,1rem)]" />
                        </button>
                    )}
                </div>
            </div>

            {/* Badges Flow */}
            <div className="flex flex-wrap items-center gap-[clamp(0.4rem,2cqw,0.75rem)]">
                <span
                    className={`
                        px-[clamp(0.5rem,2cqw,0.75rem)] py-[clamp(0.2rem,1cqw,0.25rem)] rounded-full 
                        text-[clamp(0.65rem,2.5cqw,0.75rem)] font-bold uppercase border
                        ${PRIORITY_STYLES[priority]}
                    `}
                >
                    {priority}
                </span>

                <span
                    className={`
                        px-[clamp(0.5rem,2cqw,0.75rem)] py-[clamp(0.2rem,1cqw,0.25rem)] rounded-full 
                        text-[clamp(0.65rem,2.5cqw,0.75rem)] font-medium uppercase
                        ${STATUS_STYLES[status]}
                    `}
                >
                    {status.replace('_', ' ')}
                </span>
            </div>

            {/* Assignee Information */}
            {assignedTo && (
                <div className="flex items-center gap-[clamp(0.4rem,1.5cqw,0.5rem)]">
                    <span className="text-[clamp(0.75rem,3cqw,0.875rem)] text-gray-600">Assigned to:</span>
                    <span className="text-[clamp(0.75rem,3cqw,0.875rem)] font-semibold text-gray-900">{assignedTo}</span>
                </div>
            )}

            {/* Footer Metadata + CTA */}
            <div className="flex flex-col @sm:flex-row @sm:items-center justify-between gap-[clamp(0.75rem,3cqw,1.25rem)] pt-[clamp(0.75rem,3cqw,1.25rem)] border-t border-gray-100">
                <div className="flex items-center gap-[clamp(0.5rem,2cqw,0.75rem)] text-[clamp(0.6rem,2cqw,0.75rem)] text-text-tertiary">
                    <span className="font-mono bg-gray-50 px-[0.4rem] py-[0.15rem] rounded text-gray-600">{ticketNumber}</span>
                    <span className="text-gray-200">•</span>
                    <span className="font-medium">{formattedDate}</span>
                </div>

                <button
                    className="
                        w-full @sm:w-auto px-[clamp(1rem,4cqw,1.5rem)] py-[clamp(0.4rem,2cqw,0.6rem)] 
                        bg-blue-600 text-white rounded-xl 
                        text-[clamp(0.75rem,3cqw,0.875rem)] font-bold hover:bg-blue-700 
                        transition-all active:scale-[0.98] shadow-sm shadow-blue-200
                    "
                    onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                    }}
                >
                    View Ticket
                </button>
            </div>
        </div>
    );
}
