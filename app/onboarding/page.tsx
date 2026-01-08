'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowRight, ArrowLeft, MapPin, Building2, UserCircle2,
    Sparkles, PartyPopper, Check, Loader2, AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/utils/supabase/client';

interface Organization {
    id: string;
    name: string;
    code: string;
}

interface Property {
    id: string;
    name: string;
    code: string;
}

const AVAILABLE_ROLES = [
    { id: 'property_admin', label: 'Property Admin', desc: 'Manage property operations & staff', icon: '🏢' },
    { id: 'staff', label: 'Staff Member', desc: 'Handle tickets & facility tasks', icon: '👷' },
    { id: 'tenant', label: 'Tenant / Resident', desc: 'Raise requests & view updates', icon: '🏠' },
];

// Fireworks particle component
const Particle = ({ delay }: { delay: number }) => {
    const colors = ['#f28c33', '#a855f7', '#ec4899', '#22c55e', '#3b82f6', '#eab308'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const angle = Math.random() * 360;
    const distance = 80 + Math.random() * 120;
    const x = Math.cos(angle * Math.PI / 180) * distance;
    const y = Math.sin(angle * Math.PI / 180) * distance;

    return (
        <motion.div
            className="absolute w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
            animate={{
                scale: [0, 1.5, 0],
                x: [0, x],
                y: [0, y],
                opacity: [1, 1, 0]
            }}
            transition={{
                duration: 1.2,
                delay: delay,
                ease: [0.32, 0, 0.67, 0]
            }}
        />
    );
};

const FireworksAnimation = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onComplete, 3000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="relative">
                {[0, 0.3, 0.6, 0.9, 1.2].map((delay, burstIdx) => (
                    <motion.div
                        key={burstIdx}
                        className="absolute"
                        style={{
                            left: `${(burstIdx - 2) * 80}px`,
                            top: `${Math.sin(burstIdx) * 50}px`
                        }}
                    >
                        {Array.from({ length: 20 }).map((_, i) => (
                            <Particle key={i} delay={delay + i * 0.02} />
                        ))}
                    </motion.div>
                ))}

                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                    className="text-center relative z-10"
                >
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                    >
                        <PartyPopper className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
                    </motion.div>
                    <h1 className="text-5xl font-black text-white mb-4">
                        Welcome Aboard! 🎉
                    </h1>
                    <p className="text-xl text-white/70 font-medium">
                        Your workspace is ready
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [userName, setUserName] = useState('');
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showFireworks, setShowFireworks] = useState(false);
    const [error, setError] = useState('');

    const router = useRouter();
    const { user } = useAuth();
    const supabase = createClient();

    useEffect(() => {
        const initialize = async () => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                const { data: userData } = await supabase
                    .from('users')
                    .select('full_name')
                    .eq('id', user.id)
                    .single();

                if (userData?.full_name) {
                    setUserName(userData.full_name.split(' ')[0]);
                } else if (user.user_metadata?.full_name) {
                    setUserName(user.user_metadata.full_name.split(' ')[0]);
                } else {
                    setUserName('there');
                }

                // Fetch all organizations - Select * to be safe against missing 'code' column
                const { data: orgs, error: orgsError } = await supabase
                    .from('organizations')
                    .select('*')
                    .order('name');

                if (orgsError) {
                    console.error('Fetch orgs error:', orgsError);
                    setOrganizations([]);
                } else {
                    // Map safely in case 'code' is 'slug' or missing
                    const mappedOrgs = (orgs || []).map((o: any) => ({
                        id: o.id,
                        name: o.name,
                        code: o.code || o.slug || 'unknown'
                    }));
                    setOrganizations(mappedOrgs);
                }
            } catch (err) {
                console.error('Initialization error:', err);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, [user, router, supabase]);

    // Handle default organization requirement
    useEffect(() => {
        if (organizations.length > 0 && !selectedOrg) {
            // Auto-select Autopilot Offices if it exists
            const autopilot = organizations.find(o => o.name.toLowerCase().includes('autopilot') || o.code === 'autopilot');
            if (autopilot) {
                setSelectedOrg(autopilot);
            } else if (organizations.length === 1) {
                setSelectedOrg(organizations[0]);
            }
        }
    }, [organizations, selectedOrg]);

    useEffect(() => {
        const fetchProperties = async () => {
            // Only fetch if we have a valid selectedOrg ID (not 'default')
            if (!selectedOrg || selectedOrg.id === 'default') {
                setProperties([]);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('properties')
                    .select('*')
                    .eq('organization_id', selectedOrg.id)
                    .order('name');

                if (error) throw error;

                const mappedProps = (data || []).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    code: p.code || p.slug || 'unknown'
                }));
                setProperties(mappedProps);
            } catch (err) {
                console.error('Properties fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProperties();
    }, [selectedOrg, supabase]);

    const handleComplete = useCallback(async () => {
        if (!user || !selectedOrg || !selectedProperty || !selectedRole) return;

        setSubmitting(true);
        setError('');

        try {
            // If we are using fallbacks/dummies, we might need real IDs or we skip real DB inserts
            // But let's try to find the REAL autopilot offices if it exists but failed to fetch earlier
            let finalOrgId = selectedOrg.id;
            let finalPropId = selectedProperty.id;

            if (finalOrgId === 'default') {
                // Attempt a last-ditch fetch for the real one
                const { data: realOrg } = await supabase.from('organizations').select('id').ilike('name', '%autopilot%').limit(1).maybeSingle();
                if (realOrg) finalOrgId = realOrg.id;
                else {
                    // If it REALLY doesn't exist, we can't create membership.
                    // However, user said assume everyone is from Autopilot Offices.
                    // We'll proceed with failure if IDs are still 'default'
                    if (finalOrgId === 'default') throw new Error("Autopilot Offices organization not found in database. Please run migrations.");
                }
            }

            if (finalPropId === 'default') {
                const { data: realProp } = await supabase.from('properties').select('id').eq('organization_id', finalOrgId).limit(1).maybeSingle();
                if (realProp) finalPropId = realProp.id;
                else throw new Error("No properties found for this organization in database.");
            }

            const { error: orgMemberError } = await supabase
                .from('organization_memberships')
                .upsert({
                    user_id: user.id,
                    organization_id: finalOrgId,
                    role: selectedRole as any,
                    is_active: true
                });

            if (orgMemberError) throw orgMemberError;

            const { error: propMemberError } = await supabase
                .from('property_memberships')
                .upsert({
                    user_id: user.id,
                    organization_id: finalOrgId,
                    property_id: finalPropId,
                    role: selectedRole as any,
                    is_active: true
                });

            if (propMemberError) throw propMemberError;

            setShowFireworks(true);
        } catch (err: any) {
            console.error('Onboarding completion error:', err);
            setError(err.message || 'Failed to complete setup. Please check database connectivity.');
            setSubmitting(false);
        }
    }, [user, selectedOrg, selectedProperty, selectedRole, supabase]);

    const handleFireworksComplete = () => {
        setShowFireworks(false);
        if (selectedOrg) {
            router.push(`/${selectedOrg.code}/dashboard`);
        }
    };

    const nextStep = () => {
        if (step === 3) {
            handleComplete();
        } else {
            setStep((prev) => prev + 1);
        }
    };

    const prevStep = () => setStep((prev) => Math.max(prev - 1, 0));

    const canProceed = () => {
        switch (step) {
            case 0: return true;
            case 1: return selectedOrg !== null;
            case 2: return selectedProperty !== null;
            case 3: return selectedRole !== null;
            default: return false;
        }
    };

    if (loading && step === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                    <p className="text-slate-400 font-medium">Loading your workspace...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {showFireworks && <FireworksAnimation onComplete={handleFireworksComplete} />}

            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 font-sans">
                <div className="w-full max-w-md mb-12">
                    <div className="flex gap-2">
                        {[0, 1, 2, 3].map((i) => (
                            <motion.div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-all duration-500`}
                                animate={{
                                    backgroundColor: step >= i ? '#a855f7' : '#27272a'
                                }}
                            />
                        ))}
                    </div>
                    <p className="text-center text-slate-500 text-sm font-medium mt-4">
                        Step {step + 1} of 4
                    </p>
                </div>

                <div className="w-full max-w-2xl relative overflow-hidden min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {step === 0 && (
                            <motion.div
                                key="welcome" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                                className="flex flex-col items-center text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                                    className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-8 shadow-2xl shadow-violet-500/30"
                                >
                                    <Sparkles className="w-10 h-10 text-white" />
                                </motion.div>
                                <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                                    Hello, <span className="text-violet-400">{userName}</span>!
                                </h1>
                                <p className="text-xl text-slate-400 font-medium mb-2">Welcome to Autopilot Offices</p>
                                <p className="text-slate-500 max-w-md">Let's get you set up in just a few quick steps. We'll help you choose your workspace.</p>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <motion.div
                                key="organization" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 shadow-xl">
                                    <MapPin className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-white mb-2 text-center">Choose Your Location</h2>
                                <p className="text-slate-400 font-medium mb-8 text-center">Select the organization you belong to</p>

                                <div className="w-full space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {organizations.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12 bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-3xl p-8">
                                            <AlertCircle className="w-10 h-10 text-slate-500 mb-4" />
                                            <p className="text-slate-400 font-medium text-center mb-2">No organizations found in database.</p>
                                            <button
                                                onClick={() => setSelectedOrg({ id: 'default', name: 'Autopilot Offices', code: 'autopilot' })}
                                                className="mt-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all"
                                            >
                                                Use Autopilot Offices (Default)
                                            </button>
                                        </div>
                                    ) : (
                                        organizations.map((org) => (
                                            <button
                                                key={org.id} onClick={() => setSelectedOrg(org)}
                                                className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${selectedOrg?.id === org.id
                                                        ? 'bg-violet-500/20 border-violet-500 text-white'
                                                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedOrg?.id === org.id ? 'bg-violet-500' : 'bg-slate-700 group-hover:bg-slate-600'}`}>
                                                        <Building2 className="w-6 h-6" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-lg">{org.name}</p>
                                                        <p className="text-sm text-slate-500">{org.code}</p>
                                                    </div>
                                                </div>
                                                {selectedOrg?.id === org.id && <Check className="w-6 h-6 text-violet-400" />}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="property" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 shadow-xl">
                                    <Building2 className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-white mb-2 text-center">Choose Your Property</h2>
                                <p className="text-slate-400 font-medium mb-8 text-center">Select the property you'll be managing</p>

                                {loading ? (
                                    <div className="flex items-center gap-3 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" />Loading properties...</div>
                                ) : (
                                    <div className="w-full space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                        {properties.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-12 bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-3xl p-8">
                                                <p className="text-slate-500 font-medium text-center">No properties found.</p>
                                                <button
                                                    onClick={() => setSelectedProperty({ id: 'default', name: 'Main Campus', code: 'main' })}
                                                    className="mt-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition-all"
                                                >
                                                    Use Main Campus (Default)
                                                </button>
                                            </div>
                                        ) : (
                                            properties.map((prop) => (
                                                <button
                                                    key={prop.id} onClick={() => setSelectedProperty(prop)}
                                                    className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${selectedProperty?.id === prop.id
                                                            ? 'bg-emerald-500/20 border-emerald-500 text-white'
                                                            : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${selectedProperty?.id === prop.id ? 'bg-emerald-500' : 'bg-slate-700 group-hover:bg-slate-600'}`}>🏢</div>
                                                        <div className="text-left">
                                                            <p className="font-bold text-lg">{prop.name}</p>
                                                            <p className="text-sm text-slate-500">{prop.code}</p>
                                                        </div>
                                                    </div>
                                                    {selectedProperty?.id === prop.id && <Check className="w-6 h-6 text-emerald-400" />}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="role" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center mb-6 shadow-xl">
                                    <UserCircle2 className="w-8 h-8 text-white" />
                                </div>
                                <h2 className="text-3xl font-black text-white mb-2 text-center">Choose Your Role</h2>
                                <p className="text-slate-400 font-medium mb-8 text-center">How will you be using Autopilot?</p>

                                <div className="w-full space-y-3">
                                    {AVAILABLE_ROLES.map((role) => (
                                        <button
                                            key={role.id} onClick={() => setSelectedRole(role.id)}
                                            className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${selectedRole === role.id
                                                    ? 'bg-orange-500/20 border-orange-500 text-white'
                                                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${selectedRole === role.id ? 'bg-orange-500' : 'bg-slate-700 group-hover:bg-slate-600'}`}>{role.icon}</div>
                                                <div className="text-left">
                                                    <p className="font-bold text-lg">{role.label}</p>
                                                    <p className="text-sm text-slate-500">{role.desc}</p>
                                                </div>
                                            </div>
                                            {selectedRole === role.id && <Check className="w-6 h-6 text-orange-400" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-500 text-sm font-bold max-w-md text-center">
                        {error}
                    </motion.div>
                )}

                <div className="mt-12 w-full max-w-md flex justify-between items-center">
                    <button
                        onClick={prevStep} disabled={step === 0}
                        className={`flex items-center gap-2 font-bold transition-all px-6 py-3 rounded-xl ${step === 0 ? 'opacity-0 pointer-events-none' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <ArrowLeft className="w-5 h-5" /> Back
                    </button>

                    <button
                        onClick={nextStep} disabled={!canProceed() || submitting}
                        className={`px-8 py-4 font-black rounded-2xl flex items-center gap-3 transition-all shadow-xl ${canProceed() && !submitting ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-violet-500/30 hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                    >
                        {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />Setting up...</> : step === 3 ? <>Complete Setup <Sparkles className="w-5 h-5" /></> : <>Continue <ArrowRight className="w-5 h-5" /></>}
                    </button>
                </div>
            </div>
        </>
    );
}
