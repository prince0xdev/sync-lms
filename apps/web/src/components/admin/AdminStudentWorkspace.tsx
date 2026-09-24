import { Badge, Button, TextField } from '@umami/react-zen';
import { ArrowRight2, People, SearchNormal1 } from 'iconsax-react';
import type { AdminUser } from '../../features/admin/types';
import { initials } from '../../features/admin/initials';

type Props = { users: AdminUser[]; locale: string; search: string; onSearch: (value: string) => void; isLoading: boolean; error?: string; selectedId: string; onSelect: (id: string) => void };

export default function AdminStudentWorkspace({ users, locale, search, onSearch, isLoading, error, selectedId, onSelect }: Props) {
    const french = locale === 'fr';
    const displayDate = new Intl.DateTimeFormat(french ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    return <>
        <section className="staff-page-heading"><div><p className="staff-eyebrow">{french ? 'SUIVI PÉDAGOGIQUE' : 'LEARNER SUCCESS'}</p><h1>{french ? 'Vos apprenants' : 'Your learners'}</h1><p>{french ? 'Consultez les inscriptions et la progression de chaque élève.' : 'Review enrollments and each learner’s course progress.'}</p></div><span className="staff-count-large"><People size={19} />{users.length} {french ? 'comptes' : 'accounts'}</span></section>
        <section className="staff-panel">
            <div className="staff-section-head"><div><h2>{french ? 'Tous les apprenants' : 'All learners'}</h2><p>{french ? 'Sélectionnez une personne pour voir ses formations.' : 'Select a learner to view their courses.'}</p></div><label className="staff-search"><SearchNormal1 size={17} /><TextField aria-label={french ? 'Nom ou adresse e-mail' : 'Name or email'} value={search} onChange={onSearch} placeholder={french ? 'Nom ou adresse e-mail' : 'Name or email'} /></label></div>
            {isLoading && <p className="staff-empty">{french ? 'Chargement des apprenants…' : 'Loading learners…'}</p>}
            {error && <p className="staff-alert" role="alert">{error}</p>}
            {!isLoading && users.length === 0 && <p className="staff-empty">{french ? 'Aucun apprenant trouvé.' : 'No learners found.'}</p>}
            {users.length > 0 && <div className="staff-table-wrap"><table className="staff-table"><thead><tr><th>{french ? 'Apprenant' : 'Learner'}</th><th>{french ? 'Inscrit depuis' : 'Joined'}</th><th>{french ? 'Formations' : 'Courses'}</th><th>{french ? 'Progression' : 'Progress'}</th><th>{french ? 'Rôle' : 'Role'}</th><th /></tr></thead><tbody>{users.map((student) => <tr key={student.id} className={student.id === selectedId ? 'selected' : ''}>
                <td><span className="staff-user-cell"><span className="staff-mini-avatar">{initials(student.first_name, student.last_name)}</span><span><strong>{student.first_name} {student.last_name}</strong><small>{student.email}</small></span></span></td>
                <td>{displayDate.format(new Date(student.created_at))}</td><td>{student.enrollment_count}</td>
                <td><span className="staff-progress-cell"><span className="staff-progress-track"><i style={{ width: `${student.progress_percent}%` }} /></span>{student.progress_percent}%</span></td>
                <td><Badge className={student.is_admin ? 'staff-role is-admin' : 'staff-role'}>{student.is_admin ? 'Admin' : french ? 'Apprenant' : 'Learner'}</Badge></td>
                <td><Button variant="quiet" className="staff-icon-button" aria-label={french ? 'Voir la progression' : 'View progress'} onClick={() => onSelect(student.id)}><ArrowRight2 size={19} /></Button></td>
            </tr>)}</tbody></table></div>}
        </section>
    </>;
}
