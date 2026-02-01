import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useDictionary } from '../context/DictionaryContext';
import { formatAndTokenize, TOKEN_TYPES, findSuggestion } from '../utils/formatter';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { UnknownDrugPanel } from './ui/UnknownDrugPanel';

export default function Formatter() {
    const { dictionary, aliases, addEntry } = useDictionary(); // Get aliases
    const [input, setInput] = useState('');
    const [tokens, setTokens] = useState([]);
    const [ignoreList, setIgnoreList] = useState(new Set());
    const [copied, setCopied] = useState(false);

    // Interaction State
    const [activeCandidate, setActiveCandidate] = useState(null); // { text, rect }
    const outputRef = useRef(null);

    useEffect(() => {
        // Re-run tokenization when input, dict, aliases or ignoreList changes
        const result = formatAndTokenize(input, dictionary, ignoreList, aliases); // Pass aliases
        setTokens(result);
    }, [input, dictionary, ignoreList, aliases]);

    const handleCopy = async () => {
        const plainText = tokens.map(t => t.content).join('');
        if (!plainText) return;

        try {
            await navigator.clipboard.writeText(plainText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy info: ', err);
        }
    };

    const handleUnknownClick = (e, text) => {
        const rect = e.target.getBoundingClientRect();

        setActiveCandidate({
            text,
            suggestion: e.target.dataset.suggestion ? JSON.parse(e.target.dataset.suggestion) : null,
            position: {
                top: rect.bottom, // Viewport coordinates for fixed
                left: rect.left
            }
        });
    };

    const handleAddUnknown = (brand, generic) => {
        addEntry(brand, generic);
        setActiveCandidate(null);
    };

    const handleIgnoreUnknown = (brand) => {
        setIgnoreList(prev => new Set(prev).add(brand.toLowerCase()));
        setActiveCandidate(null);
    };

    const handleManualHighlight = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const text = selection.toString().trim();
        if (!text) return;

        // Get Position
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Check for suggestion
        const suggestion = findSuggestion(text, dictionary);

        setActiveCandidate({
            text,
            suggestion,
            position: { top: rect.bottom, left: rect.left } // Viewport coords
        });
    };

    const handleReplace = (newBrand) => {
        // Replace all instances of the typo with the correct brand
        // We use a safe regex replacement
        const escapeRegExp = (curr) => curr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedCurrent = escapeRegExp(activeCandidate.text);
        const regex = new RegExp(`\\b${escapedCurrent}\\b`, 'g');

        setInput(prev => prev.replace(regex, newBrand));
        setActiveCandidate(null);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
            <Card className="flex flex-col h-full bg-white/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 border-white/60">
                <div className="p-4 border-b border-slate-100 bg-white/40 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Input Text
                    </h2>
                    <span className="text-xs text-slate-400">Paste your text below</span>
                </div>
                <textarea
                    className="flex-1 w-full p-6 bg-transparent resize-none focus:outline-none focus:bg-white/30 transition-colors text-slate-700 leading-relaxed font-mono text-sm placeholder:text-slate-300"
                    placeholder="Paste medical text here... e.g., 'Darzalex Faspro-based treatment approved...'"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setActiveCandidate(null); // Close panel on any text change
                    }}
                    spellCheck="false"
                />
            </Card>

            <Card className="flex flex-col h-full bg-gradient-to-br from-blue-50/50 to-indigo-50/50 backdrop-blur-sm shadow-xl shadow-blue-500/5 border-blue-100/50 relative">
                <div className="p-4 border-b border-blue-100/50 bg-white/30 flex justify-between items-center">
                    <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Formatted Output
                    </h2>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={handleManualHighlight}
                            className="text-xs py-1 px-3 shadow-none flex items-center gap-1 border border-blue-200 bg-white"
                            title="Highlight selected text to add/correct"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Highlight
                        </Button>
                        <Button variant="primary" onClick={handleCopy} className="text-xs py-1 px-3 shadow-none">
                            {copied ? 'Copied!' : 'Copy Text'}
                        </Button>
                    </div>
                </div>
                <div
                    ref={outputRef}
                    className="flex-1 w-full p-6 overflow-y-auto overflow-x-hidden leading-relaxed font-mono text-sm whitespace-pre-wrap relative"
                    onScroll={() => setActiveCandidate(null)} // Close popup on scroll
                >
                    {tokens.length === 0 && <span className="text-slate-400 italic">Formatted text will appear here...</span>}

                    {tokens.map((token, idx) => {
                        if (token.type === TOKEN_TYPES.UNKNOWN) {
                            return (
                                <span
                                    key={idx}
                                    className={`border-b-2 border-dashed cursor-pointer text-slate-800 ${token.data?.suggestion ? 'bg-orange-50 border-orange-300 hover:bg-orange-100' : 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200'}`}
                                    onClick={(e) => handleUnknownClick(e, token.content)}
                                    title={token.data?.suggestion ? "Possible Typo" : "Unknown Drug"}
                                    data-suggestion={token.data?.suggestion ? JSON.stringify(token.data.suggestion) : ''}
                                >
                                    {token.content}
                                </span>
                            );
                        }
                        // KNOWN or TEXT
                        return <span key={idx} className="text-slate-800">{token.content}</span>;
                    })}

                    {activeCandidate && createPortal(
                        <UnknownDrugPanel
                            candidate={activeCandidate.text}
                            suggestion={activeCandidate.suggestion}
                            position={activeCandidate.position}
                            dictionary={dictionary}
                            onAdd={handleAddUnknown}
                            onReplace={handleReplace}
                            onIgnore={handleIgnoreUnknown}
                            onClose={() => setActiveCandidate(null)}
                        />,
                        document.body
                    )}
                </div>
            </Card>
        </div>
    );
}
