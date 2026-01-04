
// src/components/AlertItem.tsx
import React from 'react';

type Alert = {
    id: string;
    title: string;
    reminderDate: string;
    format: string;
    status: string;
};

interface Props {
    alert: Alert;
    onView: (id: string) => void;
    onDelete: (id: string) => void;
}

export default function AlertItem({ alert, onView, onDelete }: Props) {
    return (
        <div className="alert-item">
            <div>
                <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{alert.title}</h3>
                <div style={{ display: 'flex', gap: '10px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <span>📅 {alert.reminderDate}</span>
                    <span>📝 {alert.format}</span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span className={`badge ${alert.status}`}>{alert.status}</span>
                <button className="btn" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => onView(alert.id)}>
                    View
                </button>
                <button
                    onClick={() => onDelete(alert.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                    🗑️
                </button>
            </div>
        </div>
    );
}
