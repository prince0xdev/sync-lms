import { Link } from 'react-router-dom';
import LangSwitcher from './LangSwitcher';

export default function Header() {
    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
            <Link to="/" style={{ fontWeight: 700 }}>Logo</Link>
            <LangSwitcher />
        </header>
    );
}
