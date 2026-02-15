"use client";

import React, { useState } from "react";
import { ShieldAlert, Trash2, Users, Activity, School, Eye } from "lucide-react";
import { SUPPORTED_SCHOOLS } from "@/lib/constants/schools";

// Mock Data for Admin
const MOCK_STATS = {
    totalUsers: 12543,
    activeToday: 842,
    flaggedPosts: 5,
    schools: [
        { name: "UNILAG", count: 4200 },
        { name: "OAU", count: 3150 },
        { name: "YABATECH", count: 1200 },
        { name: "UNIBEN", count: 980 },
    ]
};

const MOCK_RECENT_POSTS = [
    { id: 1, title: "iPhone 12 Pro Max", price: "350,000", user: "Emeka (UNILAG)", image: "iphone.jpg" },
    { id: 2, title: "Mattress Full Size", price: "25,000", user: "Sarah (OAU)", image: "mattress.jpg" },
    { id: 3, title: "Chemistry Textbook", price: "5,000", user: "Tunde (YABATECH)", image: "book.jpg" },
    { id: 4, title: "[SPAM] Make Money Fast", price: "0", user: "Unknown", image: "spam.jpg", flagged: true },
];

export default function GodModePage() {
    const [posts, setPosts] = useState(MOCK_RECENT_POSTS);

    const handleDelete = (id: number) => {
        if (confirm("NUKE this post? This cannot be undone.")) {
            setPosts(posts.filter(p => p.id !== id));
            // In real app: call API to delete listing
        }
    };

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono p-6">
            <header className="flex justify-between items-center mb-8 border-b border-green-800 pb-4">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
                    <h1 className="text-3xl font-black tracking-widest text-white">GOD_MODE</h1>
                </div>
                <div className="flex gap-4 text-xs font-bold bg-green-900/20 p-2 rounded">
                    <span>STATUS: ACTIVE</span>
                    <span>ADMIN: SUPERUSER</span>
                </div>
            </header>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-900 border border-green-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <Users className="w-4 h-4" />
                        <span className="text-xs uppercase">Total Users</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{MOCK_STATS.totalUsers.toLocaleString()}</p>
                </div>
                <div className="bg-gray-900 border border-green-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs uppercase">Active Today</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{MOCK_STATS.activeToday}</p>
                </div>
                <div className="bg-gray-900 border border-green-800 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <School className="w-4 h-4" />
                        <span className="text-xs uppercase">Top School</span>
                    </div>
                    <p className="text-xl font-bold text-white">UNILAG</p>
                </div>
                <div className="bg-gray-900 border border-red-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2 text-red-400">
                        <ShieldAlert className="w-4 h-4" />
                        <span className="text-xs uppercase">Flagged Content</span>
                    </div>
                    <p className="text-2xl font-bold text-red-500">{MOCK_STATS.flaggedPosts}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* School Stats */}
                <div className="lg:col-span-1 bg-gray-900 border border-green-800 rounded-xl p-6 h-fit">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <School className="w-5 h-5" /> SCHOOL DATA
                    </h2>
                    <div className="space-y-4">
                        {MOCK_STATS.schools.map((school, i) => (
                            <div key={i} className="flex justify-between items-center border-b border-gray-800 pb-2">
                                <span className="text-sm text-gray-300">{school.name}</span>
                                <span className="font-mono text-green-400">{school.count}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8">
                        <h3 className="text-xs font-bold text-gray-500 mb-2">FULL ROSTER ({SUPPORTED_SCHOOLS.length})</h3>
                        <div className="h-40 overflow-y-auto text-xs text-gray-600 space-y-1 scrollbar-hide">
                            {SUPPORTED_SCHOOLS.map(s => (
                                <div key={s.id}>{s.name}</div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Overwatch */}
                <div className="lg:col-span-2 bg-gray-900 border border-green-800 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5" /> POST SUPERVISION
                    </h2>
                    <div className="space-y-3">
                        {posts.map(post => (
                            <div key={post.id} className="flex items-center justify-between bg-black/50 p-3 rounded-lg border border-gray-800 hover:border-green-700 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center text-xs text-gray-500">
                                        IMG
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{post.title}</p>
                                        <p className="text-xs text-gray-400">{post.user} • ₦{post.price}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete(post.id)}
                                        className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white p-2 rounded transition-colors"
                                        title="NUKE POST"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {posts.length === 0 && (
                            <div className="text-center py-10 text-gray-500">No active posts to supervise.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
