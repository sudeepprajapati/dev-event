'use client';

import { useEffect, useState, useMemo } from 'react';
import EventCard from '@/components/EventCard';
import { Search, SlidersHorizontal, X, DollarSign } from 'lucide-react';

interface IEvent {
    _id: string;
    title: string;
    image: string;
    slug: string;
    location: string;
    date: string;
    time: string;
    mode: string;
    price: number;
    tags: string[];
}

type SortOption = 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc';
type FilterMode = 'all' | 'online' | 'offline' | 'hybrid';

export default function EventsPage() {
    const [events, setEvents] = useState<IEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedMode, setSelectedMode] = useState<FilterMode>('all');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('date-asc');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/events');
            const data = await res.json();

            if (data.events) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAndSortedEvents = useMemo(() => {
        let filtered = [...events];

        if (debouncedSearch) {
            const searchLower = debouncedSearch.toLowerCase();
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(searchLower) ||
                event.location.toLowerCase().includes(searchLower) ||
                event.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }

        if (selectedMode !== 'all') {
            filtered = filtered.filter(event => event.mode === selectedMode);
        }

        if (minPrice || maxPrice) {
            const min = minPrice ? Number(minPrice) : 0;
            const max = maxPrice ? Number(maxPrice) : Infinity;
            filtered = filtered.filter(event => event.price >= min && event.price <= max);
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc':
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'date-desc':
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [events, debouncedSearch, selectedMode, minPrice, maxPrice, sortBy]);

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedMode('all');
        setMinPrice('');
        setMaxPrice('');
        setSortBy('date-asc');
    };

    const hasActiveFilters = debouncedSearch || selectedMode !== 'all' || minPrice || maxPrice || sortBy !== 'date-asc';

    return (
        <section>
            <div className="mb-8">
                <h1 className="text-6xl font-bold text-gradient mb-4">Explore Events</h1>
                <p className="text-gray-400 text-lg max-w-2xl">
                    Discover hackathons, meetups, and conferences that match your interests
                </p>
            </div>

            <div className="glass rounded-xl p-6 mb-8">
                <div className="flex flex-col lg:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search events by title, location, or tags..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-dark-200 border border-border-dark rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:border-primary transition-all"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-6 py-3 bg-dark-200 hover:bg-dark-300 border border-border-dark rounded-lg transition-all"
                    >
                        <SlidersHorizontal className="h-5 w-5" />
                        <span>Filters</span>
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-border-dark space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Event Mode</label>
                                <select
                                    value={selectedMode}
                                    onChange={(e) => setSelectedMode(e.target.value as FilterMode)}
                                    className="w-full px-4 py-3 bg-dark-200 border border-border-dark rounded-lg text-foreground focus:outline-none focus:border-primary transition-all"
                                >
                                    <option value="all">All Modes</option>
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                                    className="w-full px-4 py-3 bg-dark-200 border border-border-dark rounded-lg text-foreground focus:outline-none focus:border-primary transition-all"
                                >
                                    <option value="date-asc">Date: Earliest First</option>
                                    <option value="date-desc">Date: Latest First</option>
                                    <option value="price-asc">Price: Low to High</option>
                                    <option value="price-desc">Price: High to Low</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Price Range</label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={minPrice}
                                            onChange={(e) => setMinPrice(e.target.value)}
                                            className="w-full pl-8 pr-3 py-3 bg-dark-200 border border-border-dark rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                    <span className="text-gray-400">-</span>
                                    <div className="flex-1 relative">
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={maxPrice}
                                            onChange={(e) => setMaxPrice(e.target.value)}
                                            className="w-full pl-8 pr-3 py-3 bg-dark-200 border border-border-dark rounded-lg text-foreground placeholder-gray-500 focus:outline-none focus:border-primary transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-2 bg-red-900/20 hover:bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 transition-all text-sm"
                            >
                                <X className="h-4 w-4" />
                                Clear All Filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                        <p className="text-gray-400 mt-4">Loading events...</p>
                    </div>
                </div>
            ) : filteredAndSortedEvents.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-dark-200 flex items-center justify-center">
                            <Search className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2">No Events Found</h3>
                    <p className="text-gray-400 mb-4">
                        {hasActiveFilters
                            ? 'Try adjusting your filters or search query'
                            : 'No events are currently available'
                        }
                    </p>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-6 py-3 bg-primary hover:bg-primary/90 text-black font-semibold rounded-lg transition-all"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-gray-400">
                            Showing {filteredAndSortedEvents.length} {filteredAndSortedEvents.length === 1 ? 'event' : 'events'}
                        </p>
                    </div>

                    <div id="events" className="events">
                        {filteredAndSortedEvents.map((event) => (
                            <EventCard key={event._id} {...event} />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
