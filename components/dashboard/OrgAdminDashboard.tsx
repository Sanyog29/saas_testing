'use client';

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Building2, Users, Ticket, Settings,
    Search, Plus, Filter, Bell, LogOut, ChevronRight, MapPin, Edit, Trash2, X, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';

// Types
type Tab = 'overview' | 'properties' | 'users' | 'tickets' | 'settings';

interface Property {
    id: string;
    name: string;
    code: string;
    address: string;
    image_url?: string;
    created_at: string;
}

interface OrgUser {
    user_id: string;
    role?: string; // Org role
    is_active: boolean;
    user: {
        id: string;
        email: string;
        full_name: string;
    };
    propertyMemberships: {
        property_id: string;
        property_name?: string;
        role: string;
    }[];
}

interface Organization {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
}

const OrgAdminDashboard = () => {
    const { user, signOut } = useAuth();
    const params = useParams();
    const router = useRouter();
    const orgSlugOrId = params?.orgId as string;

    // State
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [org, setOrg] = useState<Organization | null>(null);
    const [properties, setProperties] = useState<Property[]>([]);
    const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreatePropModal, setShowCreatePropModal] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState<OrgUser | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const supabase = createClient();

    useEffect(() => {
        if (orgSlugOrId) {
            fetchOrgDetails();
        }
    }, [orgSlugOrId]);

    useEffect(() => {
        if (org) {
            if (activeTab === 'properties') fetchProperties();
            if (activeTab === 'users') fetchOrgUsers();
        }
    }, [activeTab, org]);

    const fetchOrgDetails = async () => {
        setIsLoading(true);
        setErrorMsg('');
        const decoded = decodeURIComponent(orgSlugOrId);

        // Try slug first
        let { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('slug', decoded)
            .is('deleted_at', null)
            .maybeSingle();

        // Fallback to ID
        if (!data || error) {
            const { data: dataById, error: errorById } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', decoded)
                .maybeSingle();

            if (dataById) {
                data = dataById;
                error = null;
            }
        }

        if (error || !data) {
            setErrorMsg('Organization not found.');
        } else {
            setOrg(data);
        }
        setIsLoading(false);
    };

    const fetchProperties = async () => {
        if (!org) return;
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('organization_id', org.id)
            .order('created_at', { ascending: false });

        if (!error && data) setProperties(data);
    };

    const fetchOrgUsers = async () => {
        if (!org) return;

        // 🔹 Step 1: Fetch ORG-level users
        const { data: orgUsers, error: orgError } = await supabase
            .from('organization_memberships')
            .select(`
                user_id,
                role,
                is_active,
                user:users (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('organization_id', org.id)
            .eq('is_active', true);

        if (orgError) console.error('Error fetching org users:', orgError);

        // 🔹 Step 2: Fetch PROPERTY-level users for same org
        // 💡 !inner ensures only properties belonging to this org are included
        const { data: propertyUsers, error: propError } = await supabase
            .from('property_memberships')
            .select(`
                user_id,
                role,
                is_active,
                property:properties!inner (
                    id,
                    organization_id,
                    name
                ),
                user:users (
                    id,
                    full_name,
                    email
                )
            `)
            .eq('properties.organization_id', org.id)
            .eq('is_active', true);

        if (propError) console.error('Error fetching property users:', propError);

        // 🔹 Step 3: Merge + deduplicate users (CRITICAL)
        const userMap = new Map<string, OrgUser>();

        // Org users
        orgUsers?.forEach((row: any) => {
            userMap.set(row.user_id, {
                user_id: row.user_id,
                role: row.role,
                is_active: row.is_active,
                user: row.user,
                propertyMemberships: []
            });
        });

        // Property users
        propertyUsers?.forEach((row: any) => {
            const existing = userMap.get(row.user_id);

            if (existing) {
                existing.propertyMemberships.push({
                    property_id: row.property.id,
                    property_name: row.property.name,
                    role: row.role
                });
            } else {
                userMap.set(row.user_id, {
                    user_id: row.user_id,
                    role: undefined, // No org-level role
                    is_active: row.is_active,
                    user: row.user,
                    propertyMemberships: [{
                        property_id: row.property.id,
                        property_name: row.property.name,
                        role: row.role
                    }]
                });
            }
        });

        setOrgUsers(Array.from(userMap.values()));
    };

    const handleCreateProperty = async (propData: any) => {
        if (!org) return;
        const { error } = await supabase.from('properties').insert({
            ...propData,
            organization_id: org.id
        });
        if (!error) {
            fetchProperties();
            setShowCreatePropModal(false);
        } else {
            alert('Failed to create property: ' + error.message);
        }
    };

    const handleUpdateProperty = async (id: string, propData: any) => {
        const { error } = await supabase
            .from('properties')
            .update(propData)
            .eq('id', id);

        if (!error) {
            fetchProperties();
            setEditingProperty(null);
        } else {
            alert('Update failed: ' + error.message);
        }
    };

    const handleDeleteProperty = async (id: string) => {
        if (!confirm('Are you sure you want to delete this property? This cannot be undone.')) return;
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchProperties();
        } else {
            alert('Delete failed: ' + error.message);
        }
    };

    const handleUpdateUser = async (userId: string, data: any) => {
        // Update user profile
        const { error: profileError } = await supabase
            .from('users')
            .update({
                full_name: data.full_name,
                phone: data.phone
            })
            .eq('id', userId);

        if (profileError) {
            alert('Failed to update profile: ' + profileError.message);
            return;
        }

        // Update org role if exists
        if (data.orgRole) {
            await supabase
                .from('organization_memberships')
                .update({ role: data.orgRole })
                .eq('user_id', userId)
                .eq('organization_id', org?.id);
        }

        fetchOrgUsers();
        setEditingUser(null);
        setShowUserModal(false);
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Remove this user from the organization?')) return;

        // Remove from org memberships
        await supabase
            .from('organization_memberships')
            .delete()
            .eq('user_id', userId)
            .eq('organization_id', org?.id);

        // Remove from property memberships
        await supabase
            .from('property_memberships')
            .delete()
            .eq('user_id', userId)
            .eq('organization_id', org?.id);

        fetchOrgUsers();
    };

    const navItems: { id: Tab, label: string, icon: any }[] = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'properties', label: 'Properties', icon: Building2 },
        { id: 'users', label: 'User Directory', icon: Users },
        { id: 'tickets', label: 'Ticketing', icon: Ticket },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    if (!org && !isLoading) return (
        <div className="p-10 text-center">
            <h2 className="text-xl font-bold text-red-600">Error Loading Dashboard</h2>
            <p className="text-slate-600 mt-2">{errorMsg || 'Organization not found.'}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8F9FC] flex font-inter text-slate-900">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-slate-100 flex flex-col fixed h-full z-10 transition-all duration-300">
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-slate-200">
                            {org?.name?.substring(0, 1) || 'O'}
                        </div>
                        <div>
                            <h2 className="font-bold text-sm leading-tight text-slate-900 truncate max-w-[150px]">{org?.name || 'Organization'}</h2>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Super Admin Console</p>
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
                            {user?.email?.[0].toUpperCase() || 'O'}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-bold text-sm text-slate-900 truncate">
                                {user?.user_metadata?.full_name || 'Super Admin'}
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
                        <p className="text-slate-500 text-sm font-medium mt-1">Manage your organization's resources.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm font-black text-slate-900 tracking-tight">System Status</span>
                            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Online</span>
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
                        {activeTab === 'overview' && <OverviewTab propertiesCount={properties.length} usersCount={orgUsers.length} />}
                        {activeTab === 'properties' && (
                            <PropertiesTab
                                properties={properties}
                                onCreate={() => setShowCreatePropModal(true)}
                                onEdit={(p: any) => setEditingProperty(p)}
                                onDelete={handleDeleteProperty}
                            />
                        )}
                        {activeTab === 'users' && (
                            <UsersTab
                                users={orgUsers}
                                orgId={org?.id}
                                allProperties={properties} // Pass all properties
                                onEdit={(u: any) => { setEditingUser(u); setShowUserModal(true); }}
                                onDelete={handleDeleteUser}
                            />
                        )}
                        {activeTab === 'tickets' && <div className="text-slate-400 font-bold italic">Ticketing Module Loading...</div>}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Modals */}
            {(showCreatePropModal || editingProperty) && (
                <PropertyModal
                    property={editingProperty}
                    onClose={() => { setShowCreatePropModal(false); setEditingProperty(null); }}
                    onSave={editingProperty ? (data: any) => handleUpdateProperty(editingProperty.id, data) : handleCreateProperty}
                />
            )}

            {showUserModal && (
                <UserModal
                    user={editingUser}
                    onClose={() => { setShowUserModal(false); setEditingUser(null); }}
                    onSave={(data: any) => editingUser && handleUpdateUser(editingUser.user_id, data)}
                />
            )}
        </div>
    );
};

// Sub-components
const OverviewTab = ({ propertiesCount, usersCount }: { propertiesCount: number, usersCount: number }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Total Properties</h3>
            <p className="text-4xl font-black text-slate-900">{propertiesCount}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Total Users</h3>
            <p className="text-4xl font-black text-slate-900">{usersCount}</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Open Tickets</h3>
            <p className="text-4xl font-black text-emerald-600">5</p>
        </div>
    </div>
);

const PropertiesTab = ({ properties, onCreate, onEdit, onDelete }: any) => (
    <div className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search properties..."
                    className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-100 w-64"
                />
            </div>
            <button
                onClick={onCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
            >
                <Plus className="w-4 h-4" /> Add Property
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop: any) => (
                <div key={prop.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                            <Building2 className="w-6 h-6" />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(prop)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                                <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => onDelete(prop.id)} className="p-2 bg-slate-50 text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight mb-1">{prop.name}</h3>
                    <div className="flex items-center gap-1 text-slate-400 text-xs font-medium mb-6">
                        <MapPin className="w-3 h-3" />
                        {prop.address || 'No address provided'}
                    </div>
                    <button className="w-full py-3 border border-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all">
                        Manage Property
                    </button>
                </div>
            ))}
        </div>
    </div>
);

const UsersTab = ({ users, orgId, allProperties, onEdit, onDelete }: any) => (
    <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-900">User Directory</h3>
            <div className="flex gap-2">
                <button className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:text-slate-900 transition-colors">
                    <Filter className="w-4 h-4" />
                </button>
            </div>
        </div>
        <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Role</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Properties</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {users.map((u: any) => (
                    <tr key={`${u.user_id}-${orgId}`} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xs">
                                    {u.user?.full_name?.substring(0, 1) || 'U'}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">{u.user?.full_name || 'Unknown'}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">{u.user?.email}</p>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            {u.role ? (
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${u.role === 'org_super_admin' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white'
                                    }`}>
                                    {u.role?.replace(/_/g, ' ')}
                                </span>
                            ) : u.propertyMemberships?.[0] ? (
                                <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide bg-indigo-50 text-indigo-600 border border-indigo-100">
                                    {u.propertyMemberships[0].role?.replace(/_/g, ' ')}
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold text-slate-400 italic uppercase tracking-wider">
                                    No Assignment
                                </span>
                            )}
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                                {u.role === 'org_super_admin' ? (
                                    // Super Admins see all properties
                                    allProperties.map((p: any) => (
                                        <div key={p.id} className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-[9px] font-black border border-emerald-100 flex items-center gap-1">
                                            <Building2 className="w-3 h-3" />
                                            {p.name}
                                            <span className="opacity-50 text-[8px] tracking-tighter ml-1 font-bold">ALL ACCESS</span>
                                        </div>
                                    ))
                                ) : (
                                    // Others see assigned properties with their specific roles
                                    u.propertyMemberships?.map((pm: any) => (
                                        <div key={pm.property_id} className="bg-slate-50 text-slate-600 px-2 py-1 rounded-md text-[9px] font-black border border-slate-100 flex items-center gap-1 group/chip hover:bg-white transition-colors">
                                            <Building2 className="w-3 h-3 text-slate-400" />
                                            {pm.property_name}
                                            <span className="bg-slate-200 text-slate-500 px-1 py-0.5 rounded text-[8px] ml-1 uppercase letter-spacing-tight">
                                                {pm.role?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    ))
                                )}
                                {u.role !== 'org_super_admin' && (!u.propertyMemberships || u.propertyMemberships.length === 0) && (
                                    <span className="text-slate-300 text-[10px] italic">No directly assigned properties</span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <button onClick={() => onEdit(u)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDelete(u.user_id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const PropertyModal = ({ property, onClose, onSave }: any) => {
    const [name, setName] = useState(property?.name || '');
    const [code, setCode] = useState(property?.code || '');
    const [address, setAddress] = useState(property?.address || '');

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden"
            >
                <button onClick={onClose} className="absolute right-6 top-6 text-slate-300 hover:text-slate-900 transition-colors">
                    <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight">
                            {property ? 'Edit Property' : 'Add Property'}
                        </h3>
                        <p className="text-slate-400 text-sm font-medium">Define your physical asset details.</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Property Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" placeholder="e.g. Skyline Towers" />
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Property Code</label>
                        <input type="text" value={code} onChange={e => setCode(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" placeholder="e.g. SKY-01" />
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Address</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all" placeholder="123 Main St, City" />
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors uppercase text-xs tracking-widest">Cancel</button>
                        <button onClick={() => onSave({ name, code, address })} className="flex-1 py-4 font-black text-white bg-slate-900 rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                            <Check className="w-4 h-4" /> {property ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

const UserModal = ({ user, onClose, onSave }: any) => {
    const [fullName, setFullName] = useState(user?.user?.full_name || '');
    const [phone, setPhone] = useState(user?.user?.phone || '');
    const [orgRole, setOrgRole] = useState(user?.role || 'org_admin');

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute right-6 top-6 text-slate-300 hover:text-slate-900 transition-colors">
                    <X className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 leading-tight">Edit User</h3>
                        <p className="text-slate-400 text-sm font-medium">{user?.user?.email}</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Full Name</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Phone Number</label>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Organization Role</label>
                        <select value={orgRole} onChange={e => setOrgRole(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 appearance-none">
                            <option value="org_super_admin">Super Admin</option>
                            <option value="org_admin">Admin</option>
                        </select>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors uppercase text-xs tracking-widest">Cancel</button>
                        <button onClick={() => onSave({ full_name: fullName, phone, orgRole })} className="flex-1 py-4 font-black text-white bg-slate-900 rounded-2xl hover:bg-slate-800 transition-colors uppercase text-xs tracking-widest">
                            Save Changes
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default OrgAdminDashboard;
