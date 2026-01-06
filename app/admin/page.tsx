import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import Link from 'next/link';
import { LayoutDashboard, Users, Calendar, DollarSign, BookOpen, ChevronRight } from 'lucide-react';

export const metadata = {
    title: 'Admin Dashboard',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        redirect('/auth/signin');
    }

    if (session.user.email !== process.env.ADMIN_EMAIL) {
        redirect('/');
    }

    const adminSections = [
        {
            title: 'Bookings Management',
            description: 'View and manage all event bookings across the platform',
            href: '/admin/bookings',
            icon: <BookOpen className="h-8 w-8" />,
            color: 'text-primary',
        },
        {
            title: 'Users Management',
            description: 'View all users, their events, and manage accounts',
            href: '/admin/users',
            icon: <Users className="h-8 w-8" />,
            color: 'text-green-500',
        },
        {
            title: 'Events Management',
            description: 'View all events, track revenue, and manage content',
            href: '/admin/events',
            icon: <Calendar className="h-8 w-8" />,
            color: 'text-purple-500',
        },
    ];

    return (
        <section className="max-w-6xl w-full mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                    <LayoutDashboard className="h-10 w-10 text-primary" />
                    Admin Dashboard
                </h1>
                <p className="text-gray-400">
                    Welcome, {session.user?.email}. Manage the entire platform from here.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminSections.map((section) => (
                    <Link
                        key={section.href}
                        href={section.href}
                        className="glass rounded-xl p-6 hover:bg-dark-200 transition-all group"
                    >
                        <div className={`mb-4 ${section.color}`}>
                            {section.icon}
                        </div>
                        <h2 className="text-xl font-bold mb-2">{section.title}</h2>
                        <p className="text-sm text-gray-400 mb-4">{section.description}</p>
                        <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                            <span className="text-sm font-medium">Manage</span>
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-12 glass rounded-lg p-6 border-l-4 border-l-yellow-500">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-yellow-500" />
                    Important: Revenue Model
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed">
                    The revenue displayed in Events Management represents the total value of all paid event bookings.
                    Admin does not directly earn from event bookings. Event organizers receive the full
                    payment amount through Razorpay integration. If you need to implement
                    an admin commission system, you should add a commission rate field
                    in the Event model and calculate admin earnings during payment processing.
                </p>
            </div>
        </section>
    );
}
