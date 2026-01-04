
"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, FileText, List, HelpCircle, Trash2, ExternalLink, Layers } from 'lucide-react';

export default function LearningList({ items, onView, onDelete }: any) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
                <div className="relative mb-6 group">
                    <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="relative p-6 bg-surface border border-border rounded-2xl shadow-2xl transform transition-transform group-hover:scale-105 duration-500">
                        <Layers size={48} className="text-muted group-hover:text-accent transition-colors duration-500" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Knowledge Base Empty</h3>
                <p className="text-muted max-w-sm mx-auto mb-8">
                    Your collection is waiting for its first spark. Use the browser extension to capture insights instantly.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 rounded-full border border-neutral-800 text-xs text-neutral-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Ready to capture
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any, i: number) => (
                <LearningCard key={item.id} item={item} index={i} onView={onView} onDelete={onDelete} />
            ))}
        </div>
    );
}

function LearningCard({ item, index, onView, onDelete }: any) {
    const getFormatIcon = (fmt: string) => {
        switch (fmt) {
            case 'summary': return <List size={14} />;
            case 'quiz': return <HelpCircle size={14} />;
            default: return <FileText size={14} />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group relative bg-surface border border-border rounded-xl p-5 hover:border-neutral-600 hover:shadow-2xl hover:shadow-black/50 transition-all duration-300 hover:-translate-y-1"
        >
            <div className="flex justify-between items-start mb-3">
                <div className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border
          ${item.format === 'quiz' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        item.format === 'summary' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            'bg-neutral-800 text-neutral-400 border-neutral-700'}
        `}>
                    {getFormatIcon(item.format)}
                    {item.format}
                </div>

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onDelete(item.id)} className="p-1.5 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 rounded-md transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 leading-tight group-hover:text-accent transition-colors">
                {item.title}
            </h3>

            <p className="text-sm text-muted line-clamp-3 mb-6 h-[4.5em]">
                {item.content}
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-medium">
                    <Calendar size={14} />
                    {item.reminderDate}
                </div>

                <button
                    onClick={() => onView(item.id)}
                    className="text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-white/5 px-3 py-1.5 rounded-lg transition-colors"
                >
                    View Full
                </button>
            </div>
        </motion.div>
    );
}

