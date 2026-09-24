import { useI18n } from '../../lib/useI18n';
import { Link } from 'react-router-dom';
import { Book1, People } from 'iconsax-react';
import type { AdminView } from '../../features/admin/types';

type Props = { view: AdminView; onViewChange: (view: AdminView) => void };

export default function AdminHeader({ view, onViewChange }: Props) {
    const { t } = useI18n();
    return <nav className="staff-nav" aria-label="Administration">
        <button className={view === 'overview' ? 'is-active' : ''} onClick={() => onViewChange('overview')}>{t('ui_overview_vue_densemble')}</button>
        <button className={view === 'courses' ? 'is-active' : ''} onClick={() => onViewChange('courses')}><Book1 size={17} color="#d410ab" />{t('ui_courses_formations')}</button>
        <button className={view === 'students' ? 'is-active' : ''} onClick={() => onViewChange('students')}><People size={17} color="#d410ab" />{t('ui_learners_apprenants')}</button>
    </nav>;
}
