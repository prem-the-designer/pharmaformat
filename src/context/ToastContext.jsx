import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]); // Array of { id, message, type, onUndo }

    const showToast = useCallback((message, typeOrUndo = 'default', undoOrDuration = null, durationArg = null) => {
        let type = 'default';
        let onUndo = null;
        let duration = null;

        // Handle Overloads
        if (typeof typeOrUndo === 'function') {
            // (message, onUndo, duration)
            onUndo = typeOrUndo;
            // Default to 5000 for "default" type (implied)
            duration = 5000;
            if (typeof undoOrDuration === 'number') duration = undoOrDuration;
        } else if (typeof typeOrUndo === 'string') {
            // (message, type, onUndo?, duration?)
            type = typeOrUndo;

            // Set defaults based on type
            if (type === 'success' || type === 'default') {
                duration = 5000;
            } else {
                // error/warning persist by default (duration = null)
                duration = null;
            }

            if (typeof undoOrDuration === 'function') {
                onUndo = undoOrDuration;
                if (typeof durationArg === 'number') duration = durationArg;
            } else if (typeof undoOrDuration === 'number') {
                duration = undoOrDuration;
            }
        }

        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, onUndo }]);

        if (duration) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const hideToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const getToastStyles = (type) => {
        switch (type) {
            case 'success':
                return 'bg-green-600 border-green-500 text-white';
            case 'warning':
                return 'bg-orange-500 border-orange-400 text-white';
            case 'error':
                return 'bg-red-600 border-red-500 text-white';
            default:
                return 'bg-slate-800 border-slate-700 text-white';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`${getToastStyles(toast.type)} pointer-events-auto px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 min-w-[300px] justify-between border shadow-slate-900/10 animate-in slide-in-from-right-full duration-300`}
                    >
                        <span className="text-sm font-medium pr-2">{toast.message}</span>
                        <div className="flex items-center gap-3">
                            {toast.onUndo && (
                                <button
                                    onClick={() => {
                                        toast.onUndo();
                                        hideToast(toast.id);
                                    }}
                                    className="text-white hover:text-white/80 underline decoration-white/30 hover:decoration-white/80 text-sm font-bold uppercase transition-all"
                                >
                                    Undo
                                </button>
                            )}
                            <button
                                onClick={() => hideToast(toast.id)}
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
