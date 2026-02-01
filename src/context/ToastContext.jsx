import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
    const [toast, setToast] = useState(null); // { message, onUndo }

    const showToast = useCallback((message, typeOrUndo = 'default', undoOrDuration = null, durationArg = 5000) => {
        let type = 'default';
        let onUndo = null;
        let duration = 5000;

        // Handle Overloads
        if (typeof typeOrUndo === 'function') {
            // (message, onUndo, duration)
            onUndo = typeOrUndo;
            if (typeof undoOrDuration === 'number') duration = undoOrDuration;
        } else if (typeof typeOrUndo === 'string') {
            // (message, type, onUndo?, duration?)
            type = typeOrUndo;
            if (typeof undoOrDuration === 'function') {
                onUndo = undoOrDuration;
                if (typeof durationArg === 'number') duration = durationArg;
            } else if (typeof undoOrDuration === 'number') {
                duration = undoOrDuration;
            }
        }

        const toastId = Date.now();
        setToast({ message, type, onUndo, id: toastId });

        if (duration) {
            setTimeout(() => {
                setToast(prev => (prev && prev.id === toastId ? null : prev));
            }, duration);
        }
    }, []);

    // Better timeout handling
    useEffect(() => {
        if (!toast) return;
        // We handle timeout in showToast for specific durations, 
        // but this cleanup ensures no stale state if manual override happens? 
        // Actually the capture in showToast is better. 
        // Let's rely on showToast's timeout.
    }, [toast]);

    const hideToast = () => setToast(null);

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
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
                    <div className={`${getToastStyles(toast.type)} px-4 py-3 rounded-lg shadow-lg flex items-center gap-4 min-w-[300px] justify-between border shadow-slate-900/10`}>
                        <span className="text-sm font-medium pr-2">{toast.message}</span>
                        <div className="flex items-center gap-3">
                            {toast.onUndo && (
                                <button
                                    onClick={() => {
                                        toast.onUndo();
                                        hideToast();
                                    }}
                                    className="text-white hover:text-white/80 underline decoration-white/30 hover:decoration-white/80 text-sm font-bold uppercase transition-all"
                                >
                                    Undo
                                </button>
                            )}
                            <button
                                onClick={hideToast}
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
