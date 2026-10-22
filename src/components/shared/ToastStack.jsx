import { AnimatePresence, motion } from 'framer-motion';

export function ToastStack({ toasts, onDismiss }) {
  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            className={`toast toast-${toast.type || 'info'}`}
            onClick={() => onDismiss(toast.id)}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.94 }}
            transition={{ duration: 0.22 }}
          >
            <div className="toast-title">{toast.title}</div>
            {toast.message ? <div className="toast-message">{toast.message}</div> : null}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
