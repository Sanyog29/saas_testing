'use client';

import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, Trash2, ChevronDown, Settings2, RotateCcw, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ElectricityMeter {
    id: string;
    name: string;
    meter_number?: string;
    meter_type?: string;
    max_load_kw?: number;
    status: string;
    last_reading?: number;
}

interface MeterMultiplier {
    id: string;
    multiplier_value: number;
    ct_ratio_primary: number;
    ct_ratio_secondary: number;
    pt_ratio_primary: number;
    pt_ratio_secondary: number;
    meter_constant: number;
    effective_from: string;
}

interface ElectricityReading {
    opening_reading: number;
    closing_reading: number;
    computed_units?: number;
    multiplier_id?: string;
    multiplier_value?: number;
    notes?: string;
}

interface ElectricityLoggerCardProps {
    meter: ElectricityMeter;
    previousClosing?: number;
    averageConsumption?: number;
    multipliers?: MeterMultiplier[];
    activeTariffRate?: number;
    onReadingChange: (meterId: string, reading: ElectricityReading) => void;
    onMultiplierSave?: (meterId: string, multiplierData: any) => Promise<void>;
    onDelete?: (meterId: string) => void;
    isSubmitting?: boolean;
    isDark?: boolean;
}

/**
 * Electricity Logger Card v2
 * PRD: User must explicitly select multiplier
 * PRD: Cost is computed, never entered
 * PRD: Cost shown before units
 * PRD: Peak load removed
 */
const ElectricityLoggerCard: React.FC<ElectricityLoggerCardProps> = ({
    meter,
    previousClosing,
    averageConsumption,
    multipliers = [],
    activeTariffRate = 0,
    onReadingChange,
    onMultiplierSave,
    onDelete,
    isSubmitting = false,
    isDark = false
}) => {
    const [openingReading, setOpeningReading] = useState<number>(previousClosing || meter.last_reading || 0);
    const [closingReading, setClosingReading] = useState<number>(0);
    const [notes, setNotes] = useState<string>('');
    const [isFocused, setIsFocused] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    // Multiplier state
    const [selectedMultiplierId, setSelectedMultiplierId] = useState<string | null>(null);
    const [selectedMultiplierValue, setSelectedMultiplierValue] = useState<number>(1);

    // Multiplier editor state (card back)
    const [editCtPrimary, setEditCtPrimary] = useState(200);
    const [editCtSecondary, setEditCtSecondary] = useState(5);
    const [editPtPrimary, setEditPtPrimary] = useState(11000);
    const [editPtSecondary, setEditPtSecondary] = useState(110);
    const [editMeterConstant, setEditMeterConstant] = useState(1);
    const [editEffectiveFrom, setEditEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
    const [editReason, setEditReason] = useState('');
    const [isSavingMultiplier, setIsSavingMultiplier] = useState(false);

    // Calculate consumption and cost
    const rawUnits = closingReading > openingReading ? closingReading - openingReading : 0;
    const finalUnits = rawUnits * selectedMultiplierValue;
    const computedCost = finalUnits * activeTariffRate;

    // Warning state: consumption > 25% vs average
    const isHighConsumption = averageConsumption && finalUnits > averageConsumption * 1.25;
    const hasValidReading = closingReading > openingReading;

    // Set default multiplier
    useEffect(() => {
        if (multipliers.length > 0 && !selectedMultiplierId) {
            const active = multipliers[0]; // First is most recent
            setSelectedMultiplierId(active.id);
            setSelectedMultiplierValue(active.multiplier_value || 1);

            // Pre-fill editor with active values
            setEditCtPrimary(active.ct_ratio_primary);
            setEditCtSecondary(active.ct_ratio_secondary);
            setEditPtPrimary(active.pt_ratio_primary);
            setEditPtSecondary(active.pt_ratio_secondary);
            setEditMeterConstant(active.meter_constant);
        }
    }, [multipliers, selectedMultiplierId]);

    // Status styling
    const getStatusColor = () => {
        if (meter.status === 'inactive') return isDark ? 'bg-[#21262d] text-slate-400' : 'bg-slate-200 text-slate-500';
        if (meter.status === 'faulty') return 'bg-rose-100 text-rose-600';
        return 'bg-primary/10 text-primary';
    };

    const getMeterTypeLabel = () => {
        switch (meter.meter_type) {
            case 'main': return 'Main Grid';
            case 'dg': return 'DG Backup';
            case 'solar': return 'Solar';
            case 'backup': return 'Backup';
            default: return meter.meter_type || 'Main';
        }
    };

    const getStripColor = () => {
        if (!hasValidReading) return isDark ? 'bg-[#21262d]' : 'bg-slate-200';
        if (isHighConsumption) return 'bg-primary';
        return isDark ? 'bg-primary' : 'bg-primary';
    };

    // Notify parent of changes
    useEffect(() => {
        if (hasValidReading) {
            onReadingChange(meter.id, {
                opening_reading: openingReading,
                closing_reading: closingReading,
                computed_units: rawUnits,
                multiplier_id: selectedMultiplierId || undefined,
                multiplier_value: selectedMultiplierValue,
                notes: notes || undefined,
            });
        }
    }, [openingReading, closingReading, notes, hasValidReading, selectedMultiplierId, selectedMultiplierValue]);

    // Set opening reading from previous closing
    useEffect(() => {
        if (previousClosing !== undefined) {
            setOpeningReading(previousClosing);
        } else if (meter.last_reading) {
            setOpeningReading(meter.last_reading);
        }
    }, [previousClosing, meter.last_reading]);

    // Handle multiplier selection
    const handleMultiplierChange = (multiplierId: string) => {
        const mult = multipliers.find(m => m.id === multiplierId);
        if (mult) {
            setSelectedMultiplierId(mult.id);
            setSelectedMultiplierValue(mult.multiplier_value || 1);
        }
    };

    // Compute preview multiplier value
    const previewMultiplier = () => {
        const ct = editCtPrimary / (editCtSecondary || 1);
        const pt = editPtPrimary / (editPtSecondary || 1);
        return ct * pt * editMeterConstant;
    };

    // Handle multiplier save
    const handleSaveMultiplier = async () => {
        if (!onMultiplierSave) return;

        setIsSavingMultiplier(true);
        try {
            await onMultiplierSave(meter.id, {
                meter_id: meter.id,
                ct_ratio_primary: editCtPrimary,
                ct_ratio_secondary: editCtSecondary,
                pt_ratio_primary: editPtPrimary,
                pt_ratio_secondary: editPtSecondary,
                meter_constant: editMeterConstant,
                effective_from: editEffectiveFrom,
                reason: editReason
            });
            setIsFlipped(false);
        } catch (error) {
            console.error('Failed to save multiplier:', error);
        } finally {
            setIsSavingMultiplier(false);
        }
    };

    // Card Front
    const CardFront = () => (
        <div className="p-5 md:p-6 flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 pl-2">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{meter.name}</h2>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusColor()}`}>
                            {meter.status}
                        </span>
                    </div>
                    <p className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        {getMeterTypeLabel()} · {meter.meter_number || 'No meter #'}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsFlipped(true)}
                            className={`${isDark ? 'text-slate-500 hover:text-primary bg-primary/5' : 'text-slate-400 hover:text-primary bg-primary/5'} p-2 rounded-lg transition-all border border-transparent hover:border-primary/20`}
                            title="Edit Multiplier"
                        >
                            <Settings2 className="w-4 h-4" />
                        </button>
                        {onDelete && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(meter.id);
                                }}
                                className={`${isDark ? 'text-slate-600 hover:text-rose-500 bg-rose-500/5' : 'text-slate-400 hover:text-rose-500 bg-rose-50'} p-2 rounded-lg transition-all border border-transparent hover:border-rose-500/20`}
                                title="Delete Meter"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {averageConsumption && (
                        <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            <TrendingUp className="w-3 h-3" />
                            <span>Avg: {averageConsumption} kVAh/day</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Multiplier Selector */}
            <div className="mb-4 pl-2">
                <label className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'} uppercase tracking-wide`}>
                            Meter Factor (Multiplier)
                        </span>
                        <span className={`text-xs font-mono ${isDark ? 'text-primary' : 'text-primary'}`}>
                            ×{selectedMultiplierValue.toFixed(2)}
                        </span>
                    </div>
                    <div className="relative">
                        <select
                            value={selectedMultiplierId || ''}
                            onChange={(e) => handleMultiplierChange(e.target.value)}
                            className={`w-full appearance-none ${isDark ? 'bg-[#0d1117] border-[#21262d] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} font-medium rounded-lg p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20 border cursor-pointer`}
                        >
                            {multipliers.length === 0 ? (
                                <option value="">No multiplier configured</option>
                            ) : (
                                multipliers.map((mult) => (
                                    <option key={mult.id} value={mult.id}>
                                        ×{mult.multiplier_value?.toFixed(2)} (from {mult.effective_from})
                                    </option>
                                ))
                            )}
                        </select>
                        <ChevronDown className={`absolute right-3 top-3 w-4 h-4 pointer-events-none ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    </div>
                </label>
            </div>

            {/* Input Grid */}
            <div className="flex-1 space-y-4 pl-2">
                {/* Opening Reading */}
                <label className="flex flex-col gap-1.5">
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'} uppercase tracking-wide`}>Opening Reading</span>
                    <div className="relative">
                        <input
                            type="number"
                            value={openingReading}
                            readOnly
                            className={`w-full ${isDark ? 'bg-[#0d1117] border-[#21262d] text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'} font-bold rounded-lg p-2.5 pl-3 focus:outline-none cursor-not-allowed border`}
                        />
                        <span className={`absolute right-3 top-2.5 ${isDark ? 'text-slate-600' : 'text-slate-400'} text-sm font-medium`}>kVAh</span>
                    </div>
                </label>

                {/* Closing Reading */}
                <label className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                        <span className={`text-xs font-bold uppercase tracking-wide ${isHighConsumption ? 'text-primary' : (isDark ? 'text-primary' : 'text-primary')}`}>
                            Closing Reading
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${hasValidReading ? 'bg-green-100 text-green-700' : (isDark ? 'bg-[#0d1117] text-primary' : 'bg-primary/10 text-primary')}`}>
                            {hasValidReading ? '✓ VALID' : 'REQUIRED'}
                        </span>
                    </div>
                    <div className="relative">
                        <input
                            type="number"
                            value={closingReading || ''}
                            onChange={(e) => setClosingReading(parseFloat(e.target.value) || 0)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className={`w-full ${isDark ? 'bg-[#0d1117] border-primary/50 focus:border-primary text-white' : 'bg-white border-primary/30 focus:border-primary text-slate-900'} border-2 focus:ring-4 ${isDark ? 'focus:ring-primary/10' : 'focus:ring-primary/10'} text-lg font-bold rounded-xl py-3 px-4 shadow-sm transition-all`}
                            placeholder={`>${openingReading}`}
                        />
                        <span className={`absolute right-4 top-4 ${isDark ? 'text-slate-600' : 'text-slate-400'} text-sm font-bold`}>kVAh</span>
                    </div>
                    {isFocused && (
                        <p className={`text-xs ${isDark ? 'text-primary' : 'text-primary'} animate-pulse font-medium`}>Typing...</p>
                    )}
                </label>

                {/* Cost + Units Result Box (PRD: Cost shown before units) */}
                <div className={`rounded-xl p-4 border ${hasValidReading
                    ? (isDark ? 'bg-primary/5 border-primary/20' : 'bg-primary/5 border-primary/20')
                    : (isDark ? 'bg-[#0d1117] border-[#21262d]' : 'bg-slate-50 border-slate-100')
                    }`}>
                    <div className="flex justify-between items-center">
                        {/* Cost First (PRD requirement) */}
                        <div className="flex flex-col">
                            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'} font-medium`}>Cost Incurred</span>
                            <div className="flex items-center gap-1">
                                <IndianRupee className={`w-5 h-5 ${hasValidReading ? (isDark ? 'text-primary' : 'text-primary') : 'text-slate-300'}`} />
                                <span className={`text-xl font-black ${hasValidReading ? (isDark ? 'text-primary' : 'text-primary') : 'text-slate-300'}`}>
                                    {hasValidReading ? computedCost.toFixed(2) : '—'}
                                </span>
                            </div>
                        </div>
                        <div className={`h-10 w-[1px] ${isDark ? 'bg-[#21262d]' : 'bg-slate-200'}`} />
                        {/* Units Second */}
                        <div className="flex flex-col items-end">
                            <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'} font-medium`}>Units Consumed</span>
                            <div className="flex items-center gap-1">
                                <Zap className={`w-4 h-4 ${hasValidReading ? (isDark ? 'text-primary' : 'text-primary') : 'text-slate-300'}`} />
                                <span className={`text-lg font-bold ${hasValidReading ? (isDark ? 'text-white' : 'text-slate-900') : 'text-slate-300'}`}>
                                    {hasValidReading ? `${finalUnits.toFixed(2)} kVAh` : '—'}
                                </span>
                            </div>
                            {hasValidReading && selectedMultiplierValue !== 1 && (
                                <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                                    (Raw: {rawUnits} × {selectedMultiplierValue})
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes (optional)..."
                    className={`w-full ${isDark ? 'bg-[#0d1117] border-[#21262d] text-white focus:border-primary/50' : 'bg-slate-50 border-slate-200 text-slate-600 focus:border-primary/50'} rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-primary/20' : 'focus:ring-primary/20'} border`}
                />
            </div>
        </div>
    );

    // Card Back (Multiplier Editor)
    const CardBack = () => (
        <div className="p-5 md:p-6 flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Meter Factor (Multiplier)</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{meter.name}</p>
                </div>
                <button
                    onClick={() => setIsFlipped(false)}
                    className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} p-2 rounded-lg transition-colors`}
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            {/* Multiplier Inputs */}
            <div className="flex-1 space-y-4">
                {/* CT Ratio */}
                <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'} uppercase`}>CT Primary</span>
                        <input
                            type="number"
                            value={editCtPrimary}
                            onChange={(e) => setEditCtPrimary(parseFloat(e.target.value) || 0)}
                            className={`w-full ${isDark ? 'bg-[#0d1117] border-[#21262d] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} font-bold rounded-lg p-2.5 border focus:outline-none focus:ring-2 focus:ring-primary/20`}
                            placeholder="200"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'} uppercase`}>CT Secondary</span>
                        <input
                            type="number"
                            value={editCtSecondary}
                            onChange={(e) => setEditCtSecondary(parseFloat(e.target.value) || 0)}
                            className={`w-full ${isDark ? 'bg-[#0d1117] border-[#21262d] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} font-bold rounded-lg p-2.5 border focus:outline-none focus:ring-2 focus:ring-primary/20`}
                            placeholder="5"
                        />
                    </label>
                </div>

                {/* PT Ratio */}
                <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'} uppercase`}>PT Primary (V)</span>
                        <input
                            type="number"
                            value={editPtPrimary}
                            onChange={(e) => setEditPtPrimary(parseFloat(e.target.value) || 0)}
                            className={`w-full ${isDark ? 'bg-[#0d1117] border-[#21262d] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} font-bold rounded-lg p-2.5 border focus:outline-none focus:ring-2 focus:ring-primary/20`}
                            placeholder="11000"
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'} uppercase`}>PT Secondary (V)</span>
                        <input
                            type="number"
                            value={editPtSecondary}
                            onChange={(e) => setEditPtSecondary(parseFloat(e.target.value) || 0)}
                            className={`w-full ${isDark ? 'bg-[#0d1117] border-[#21262d] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} font-bold rounded-lg p-2.5 border focus:outline-none focus:ring-2 focus:ring-primary/20`}
                            placeholder="110"
                        />
                    </label>
                </div>

                {/* Meter Constant */}
                <label className="flex flex-col gap-1">
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'} uppercase`}>Meter Constant</span>
                    <input
                        type="number"
                        step="0.01"
                        value={editMeterConstant}
                        onChange={(e) => setEditMeterConstant(parseFloat(e.target.value) || 1)}
                        className={`w-full ${isDark ? 'bg-[#0d1117] border-[#21262d] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} font-bold rounded-lg p-2.5 border focus:outline-none focus:ring-2 focus:ring-primary/20`}
                        placeholder="1.0"
                    />
                </label>

                {/* Effective From */}
                <label className="flex flex-col gap-1">
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'} uppercase`}>Effective From</span>
                    <input
                        type="date"
                        value={editEffectiveFrom}
                        onChange={(e) => setEditEffectiveFrom(e.target.value)}
                        className={`w-full ${isDark ? 'bg-[#0d1117] border-[#21262d] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} font-bold rounded-lg p-2.5 border focus:outline-none focus:ring-2 focus:ring-primary/20`}
                    />
                </label>

                {/* Reason */}
                <label className="flex flex-col gap-1">
                    <span className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-500'} uppercase`}>Reason (Optional)</span>
                    <input
                        type="text"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="e.g., CT replaced, recalibration..."
                        className={`w-full ${isDark ? 'bg-[#0d1117] border-[#21262d] text-white' : 'bg-slate-50 border-slate-200 text-slate-600'} rounded-lg p-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-primary/20`}
                    />
                </label>

                {/* Preview */}
                <div className={`rounded-lg p-3 ${isDark ? 'bg-primary/10 border-primary/20' : 'bg-primary/5 border-primary/20'} border`}>
                    <div className="flex justify-between items-center">
                        <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Computed Multiplier</span>
                        <span className={`text-lg font-black ${isDark ? 'text-primary' : 'text-primary'}`}>
                            ×{previewMultiplier().toFixed(2)}
                        </span>
                    </div>
                    <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        ({editCtPrimary}/{editCtSecondary}) × ({editPtPrimary}/{editPtSecondary}) × {editMeterConstant}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
                <button
                    onClick={() => setIsFlipped(false)}
                    className={`flex-1 py-2.5 px-4 ${isDark ? 'bg-[#21262d] text-slate-300 hover:bg-[#30363d]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'} font-bold rounded-lg transition-colors`}
                >
                    Cancel
                </button>
                <button
                    onClick={handleSaveMultiplier}
                    disabled={isSavingMultiplier}
                    className={`flex-1 py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50`}
                >
                    {isSavingMultiplier ? 'Saving...' : 'Save'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="relative" style={{ perspective: '1000px' }}>
            {/* Card Container with 3D flip */}
            <div
                className={`relative transition-transform duration-500 ${isDark ? 'bg-[#161b22]' : 'bg-white'}`}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* Status Strip */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${getStripColor()} transition-colors z-10 rounded-l-2xl`} />

                {/* Front Face */}
                <div
                    className={`${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'} rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border overflow-hidden ${meter.status === 'inactive' ? 'opacity-60 hover:opacity-100' : ''}`}
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                    }}
                >
                    <CardFront />
                </div>

                {/* Back Face */}
                <div
                    className={`${isDark ? 'bg-[#161b22] border-[#21262d]' : 'bg-white border-slate-200'} rounded-2xl shadow-sm border overflow-hidden absolute top-0 left-0 w-full h-full`}
                    style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    <CardBack />
                </div>
            </div>
        </div>
    );
};

export default ElectricityLoggerCard;
