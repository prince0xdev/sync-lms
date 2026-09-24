import { Button } from '@umami/react-zen';

export default function CourseCard({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <div style={{ height: 120, borderRadius: 6, background: '#eee' }} />
            <h4 style={{ margin: '12px 0 6px' }}>{title}</h4>
            <p style={{ margin: 0, color: '#666' }}>{subtitle}</p>
            <div style={{ marginTop: 12 }}>
                <Button variant="primary">Start course</Button>
            </div>
        </div>
    );
}
