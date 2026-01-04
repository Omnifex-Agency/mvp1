
"use client";
import React from 'react';
import { Home, Layers, Settings, LogOut } from 'lucide-react';

export default function Sidebar() {
    return (
        <aside className="fixed top-0 left-0 w-64 h-full bg-surface border-r border-border p-6 flex flex-col justify-between z-20">
            <div>
                {/* Logo */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                        O
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">Omnifex</span>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                    <NavItem icon={<Home size={20} />} label="Dashboard" active />
                    <NavItem icon={<Layers size={20} />} label="All Learnings" />
                    <NavItem icon={<Settings size={20} />} label="Settings" />
                </nav>
            </div>

            {/* Footer User */}
            {/* Footer User */}
            <div className="border-t border-border pt-4 mt-4">
                <button
                    onClick={async () => {
                        const { createClient } = await import('@/utils/supabase/client');
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        window.location.href = '/login';
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 transition-colors w-full text-left group"
                >
                    <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-muted">
                        JD
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-white">Sign Out</p>
                        <p className="text-xs text-muted">John Doe</p>
                    </div>
                    <LogOut size={16} className="text-muted group-hover:text-red-400 transition-colors" />
                </button>
            </div>
        </aside>
    );
}

function NavItem({ icon, label, active }: { icon: any, label: string, active?: boolean }) {
    return (
        <button className={`
      flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium transition-all duration-200
      ${active
                ? "bg-neutral-800 text-white border-l-2 border-accent shadow-[0_0_20px_rgba(124,58,237,0.1)]"
                : "text-muted hover:text-white hover:bg-neutral-800/50"
            }
    `}>
            <span className={active ? "text-accent" : ""}>{icon}</span>
            {label}
        </button>
    );
}
