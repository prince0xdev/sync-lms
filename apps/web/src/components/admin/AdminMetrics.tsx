import { Book1, Chart2, People, VideoPlay } from 'iconsax-react';
import type { AdminOverview } from '../../features/admin/types';
import AdminMetric from './AdminMetric';

type Props = { overview?: AdminOverview; locale: string };

export default function AdminMetrics({ overview, locale }: Props) {
    const french = locale === 'fr';
    return <section className="staff-metrics" aria-label={french ? 'Statistiques' : 'Statistics'}>
        <AdminMetric icon={<Book1 size={19} />} label={french ? 'Formations' : 'Courses'} value={overview?.course_count ?? '—'} detail={french ? 'dans le catalogue' : 'in the catalogue'} />
        <AdminMetric icon={<People size={19} />} label={french ? 'Apprenants' : 'Learners'} value={overview?.user_count ?? '—'} detail={french ? 'comptes inscrits' : 'registered accounts'} />
        <AdminMetric icon={<Chart2 size={19} />} label={french ? 'Inscriptions' : 'Enrollments'} value={overview?.enrollment_count ?? '—'} detail={french ? 'parcours suivis' : 'course enrollments'} />
        <AdminMetric icon={<VideoPlay size={19} />} label={french ? 'Modules' : 'Modules'} value={overview?.module_count ?? '—'} detail={french ? 'leçons disponibles' : 'lessons available'} />
    </section>;
}
