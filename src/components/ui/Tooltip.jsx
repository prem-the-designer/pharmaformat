import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Tooltip({ content, children }) {
    const [isVisible, setIsVisible] = useState(false);
    const triggerRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (isVisible && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.top + window.scrollY - 10, // Just above
                left: rect.left + window.scrollX + (rect.width / 2)
            });
        }
    }, [isVisible]);

    return (
        <div
            className="relative inline-flex items-center"
            ref={triggerRef}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <div className="cursor-help">
                {children}
            </div>

            {isVisible && createPortal(
                <div
                    className="fixed z-[9999] px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl whitespace-pre-line w-64 text-center leading-relaxed pointer-events-none animate-in fade-in zoom-in duration-200"
                    style={{
                        top: position.top,
                        left: position.left,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    {content}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>,
                document.body
            )}
        </div>
    );
}
