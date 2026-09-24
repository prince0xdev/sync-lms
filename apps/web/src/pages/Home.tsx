import CourseCard from '../components/CourseCard';
import Hero from '../components/Hero';
import { useI18n } from '../lib/useI18n';

export default function Home() {
    const { t } = useI18n();
    return (
        <main>
            <Hero />
            <section style={{ marginTop: 32 }}>
                <h2 style={{ marginBottom: 16 }}>{t('featured')}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                    <CourseCard title={t('course_data')} subtitle={`Apache Spark · ${t('level_beginner')}`} />
                    <CourseCard title={t('course_fullstack')} subtitle={`${t('backend')} · ${t('level_intermediate')}`} />
                    <CourseCard title={t('course_cloud')} subtitle={t('level_advanced')} />
                </div>
            </section>
        </main>
    );
}
