'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { X, Scan, QrCode } from 'lucide-react';
import dynamic from 'next/dynamic';
import { createClient } from '@/frontend/utils/supabase/client';
import { Toast } from '@/frontend/components/ui/Toast';
import Barcode, { downloadBarcode } from './Barcode';

const BarcodeScannerModal = dynamic(
    () => import('./BarcodeScannerModal'),
    { ssr: false, loading: () => <div>Loading scanner...</div> }
);

interface StockItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    item?: any;
    onSuccess?: () => void;
    propertyCode?: string;
}

const StockItemFormModal: React.FC<StockItemFormModalProps> = ({ isOpen, onClose, propertyId, item, onSuccess, propertyCode }) => {
    const [formData, setFormData] = useState({
        name: '',
        item_code: '',
        category: '',
        unit: 'units',
        quantity: 0,
        min_threshold: 10,
        location: '',
        description: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showScanModal, setShowScanModal] = useState(false);
    const supabase = React.useMemo(() => createClient(), []);

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                item_code: item.item_code || '',
                category: item.category || '',
                unit: item.unit || 'units',
                quantity: item.quantity || 0,
                min_threshold: item.min_threshold || 10,
                location: item.location || '',
                description: item.description || '',
            });
        } else {
            setFormData({
                name: '',
                item_code: propertyCode ? `${propertyCode.toUpperCase()}-` : '',
                category: '',
                unit: 'units',
                quantity: 0,
                min_threshold: 10,
                location: '',
                description: '',
            });
        }
    }, [item, isOpen, propertyCode]);

    const generateCode = () => {
        const prefix = propertyCode ? propertyCode.toUpperCase() : 'INV';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const newCode = `${prefix}-${timestamp}${random}`;
        setFormData({ ...formData, item_code: newCode });

        // Trigger download
        downloadBarcode(newCode);
    };

    const handleScanSuccess = (barcode: string) => {
        setFormData({ ...formData, item_code: barcode });
        setShowScanModal(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            setToast({ message: 'Name is required', type: 'error' });
            return;
        }

        setIsLoading(true);

        try {
            if (item) {
                // Update
                const { error } = await supabase
                    .from('stock_items')
                    .update({
                        name: formData.name,
                        category: formData.category,
                        unit: formData.unit,
                        min_threshold: formData.min_threshold,
                        location: formData.location,
                        description: formData.description,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', item.id);

                if (error) throw error;
            } else {
                // Create
                const response = await fetch(`/api/properties/${propertyId}/stock/items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        quantity: parseInt(formData.quantity as any),
                        min_threshold: parseInt(formData.min_threshold as any),
                    }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Failed to create item');
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            setToast({ message: err instanceof Error ? err.message : 'Error saving item', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div
                    className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                {item ? 'Edit Stock Item' : 'Add New Item'}
                            </h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                {item ? 'Update inventory details' : 'Register a new product & QR'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-gray-200"
                        >
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        <form id="stock-item-form" onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Item Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-gray-900 placeholder-gray-400 transition-all font-medium"
                                    placeholder="e.g. Premium Cleaning Liquid"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Item Code</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.item_code}
                                            onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                                            placeholder="SCN-12345"
                                            disabled={!!item}
                                            className="min-w-0 flex-1 px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-gray-900 placeholder-gray-400 disabled:opacity-50 transition-all font-medium"
                                        />
                                        {!item && (
                                            <button
                                                type="button"
                                                onClick={() => setShowScanModal(true)}
                                                className="w-12 h-12 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center shadow-lg shadow-blue-500/20 active:scale-95 flex-shrink-0"
                                                title="Scan barcode"
                                            >
                                                <Scan size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Unit</label>
                                    <input
                                        type="text"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        placeholder="units, kg, lit"
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-gray-900 transition-all font-medium placeholder-gray-400"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g. Supplies"
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-gray-900 placeholder-gray-400 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Min Threshold</label>
                                    <input
                                        type="number"
                                        value={formData.min_threshold}
                                        onChange={(e) => setFormData({ ...formData, min_threshold: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-gray-900 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            {!item && (
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Initial Quantity</label>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                        min="0"
                                        className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-gray-900 transition-all font-medium"
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. Warehouse A, Shelf 4"
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-gray-900 placeholder-gray-400 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider ml-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    placeholder="Provide additional details about this item..."
                                    className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white text-gray-900 placeholder-gray-400 resize-none transition-all font-medium"
                                />
                            </div>

                            {/* QR Visualization & Actions */}
                            {formData.item_code ? (
                                <div className="p-5 bg-gray-50 border border-gray-100 rounded-3xl flex flex-col items-center gap-4">
                                    <div className="w-full flex justify-between items-center px-1">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Primary Item Label</span>
                                            <span className="text-[9px] text-indigo-600 font-bold mt-1 uppercase">Ready for Scanning</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => downloadBarcode(formData.item_code)}
                                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100 transition-all active:scale-95"
                                        >
                                            Download QR
                                        </button>
                                    </div>
                                    <Barcode
                                        value={formData.item_code}
                                        className="shadow-xl border-4 border-white rounded-[2rem]"
                                        size={180}
                                    />
                                    <p className="text-[11px] font-mono text-gray-500 bg-white px-4 py-1.5 rounded-full border border-gray-100">{formData.item_code}</p>
                                </div>
                            ) : (
                                !item && (
                                    <button
                                        type="button"
                                        onClick={generateCode}
                                        className="w-full p-6 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center gap-3 hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                                    >
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <QrCode size={24} className="text-gray-400 group-hover:text-blue-500" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-extrabold text-gray-800 text-sm">Generate QR Identifier</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">Secure Item ID & Auto-Download</p>
                                        </div>
                                    </button>
                                )
                            )}
                        </form>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all text-gray-600 font-bold text-sm"
                        >
                            Discard
                        </button>
                        <button
                            form="stock-item-form"
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all font-black text-sm disabled:opacity-50 shadow-lg shadow-blue-500/25 active:scale-[0.98]"
                        >
                            {isLoading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
                        </button>
                    </div>

                    <style jsx global>{`
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 6px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #E5E7EB;
                            border-radius: 10px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #D1D5DB;
                        }
                    `}</style>
                </div>
            </div>

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    visible={true}
                    onClose={() => setToast(null)}
                    duration={3000}
                />
            )}

            <Suspense fallback={null}>
                <BarcodeScannerModal
                    isOpen={showScanModal}
                    onClose={() => setShowScanModal(false)}
                    onScanSuccess={handleScanSuccess}
                    title="Scan Item Code"
                />
            </Suspense>
        </>
    );
};

export default StockItemFormModal;
