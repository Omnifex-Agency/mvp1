
"use client";
import React, { useEffect } from 'react';
import { X, ExternalLink, Calendar, Clock, FileText, List, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isLoading: boolean;
    data: any;
    onClose: () => void;
}

export default function Modal({ isLoading, data, onClose }: Props) {
    // Esc key close
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!data && !isLoading) return null;

    const getFormatIcon = (fmt: string) => {
        switch (fmt) {
            case 'summary': return <List size={16} />;
            case 'quiz': return <HelpCircle size={16} />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="relative w-full max-w-2xl bg-[#121215] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-900/30">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-white tracking-tight">Detail View</h2>
                            {data && (
                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border ${data.format === 'quiz' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                    data.format === 'summary' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        'bg-neutral-800 text-neutral-400 border-neutral-700'
                                    }`}>
                                    {getFormatIcon(data.format)}
                                    {data.format}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-muted text-sm">Loading content...</p>
                            </div>
                        ) : data ? (
                            <div className="space-y-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-white mb-2 leading-snug">{data.title}</h1>
                                    {data.sourceUrl && (
                                        <a
                                            href={data.sourceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors font-medium hover:underline"
                                        >
                                            <ExternalLink size={12} />
                                            {new URL(data.sourceUrl).hostname}
                                        </a>
                                    )}
                                </div>

                                <div className="p-5 bg-black/40 border border-neutral-800 rounded-xl leading-relaxed text-neutral-300 font-mono text-sm whitespace-pre-wrap shadow-inner relative group min-h-[200px]">
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={() => navigator.clipboard.writeText(data.content)}
                                            className="text-[10px] text-muted hover:text-white uppercase tracking-wider font-bold bg-neutral-900/80 px-2 py-1 rounded"
                                        >
                                            Copy
                                        </button>
                                    </div>

                                    {/* Dynamic Renderer */}
                                    {data.format === 'quiz' ? (
                                        <QuizRenderer content={data.content} />
                                    ) : data.format === 'summary' ? (
                                        <SummaryRenderer content={data.content} />
                                    ) : (
                                        <div className="whitespace-pre-wrap">{data.content}</div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between text-xs text-neutral-500 pt-4 border-t border-neutral-800">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            Created {new Date(data.createdAt).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} />
                                            {new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>Status:</span>
                                        <span className={`px-2 py-0.5 rounded-full ${data.status === 'scheduled' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                                            }`}>
                                            {data.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-red-400 text-center py-8">Failed to load content.</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// ----------------------------------------------------------------------------
// Renderers
// ----------------------------------------------------------------------------

function SummaryRenderer({ content }: { content: string }) {
    // Basic parser for bullets (-, *, •) to clean UI
    const points = content.split(/\n/).filter(line => line.trim().length > 0);

    return (
        <ul className="space-y-3">
            {points.map((point, idx) => {
                const clean = point.replace(/^[-*•]\s?/, '');
                // Detect if it is actually a bullet or just text
                const isBullet = point.trim().match(/^[-*•.]/);

                return (
                    <li key={idx} className="flex items-start gap-3">
                        {isBullet && (
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                        )}
                        <span className={isBullet ? "text-neutral-200" : "text-neutral-400 italic"}>
                            {isBullet ? clean : point}
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}

function QuizRenderer({ content }: { content: string }) {
    // A heuristic parser for standard AI quiz format
    // Splitting by "Question" or "Q1" could be fragile, so we try newline blocks
    // This is a "best effort" renderer for text-based quizzes

    // Attempt to chunk by double newlines or "Q"
    // Regex logic: Look for blocks starting with Q\d or Question

    // Simplest approach: Just render nicely formatted blocks for now
    // Advanced: Parse into objects. Let's stick to advanced visual formatting of the text.

    // Highlight "Answer:" lines and "Q:" lines
    const lines = content.split('\n');

    return (
        <div className="space-y-4">
            {lines.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;

                // Title/Question detection
                if (trimmed.match(/^(Q\d?:?|Question)/i)) {
                    return (
                        <div key={i} className="font-bold text-white mt-4 border-l-2 border-purple-500 pl-3 py-1">
                            {trimmed}
                        </div>
                    );
                }

                // Options detection (A), B), 1., etc)
                if (trimmed.match(/^([A-D]\)|[1-4]\.)/)) {
                    return (
                        <div key={i} className="ml-4 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-default text-neutral-300">
                            {trimmed}
                        </div>
                    );
                }

                // Answer detection
                if (trimmed.match(/^(Answer:|Ans:)/i)) {
                    return (
                        <div key={i} className="mt-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-md inline-block">
                            {trimmed}
                        </div>
                    );
                }

                // Fallback
                return <div key={i} className="text-neutral-400">{trimmed}</div>;
            })}
        </div>
    );
}
