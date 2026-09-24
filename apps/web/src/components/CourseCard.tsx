import { Button } from '@umami/react-zen';
import { useI18n } from '../lib/useI18n';

export default function CourseCard({ title, subtitle }: { title: string; subtitle?: string }) {
    const { t } = useI18n();
    return (
        <article style={{ background: 'var(--zen-surface-raised)', border: '1px solid var(--zen-border)', borderRadius: 12, padding: 16 }}>
            <div aria-hidden="true" style={{ height: 120, borderRadius: 8, background: 'var(--zen-surface-sunken)' }} />
            <h3 style={{ margin: '12px 0 6px' }}>{title}</h3>
            <p style={{ margin: 0, color: 'var(--zen-fg-muted)' }}>{subtitle}</p>
            <div style={{ marginTop: 12 }}>
                <Button variant="primary">{t('start_learning')}</Button>
            </div>
        </article>
    );
}
