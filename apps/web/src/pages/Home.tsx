import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CourseCard from '../components/CourseCard';
import { apiRequest } from '../lib/api';
import { useI18n } from '../lib/useI18n';
import type { CourseListResponse } from '../features/courses/types';

export default function Home() {
    const { locale, t } = useI18n();
    const [search, setSearch] = useState('');
    const [language, setLanguage] = useState('');
    const [level, setLevel] = useState('');
    const query = useQuery({
        queryKey: ['courses', 'list', search, language, level, locale],
        queryFn: () => {
            const params = new URLSearchParams();
            if (search.trim()) params.set('search', search.trim());
            if (language) params.set('language', language);
            if (level) params.set('level', level);
            const suffix = params.size ? `?${params.toString()}` : '';
            return apiRequest<CourseListResponse>(`/courses${suffix}`, { locale });
        },
    });

    return (
        <main>
            <section style={{ padding: '28px 0 16px' }}>
                <h1>{t('catalog_title')}</h1>
                <p>{t('catalog_description')}</p>
                <div className="catalog-filters">
                    <label>{t('search')}<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('search_placeholder')} /></label>
                    <label>{t('course_language')}<select value={language} onChange={(event) => setLanguage(event.target.value)}>
                        <option value="">{t('all_languages')}</option><option value="fr">Français</option><option value="en">English</option>
                    </select></label>
                    <label>{t('level')}<select value={level} onChange={(event) => setLevel(event.target.value)}>
                        <option value="">{t('all_levels')}</option><option value="beginner">{t('level_beginner')}</option>
                        <option value="intermediate">{t('level_intermediate')}</option><option value="advanced">{t('level_advanced')}</option>
                    </select></label>
                </div>
            </section>
            {query.isPending && <p role="status">{t('loading_courses')}</p>}
            {query.isError && <p role="alert">{query.error.message}</p>}
            {query.data && query.data.items.length === 0 && <p>{t('no_courses')}</p>}
            {query.data && query.data.items.length > 0 && <>
                <p>{query.data.total} {t('courses_found')}</p>
                <div className="course-grid">
                    {query.data.items.map((course) => <CourseCard key={course.id} course={course} />)}
                </div>
            </>}
        </main>
    );
}
