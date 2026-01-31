import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Card } from './Card';

export function UnknownDrugPanel({ candidate, position, onAdd, onIgnore, onClose }) {
    const [genericName, setGenericName] = useState('');

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSearch = () => {
        // Open Google search
        const url = `https://www.google.com/search?q=${encodeURIComponent(candidate + ' drug generic name')}`;
        window.open(url, '_blank');
    };

    const handleAdd = () => {
        if (genericName) {
            onAdd(candidate, genericName);
        }
    };

    return (
        <div
            className="absolute z-50 w-72"
            style={{ top: position.top + 24, left: position.left }}
        >
            <Card className="p-4 shadow-xl border-blue-500/30 ring-1 ring-blue-500/20 bg-white">
                <h3 className="font-bold text-slate-800 mb-2">Unknown Drug Detected</h3>
                <div className="text-blue-600 font-mono text-sm mb-3 bg-blue-50 p-2 rounded">{candidate}</div>

                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Enter Generic Name..."
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        autoFocus
                        value={genericName}
                        onChange={(e) => setGenericName(e.target.value)}
                    />

                    <div className="flex gap-2">
                        <Button variant="primary" className="flex-1 text-xs py-1" onClick={handleAdd} disabled={!genericName}>
                            Add
                        </Button>
                        <Button variant="secondary" className="flex-1 text-xs py-1" onClick={handleSearch}>
                            Search
                        </Button>
                    </div>

                    <div className="border-t border-slate-100 pt-2 flex justify-between">
                        <button onClick={() => onIgnore(candidate)} className="text-xs text-slate-400 hover:text-slate-600">
                            Ignore
                        </button>
                        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">
                            Close
                        </button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
