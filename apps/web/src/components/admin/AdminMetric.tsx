import type { ReactNode } from 'react';

type Props = { icon: ReactNode; label: string; value: string | number; detail: string };

export default function AdminMetric({ icon, label, value, detail }: Props) {
    return <article className="staff-metric"><span className="staff-metric-icon">{icon}</span><span className="staff-metric-label">{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}
