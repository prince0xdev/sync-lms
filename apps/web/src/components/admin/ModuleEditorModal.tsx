import { useI18n } from '../../lib/useI18n';
import { useState, type FormEvent } from 'react';
import { Button, Input, Modal, ModalDescription, ModalTitle, Textarea } from '@umami/react-zen';
import { CloseCircle } from 'iconsax-react';
import type { AdminModule, ModuleDraft } from '../../features/admin/types';

type Props = { module?: AdminModule; position: number; isSaving: boolean; error?: string; onSave: (draft: ModuleDraft) => void; onClose: () => void };

export default function ModuleEditorModal({ module, position, isSaving, error, onSave, onClose }: Props) {
    const { t } = useI18n();
    const [draft, setDraft] = useState<ModuleDraft>({
        id: module?.id,
        title: module?.title ?? '',
        description: module?.description ?? '',
        position: module?.position ?? position,
        duration_seconds: module?.duration_seconds ?? 600,
    });
    return <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }} className="staff-modal staff-module-modal">
        <header className="staff-modal-head"><div><p className="staff-eyebrow">{t('ui_course_content_contenu_pedagogique')}</p><ModalTitle>{module ? t('ui_edit_module_modifier_le_module') : t('ui_new_module_nouveau_module')}</ModalTitle><ModalDescription>{t('ui_videos_belong_to_this_module_and_can_be_ad_la_video_se_rattache_a_ce_module_et_peut_e')}</ModalDescription></div><Button variant="quiet" className="staff-icon-button" onClick={onClose} aria-label={t('ui_close_fermer')}><CloseCircle size={22} color="#d410ab" /></Button></header>
        <form className="staff-form" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(draft); }}>
            <label>{t('ui_module_title_titre_du_module')}<Input required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <label>{t('ui_position_position')}<Input type="number" required min={1} value={draft.position} onChange={(event) => setDraft({ ...draft, position: Number(event.target.value) })} /></label>
            <label className="staff-form-wide">{t('ui_description_description')}<Textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            <label>{t('ui_duration_seconds_duree_secondes')}<Input type="number" min={0} value={draft.duration_seconds} onChange={(event) => setDraft({ ...draft, duration_seconds: Number(event.target.value) })} /></label>
            <div className="staff-form-actions staff-form-wide"><span className="staff-form-error">{error}</span><Button variant="primary" className="staff-primary" type="submit" isDisabled={isSaving}>{isSaving ? t('ui_saving_enregistrement') : t('ui_save_module_enregistrer_le_module')}</Button></div>
        </form>
    </Modal>;
}
