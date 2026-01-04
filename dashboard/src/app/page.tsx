"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import Sidebar from '@/components/Sidebar';
import StatsRow from '@/components/StatsRow';
import LearningList from '@/components/LearningList';
import Modal from '@/components/Modal';

export default function Home() {
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, sent: 0 });

  const [viewId, setViewId] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [loadingModal, setLoadingModal] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        // Don't alert on RLS empty, just log
        return;
      }

      const alerts = data || [];

      // Calculate stats locally
      setItems(alerts.map((a: any) => ({
        id: a.id,
        title: a.title,
        reminderDate: a.reminder_date,
        format: a.format,
        status: a.status,
        content: a.content,
        createdAt: a.created_at,
        sourceUrl: a.source_url
      })));

      const todayStr = new Date().toISOString().split('T')[0];
      setStats({
        total: alerts.length,
        pending: alerts.filter((a: any) => a.status === 'scheduled' && a.reminder_date <= todayStr).length,
        sent: alerts.filter((a: any) => a.status === 'sent').length
      });

    } catch (e) {
      console.error("Fetch error", e);
    }
  };

  const handleView = async (id: string) => {
    setViewId(id);
    setLoadingModal(true);
    const found = items.find(i => i.id === id);
    setModalData(found);
    setLoadingModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this alert?")) return;
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (e: any) {
      alert("Delete failed: " + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text font-sans">
      {viewId && (
        <Modal
          isLoading={loadingModal}
          data={modalData}
          onClose={() => setViewId(null)}
        />
      )}

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="pl-64">
        <div className="max-w-6xl mx-auto px-10 py-12">
          {/* Header */}
          <header className="mb-10">
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted text-lg">Manage your knowledge retention queue.</p>
          </header>

          {/* Stats */}
          <StatsRow stats={stats} />

          {/* Grid */}
          <div className="mb-6 flex justify-between items-end">
            <h2 className="text-xl font-semibold text-white">Recent Learnings</h2>
            <div className="text-sm text-neutral-500">Sorted by newest</div>
          </div>

          <LearningList items={items} onView={handleView} onDelete={handleDelete} />
        </div>
      </main>
    </div>
  );
}

