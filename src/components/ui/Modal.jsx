import { useEffect } from 'react';
import { Card } from './Card';

export function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        const handleEsc = (e) => e.key === 'Escape' && onClose();
        if (isOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-md bg-white shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200 p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                {children}
            </Card>
        </div>
    );
}
