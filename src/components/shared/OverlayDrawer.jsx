import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function OverlayDrawer({
    open,
    onClose,
    title,
    side = 'right',
    width = 380,
    children,
    headerActions,
}) {
    const drawerRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    const slideFrom = side === 'right' ? '100%' : '-100%';

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="drawer-backdrop"
                        onClick={onClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    />

                    {/* Drawer panel */}
                    <motion.div
                        ref={drawerRef}
                        className={`overlay-drawer ${side}`}
                        style={{ width }}
                        initial={{ x: slideFrom }}
                        animate={{ x: '0%' }}
                        exit={{ x: slideFrom }}
                        transition={{
                            type: 'tween',
                            ease: [0.4, 0, 0.2, 1],
                            duration: 0.28,
                        }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="drawer-header">
                            <h2 className="drawer-title">{title}</h2>
                            <div className="drawer-actions">
                                {headerActions}
                                <button className="drawer-close-btn" onClick={onClose} aria-label="Close panel">
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="drawer-content">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
