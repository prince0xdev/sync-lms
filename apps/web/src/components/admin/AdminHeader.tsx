import { Link } from 'react-router-dom';
import { Book1, People } from 'iconsax-react';
import type { AdminView } from '../../features/admin/types';
import { initials } from '../../features/admin/initials';

type Props = {
    locale: string;
    firstName: string;
    lastName: string;
    view: AdminView;
    onViewChange: (view: AdminView) => void;
};

export default function AdminHeader({ locale, firstName, lastName, view, onViewChange }: Props) {
    const french = locale === 'fr';
    return <header className="staff-header">
        <Link to={`/${locale}/admin`} className="staff-brand"><span className="staff-brand-mark">S</span><span>SyncLearn<small>ADMIN STUDIO</small></span></Link>
        <nav className="staff-nav" aria-label={french ? 'Navigation admin' : 'Admin navigation'}>
            <button className={view === 'overview' ? 'is-active' : ''} onClick={() => onViewChange('overview')}>{french ? 'Vue d’ensemble' : 'Overview'}</button>
            <button className={view === 'courses' ? 'is-active' : ''} onClick={() => onViewChange('courses')}><Book1 size={17} />{french ? 'Formations' : 'Courses'}</button>
            <button className={view === 'students' ? 'is-active' : ''} onClick={() => onViewChange('students')}><People size={17} />{french ? 'Apprenants' : 'Learners'}</button>
        </nav>
        <div className="staff-header-right"><span className="staff-online"><i />{french ? 'Espace actif' : 'Workspace active'}</span><span className="staff-avatar">{initials(firstName, lastName)}</span></div>
    </header>;
}
