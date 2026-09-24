import { Button } from '@umami/react-zen';
import { useI18n } from '../lib/i18n';

export default function Hero() {
    const { t } = useI18n();
    return (
        <section style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: 56, fontWeight: 700, margin: 0 }}>{t('title')}</h1>
                <p style={{ marginTop: 12, marginBottom: 20 }}>A simple e-learning demo inspired by TestGorilla.</p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <Button variant="primary">{t('see_plans')}</Button>
                    <Button variant="secondary">{t('search')}</Button>
                </div>
            </div>
            <div style={{ width: 360, height: 320, borderRadius: 8, background: 'linear-gradient(180deg,#fff,#f3f4f6)' }} />
        </section>
    );
}
