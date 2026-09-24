import { useI18n } from '../../lib/useI18n';
import { Book1, Chart2, People, VideoPlay } from 'iconsax-react';
import type { AdminOverview } from '../../features/admin/types';
import AdminMetric from './AdminMetric';

type Props = { overview?: AdminOverview };

export default function AdminMetrics({ overview }: Props) {
    const { t } = useI18n();
    return <section className="staff-metrics" aria-label={t('ui_statistics_statistiques')}>
        <AdminMetric icon={<Book1 size={19} color="#d410ab" />} label={t('ui_courses_formations')} value={overview?.course_count ?? '—'} detail={t('ui_in_the_catalogue_dans_le_catalogue')} />
        <AdminMetric icon={<People size={19} color="#d410ab" />} label={t('ui_learners_apprenants')} value={overview?.user_count ?? '—'} detail={t('ui_registered_accounts_comptes_inscrits')} />
        <AdminMetric icon={<Chart2 size={19} color="#d410ab" />} label={t('ui_enrollments_inscriptions')} value={overview?.enrollment_count ?? '—'} detail={t('ui_course_enrollments_parcours_suivis')} />
        <AdminMetric icon={<VideoPlay size={19} color="#d410ab" />} label={t('ui_modules_modules')} value={overview?.module_count ?? '—'} detail={t('ui_lessons_available_lecons_disponibles')} />
    </section>;
}
