import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { useI18n } from '../lib/useI18n';

type AuthFormProps = { mode: 'login' | 'register' };

export default function AuthForm({ mode }: AuthFormProps) {
    const { login, register } = useAuth();
    const { locale, t } = useI18n();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError('');
        setIsSubmitting(true);
        const form = new FormData(event.currentTarget);
        try {
            if (mode === 'login') {
                await login(String(form.get('email')), String(form.get('password')));
            } else {
                await register({
                    email: String(form.get('email')),
                    password: String(form.get('password')),
                    first_name: String(form.get('first_name')),
                    last_name: String(form.get('last_name')),
                });
            }
            navigate(`/${locale}/profile`, { replace: true });
        } catch (cause) {
            setError(cause instanceof ApiError ? cause.message : t('network_error'));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main style={{ maxWidth: 440, margin: '56px auto', padding: 24, border: '1px solid var(--zen-border)', borderRadius: 16, background: 'var(--zen-surface-raised)' }}>
            <h1>{t(mode === 'login' ? 'login_title' : 'register_title')}</h1>
            <form className="auth-form" onSubmit={submit} style={{ display: 'grid', gap: 16 }}>
                {mode === 'register' && <>
                    <label>{t('first_name')}<input name="first_name" autoComplete="given-name" required maxLength={100} /></label>
                    <label>{t('last_name')}<input name="last_name" autoComplete="family-name" required maxLength={100} /></label>
                </>}
                <label>{t('email')}<input name="email" type="email" autoComplete="email" required maxLength={320} /></label>
                <label>{t('password')}<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? 1 : 10} maxLength={128} /></label>
                {error && <p role="alert" style={{ color: 'var(--zen-danger, #b42318)' }}>{error}</p>}
                <button type="submit" disabled={isSubmitting}>{t(isSubmitting ? 'loading' : mode === 'login' ? 'login' : 'register')}</button>
            </form>
            <p>
                {mode === 'login' ? t('no_account') : t('has_account')} {' '}
                <Link to={`/${locale}/${mode === 'login' ? 'register' : 'login'}`}>{t(mode === 'login' ? 'register' : 'login')}</Link>
            </p>
        </main>
    );
}
