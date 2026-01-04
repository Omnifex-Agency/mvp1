
"use client";
import React from 'react';
import { Share2, Zap, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatsRow({ stats }: { stats: any }) {
    return (
        <div className="grid grid-cols-3 gap-6 mb-10">
            <StatCard
                label="Total Knowledge"
                value={stats.total}
                icon={<BrainCircuit size={24} className="text-violet-400" />}
                delay={0}
            />
            <StatCard
                label="Pending Recall"
                value={stats.pending}
                icon={<Share2 size={24} className="text-amber-400" />}
                isPending
                delay={0.1}
            />
            <StatCard
                label="Current Streak"
                value="12 Days"
                icon={<Zap size={24} className="text-emerald-400" />}
                delay={0.2}
            />
        </div>
    );
}

function StatCard({ label, value, icon, isPending, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
            className="p-6 bg-surface border border-border rounded-xl relative overflow-hidden group hover:border-neutral-700 transition-colors"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-neutral-900/50 rounded-lg border border-white/5">
                    {icon}
                </div>
                {isPending && Number(value) > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                <p className="text-sm text-muted uppercase tracking-wider font-medium mt-1">{label}</p>
            </div>

            {/* Background Gradient Effect */}
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-accent/10 transition-colors duration-500"></div>
        </motion.div>
    );
}
