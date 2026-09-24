import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
    locale: string;
    title: string;
    firstName: string;
    lastName: string;
    navigation: ReactNode;
    statusLabel: string;
    footerLabel: string;
    footerAction: ReactNode;
    children: ReactNode;
};

export default function WorkspaceLayout({ locale, title, firstName, lastName, navigation, statusLabel, footerLabel, footerAction, children }: Props) {
    return <div className="staff-shell">
        <header className="staff-header">
            <Link to={`/${locale}`} className="staff-brand"><span className="staff-brand-mark">S</span><span>SyncLearn<small>{title}</small></span></Link>
            {navigation}
            <div className="staff-header-right"><span className="staff-online"><i />{statusLabel}</span><span className="staff-avatar">{`${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()}</span></div>
        </header>
        <main className="staff-content">{children}</main>
        <footer className="staff-footer"><span>SyncLearn · {footerLabel}</span>{footerAction}</footer>
    </div>;
}
