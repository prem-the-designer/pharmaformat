import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Card } from './Card';

export function UnknownDrugPanel({ candidate, suggestion, position, dictionary, onAdd, onReplace, onIgnore, onClose }) {
    const [genericName, setGenericName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [forceUppercase, setForceUppercase] = useState(false);

    const panelRef = useRef(null);

    // Close on Escape or Click Outside
    useEffect(() => {
        const handleEsc = (e) => e.key === 'Escape' && onClose();
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEsc);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Search Logic
    useEffect(() => {
        if (!searchQuery || !dictionary) {
            setSearchResults([]);
            return;
        }
        const query = searchQuery.toLowerCase();
        // Filter: match brand or generic
        const matches = Object.values(dictionary)
            .filter(entry =>
                entry.brand.toLowerCase().includes(query) ||
                entry.generic.toLowerCase().includes(query)
            )
            .slice(0, 5); // Limit results
        setSearchResults(matches);
    }, [searchQuery, dictionary]);

    const effectiveCandidate = forceUppercase ? candidate.toUpperCase() : candidate;

    // Check if candidate matches any Brand, Generic, or Formatted "Brand (Generic)"
    const isKnownDrug = dictionary ? Object.values(dictionary).some(entry => {
        const lowerCand = candidate.trim().toLowerCase();
        const brand = entry.brand.toLowerCase();
        const generic = entry.generic.toLowerCase();
        const formatted = `${brand} (${generic})`;

        return lowerCand === brand || lowerCand === generic || lowerCand === formatted;
    }) : false;

    const handleGoogleSearch = () => {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(effectiveCandidate + ' drug')}`, '_blank');
    };

    // Calculate position to keep within viewport
    const PANEL_WIDTH = 320; // w-80
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const leftPos = position.left + PANEL_WIDTH > viewportWidth - 20
        ? Math.max(20, viewportWidth - PANEL_WIDTH - 20)
        : position.left;

    return (
        <div
            ref={panelRef}
            className="fixed z-50 w-80 animate-in fade-in zoom-in-95 duration-200"
            style={{ top: position.top + 8, left: leftPos }}
        >
            <Card className="p-4 shadow-xl border-blue-500/30 ring-1 ring-blue-500/20 bg-white max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800">{isKnownDrug ? 'Drug Detected' : 'Unknown Drug'}</h3>
                    <div className="flex gap-1 items-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setForceUppercase(!forceUppercase);
                            }}
                            className={`p-1 rounded transition-colors ${forceUppercase ? 'text-blue-600 bg-blue-100' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}
                            title="Toggle Capitalize"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                        </button>
                        <button
                            onClick={handleGoogleSearch}
                            className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="Search on Google"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                <div className="text-blue-600 font-mono text-sm mb-4 bg-blue-50 p-2 rounded break-all border border-blue-100">{effectiveCandidate}</div>

                {suggestion && (
                    <div className="mb-4 bg-orange-50 border border-orange-100 rounded-lg p-3">
                        <div className="text-[10px] uppercase font-bold text-orange-400 mb-1 tracking-wider">Did you mean?</div>
                        <button
                            onClick={() => onReplace(forceUppercase ? suggestion.brand.toUpperCase() : suggestion.brand)}
                            className="w-full text-left group"
                        >
                            <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                                {forceUppercase ? suggestion.brand.toUpperCase() : suggestion.brand}
                            </div>
                            <div className="text-xs text-slate-500 capitalize">
                                {suggestion.generic}
                            </div>
                        </button>
                    </div>
                )}

                {/* Search & Replace Section */}
                <div className="mb-4">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">Search Dictionary</div>
                    <input
                        type="text"
                        placeholder="Search existing drug..."
                        className="w-full p-2 text-sm border border-slate-200 rounded mb-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                        <div className="bg-white border border-slate-100 rounded shadow-sm divide-y divide-slate-50">
                            {searchResults.map((res) => (
                                <button
                                    key={res.brand}
                                    className="w-full text-left p-2 hover:bg-blue-50 transition-colors flex flex-col"
                                    onClick={() => onReplace(forceUppercase ? res.brand.toUpperCase() : res.brand)}
                                >
                                    <span className="text-sm font-medium text-slate-700">{forceUppercase ? res.brand.toUpperCase() : res.brand}</span>
                                    <span className="text-xs text-slate-400">{res.generic}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {searchQuery && searchResults.length === 0 && (
                        <div className="text-xs text-slate-400 italic p-1">No matches found.</div>
                    )}
                </div>

                <div className="border-t border-slate-100 pt-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">Or Add New Entry</div>
                    <div className="space-y-3">
                        <input
                            type="text"
                            placeholder="Generic Name..."
                            className="w-full p-2 text-sm border border-slate-200 rounded focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            value={genericName}
                            onChange={(e) => setGenericName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onAdd(effectiveCandidate, genericName)}
                        />
                        <div className="flex gap-2">
                            <Button
                                variant="primary"
                                className="flex-1 text-xs py-1.5"
                                onClick={() => onAdd(effectiveCandidate, genericName)}
                                disabled={!genericName.trim()}
                            >
                                Add "{effectiveCandidate}"
                            </Button>
                            <Button
                                variant="secondary"
                                className="flex-1 text-xs py-1.5"
                                onClick={() => onIgnore(candidate)}
                            >
                                Ignore
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
