export default function FeatureCard({ title, children }: { title: string; children?: React.ReactNode }) {
    return (
        <div style={{ padding: 16, borderRadius: 8, background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            <h3 style={{ marginTop: 0 }}>{title}</h3>
            <div>{children}</div>
        </div>
    );
}
