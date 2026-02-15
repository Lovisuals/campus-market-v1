"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface SiteAlert {
    id: string;
    message: string;
    is_active: boolean;
    color_theme: string;
    link_url: string | null;
}

export default function AlertManager() {
    const [alerts, setAlerts] = useState<SiteAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newAlert, setNewAlert] = useState({
        message: "",
        color_theme: "teal",
        link_url: "",
    });

    const supabase = createClient();

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("site_alerts")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setAlerts(data);
        }
        setIsLoading(false);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAlert.message) return;

        setIsSubmitting(true);
        const { error } = await supabase.from("site_alerts").insert([
            {
                message: newAlert.message,
                color_theme: newAlert.color_theme,
                link_url: newAlert.link_url || null,
                is_active: true,
            },
        ]);

        if (!error) {
            setNewAlert({ message: "", color_theme: "teal", link_url: "" });
            fetchAlerts();
        }
        setIsSubmitting(false);
    };

    const toggleStatus = async (id: string, current: boolean) => {
        const { error } = await supabase
            .from("site_alerts")
            .update({ is_active: !current })
            .eq("id", id);
        if (!error) fetchAlerts();
    };

    const deleteAlert = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        const { error } = await supabase.from("site_alerts").delete().eq("id", id);
        if (!error) fetchAlerts();
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-[#202c33] p-6 rounded-xl border border-gray-200 dark:border-[#2a3942]">
                <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">🚀 Push New Live Alert</h3>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Message</label>
                        <input
                            type="text"
                            value={newAlert.message}
                            onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border dark:bg-[#111b21] dark:border-[#2a3942] focus:ring-wa-teal"
                            placeholder="e.g. MAINTENANCE: Site will be down for 5 mins at 10PM"
                            required
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Color</label>
                            <select
                                value={newAlert.color_theme}
                                onChange={(e) => setNewAlert({ ...newAlert, color_theme: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border dark:bg-[#111b21] dark:border-[#2a3942]"
                            >
                                <option value="teal">WhatsApp Teal (Standard)</option>
                                <option value="red">Urgent Red (Alerts)</option>
                                <option value="gold">Premium Gold (Promo)</option>
                                <option value="blue">Info Blue (Notice)</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Link URL (Optional)</label>
                            <input
                                type="text"
                                value={newAlert.link_url}
                                onChange={(e) => setNewAlert({ ...newAlert, link_url: e.target.value })}
                                className="w-full px-4 py-2 rounded-lg border dark:bg-[#111b21] dark:border-[#2a3942]"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-2 bg-wa-teal text-white font-bold rounded-lg hover:bg-[#006d59] disabled:opacity-50"
                    >
                        {isSubmitting ? "Pushing..." : "Broadcast Alert"}
                    </button>
                </form>
            </div>

            <div className="bg-white dark:bg-[#202c33] rounded-xl border border-gray-200 dark:border-[#2a3942] overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-[#111b21] border-b dark:border-[#2a3942]">
                        <tr>
                            <th className="px-6 py-3 text-sm font-bold dark:text-white">Alert Message</th>
                            <th className="px-6 py-3 text-sm font-bold dark:text-white">Status</th>
                            <th className="px-6 py-3 text-sm font-bold dark:text-white">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alerts.map((a) => (
                            <tr key={a.id} className="border-b dark:border-[#2a3942] hover:bg-gray-50 dark:hover:bg-[#2a3942]">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-3 h-3 rounded-full bg-${a.color_theme === 'teal' ? '[#008069]' : a.color_theme + '-500'}`}></span>
                                        <span className="text-sm dark:text-gray-200">{a.message}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => toggleStatus(a.id, a.is_active)}
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${a.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {a.is_active ? "LIVE" : "PAUSED"}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => deleteAlert(a.id)}
                                        className="text-red-600 hover:text-red-700 text-sm font-bold"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
