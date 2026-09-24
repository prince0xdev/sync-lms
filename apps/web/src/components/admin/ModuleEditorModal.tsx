import { useState, type FormEvent } from 'react';
import { Button, Input, Modal, ModalDescription, ModalTitle, Textarea } from '@umami/react-zen';
import { CloseCircle } from 'iconsax-react';
import type { AdminModule, ModuleDraft } from '../../features/admin/types';

type Props = { module?: AdminModule; position: number; locale: string; isSaving: boolean; error?: string; onSave: (draft: ModuleDraft) => void; onClose: () => void };

export default function ModuleEditorModal({ module, position, locale, isSaving, error, onSave, onClose }: Props) {
    const french = locale === 'fr';
    const [draft, setDraft] = useState<ModuleDraft>({
        id: module?.id,
        title: module?.title ?? '',
        description: module?.description ?? '',
        position: module?.position ?? position,
        duration_seconds: module?.duration_seconds ?? 600,
    });
    return <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }} className="staff-modal staff-module-modal">
        <header className="staff-modal-head"><div><p className="staff-eyebrow">{french ? 'CONTENU PÉDAGOGIQUE' : 'COURSE CONTENT'}</p><ModalTitle>{module ? french ? 'Modifier le module' : 'Edit module' : french ? 'Nouveau module' : 'New module'}</ModalTitle><ModalDescription>{french ? 'La vidéo se rattache à ce module et peut exister en plusieurs langues.' : 'Videos belong to this module and can be added in multiple languages.'}</ModalDescription></div><Button variant="quiet" className="staff-icon-button" onClick={onClose} aria-label={french ? 'Fermer' : 'Close'}><CloseCircle size={22} /></Button></header>
        <form className="staff-form" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSave(draft); }}>
            <label>{french ? 'Titre du module' : 'Module title'}<Input required maxLength={200} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <label>{french ? 'Position' : 'Position'}<Input type="number" required min={1} value={draft.position} onChange={(event) => setDraft({ ...draft, position: Number(event.target.value) })} /></label>
            <label className="staff-form-wide">{french ? 'Description' : 'Description'}<Textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} /></label>
            <label>{french ? 'Durée (secondes)' : 'Duration (seconds)'}<Input type="number" min={0} value={draft.duration_seconds} onChange={(event) => setDraft({ ...draft, duration_seconds: Number(event.target.value) })} /></label>
            <div className="staff-form-actions staff-form-wide"><span className="staff-form-error">{error}</span><Button variant="primary" className="staff-primary" type="submit" isDisabled={isSaving}>{isSaving ? french ? 'Enregistrement…' : 'Saving…' : french ? 'Enregistrer le module' : 'Save module'}</Button></div>
        </form>
    </Modal>;
}
