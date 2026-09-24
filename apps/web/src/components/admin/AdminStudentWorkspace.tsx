import { useI18n } from '../../lib/useI18n';
import { Badge, Button, TextField } from '@umami/react-zen';
import { ArrowRight2, People, SearchNormal1 } from 'iconsax-react';
import type { AdminUser } from '../../features/admin/types';
import { initials } from '../../features/admin/initials';

type Props = { users: AdminUser[]; locale: string; search: string; onSearch: (value: string) => void; isLoading: boolean; error?: string; selectedId: string; onSelect: (id: string) => void };

export default function AdminStudentWorkspace({ users, locale, search, onSearch, isLoading, error, selectedId, onSelect }: Props) {
    const { t } = useI18n();
    const displayDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    return <>
        <section className="staff-page-heading"><div><p className="staff-eyebrow">{t('ui_learner_success_suivi_pedagogique')}</p><h1>{t('ui_your_learners_vos_apprenants')}</h1><p>{t('ui_review_enrollments_and_each_learners_cours_consultez_les_inscriptions_et_la_progressi')}</p></div><span className="staff-count-large"><People size={19} color="#d410ab" />{users.length} {t('ui_accounts_comptes')}</span></section>
        <section className="staff-panel">
            <div className="staff-section-head"><div><h2>{t('ui_all_learners_tous_les_apprenants')}</h2><p>{t('ui_select_a_learner_to_view_their_courses_selectionnez_une_personne_pour_voir_ses_fo')}</p></div><label className="staff-search"><SearchNormal1 size={17} color="#d410ab" /><TextField aria-label={t('ui_name_or_email_nom_ou_adresse_e_mail')} value={search} onChange={onSearch} placeholder={t('ui_name_or_email_nom_ou_adresse_e_mail')} /></label></div>
            {isLoading && <p className="staff-empty">{t('ui_loading_learners_chargement_des_apprenants')}</p>}
            {error && <p className="staff-alert" role="alert">{error}</p>}
            {!isLoading && users.length === 0 && <p className="staff-empty">{t('ui_no_learners_found_aucun_apprenant_trouve')}</p>}
            {users.length > 0 && <div className="staff-table-wrap"><table className="staff-table"><thead><tr><th>{t('ui_learner_apprenant')}</th><th>{t('ui_joined_inscrit_depuis')}</th><th>{t('ui_courses_formations')}</th><th>{t('ui_progress_progression')}</th><th>{t('ui_role_role')}</th><th /></tr></thead><tbody>{users.map((student) => <tr key={student.id} className={student.id === selectedId ? 'selected' : ''}>
                <td><span className="staff-user-cell"><span className="staff-mini-avatar">{initials(student.first_name, student.last_name)}</span><span><strong>{student.first_name} {student.last_name}</strong><small>{student.email}</small></span></span></td>
                <td>{displayDate.format(new Date(student.created_at))}</td><td>{student.enrollment_count}</td>
                <td><span className="staff-progress-cell"><span className="staff-progress-track"><i style={{ width: `${student.progress_percent}%` }} /></span>{student.progress_percent}%</span></td>
                <td><Badge className={student.is_admin ? 'staff-role is-admin' : 'staff-role'}>{student.is_admin ? 'Admin' : t('ui_learner_apprenant')}</Badge></td>
                <td><Button variant="quiet" className="staff-icon-button" aria-label={t('ui_view_progress_voir_la_progression')} onClick={() => onSelect(student.id)}><ArrowRight2 size={19} color="#d410ab" /></Button></td>
            </tr>)}</tbody></table></div>}
        </section>
    </>;
}
