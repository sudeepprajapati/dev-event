'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trash2, Users, Calendar, Search, ArrowLeft } from 'lucide-react';

interface User {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
    eventCount: number;
}

interface Stats {
    totalUsers: number;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            if (!res.ok) {
                router.replace('/auth/signin');
                return;
            }
            const data = await res.json();
            setUsers(data.users);
            setStats(data.stats);
        } catch {
            router.replace('/auth/signin');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (userId: string, userEmail: string) => {
        if (!confirm(`Are you sure you want to delete user "${userEmail}"? This will also delete all their events and bookings.`)) {
            return;
        }

        setDeletingId(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
            if (!res.ok) {
                alert('Failed to delete user');
                return;
            }
            await fetchUsers();
        } catch {
            alert('Error deleting user');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <main className="max-w-7xl mx-auto py-8 px-4">
                <div className="text-center">Loading...</div>
            </main>
        );
    }

    return (
        <main className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 text-gray-400 hover:text-foreground transition"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        Back to Admin
                    </Link>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Users className="h-8 w-8" />
                        Users Management
                    </h1>
                </div>

                {stats && (
                    <div className="glass rounded-lg px-6 py-3">
                        <p className="text-sm text-gray-400">Total Users</p>
                        <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                )}
            </div>

            <div className="glass rounded-lg p-4 mb-6 flex items-center gap-4">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-foreground"
                />
            </div>

            <div className="overflow-x-auto glass rounded-lg">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border-dark">
                            <th className="p-4 text-left">Name</th>
                            <th className="p-4 text-left">Email</th>
                            <th className="p-4 text-left">Events Created</th>
                            <th className="p-4 text-left">Joined Date</th>
                            <th className="p-4 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            filteredUsers.map((user) => (
                                <tr key={user._id} className="border-b border-border-dark">
                                    <td className="p-4 font-medium">{user.name}</td>
                                    <td className="p-4 text-gray-300">{user.email}</td>
                                    <td className="p-4">
                                        <span className="inline-flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {user.eventCount}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(user._id, user.email)}
                                            disabled={deletingId === user._id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            {deletingId === user._id ? 'Deleting...' : 'Delete'}
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {stats && filteredUsers.length > 0 && (
                <div className="mt-6 text-sm text-gray-400">
                    Showing {filteredUsers.length} of {stats.totalUsers} users
                </div>
            )}
        </main>
    );
}
