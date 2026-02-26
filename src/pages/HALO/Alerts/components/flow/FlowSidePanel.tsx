import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

interface FlowSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    width?: number;
}

const FlowSidePanel = ({
    isOpen,
    onClose,
    title,
    icon,
    children,
    width = 500,
}: FlowSidePanelProps) => {
    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const panelContent = (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.35)',
                    backdropFilter: 'blur(2px)',
                    zIndex: 99998,
                    opacity: isOpen ? 1 : 0,
                    pointerEvents: isOpen ? 'auto' : 'none',
                    transition: 'opacity 0.25s ease',
                }}
            />

            {/* Panel */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: width,
                    maxWidth: '95vw',
                    background: 'var(--bs-body-bg, #fff)',
                    boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
                    zIndex: 99999,
                    display: 'flex',
                    flexDirection: 'column',
                    transform: isOpen ? 'translateX(0)' : `translateX(${width + 40}px)`,
                    transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1rem 1.5rem',
                        borderBottom: '1px solid var(--bs-border-color, #dee2e6)',
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600, fontSize: '1rem' }}>
                        {icon}
                        {title}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--bs-secondary, #6c757d)',
                            fontSize: '1.2rem',
                            lineHeight: 1,
                        }}
                        aria-label='Close panel'
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1.5rem',
                    }}
                >
                    {children}
                </div>
            </div>
        </>
    );

    // Render into document.body via Portal — completely outside ReactFlow's DOM
    return ReactDOM.createPortal(panelContent, document.body);
};

export default FlowSidePanel;
