import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface MobileMenuProps {
    githubUrl: string;
}

const NAV_LINKS = [
    { href: '#about', label: 'Подход' },
    { href: '#cases', label: 'Кейсы' },
    { href: '#archive', label: 'Архив' },
    { href: '#contact', label: 'Контакт' },
];

export function MobileMenu({ githubUrl }: MobileMenuProps) {
    const [open, setOpen] = useState(false);

    // Close on anchor navigation
    useEffect(() => {
        if (!open) return;
        const handler = () => setOpen(false);
        window.addEventListener('hashchange', handler);
        return () => window.removeEventListener('hashchange', handler);
    }, [open]);

    // Prevent body scroll while menu is open
    useEffect(() => {
        document.body.style.overflow = open ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    // Close on Escape key
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    const close = () => setOpen(false);

    const drawer = (
        <>
            {/* Backdrop – click outside to close */}
            <div
                className={`drawer-backdrop${open ? ' drawer-backdrop--visible' : ''}`}
                onClick={close}
                aria-hidden
            />

            {/* Side panel */}
            <div
                className={`mobile-drawer${open ? ' mobile-drawer--open' : ''}`}
                role="dialog"
                aria-modal="true"
                aria-label="Навигация"
                aria-hidden={!open}
            >
                {/* Close button inside drawer */}
                <button className="drawer-close" aria-label="Закрыть меню" onClick={close}>
                    <span />
                    <span />
                </button>

                <nav className="mobile-nav">
                    {NAV_LINKS.map(({ href, label }) => (
                        <a key={href} href={href} className="mobile-nav-link" onClick={close}>
                            {label}
                        </a>
                    ))}
                </nav>

                <a
                    className="mobile-cta"
                    href={githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={close}
                >
                    GitHub →
                </a>
            </div>
        </>
    );

    return (
        <>
            {/* Hamburger trigger button */}
            <button
                className={`hamburger${open ? ' hamburger--open' : ''}`}
                aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
                aria-expanded={open}
                aria-controls="mobile-drawer"
                onClick={() => setOpen((v) => !v)}
            >
                <span />
                <span />
                <span />
            </button>

            {/* Portal: renders drawer & backdrop directly in <body> */}
            {createPortal(drawer, document.body)}
        </>
    );
}
