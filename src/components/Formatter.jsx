import { useState, useEffect, useRef } from 'react';
import { useDictionary } from '../context/DictionaryContext';
import { formatAndTokenize, TOKEN_TYPES } from '../utils/formatter';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { UnknownDrugPanel } from './ui/UnknownDrugPanel';

export default function Formatter() {
    const { dictionary, addEntry } = useDictionary();
    const [input, setInput] = useState('');
    const [tokens, setTokens] = useState([]);
    const [ignoreList, setIgnoreList] = useState(new Set());
    const [copied, setCopied] = useState(false);

    // Interaction State
    const [activeCandidate, setActiveCandidate] = useState(null); // { text, rect }

    useEffect(() => {
        // Re-run tokenization when input, dict, or ignoreList changes
        const result = formatAndTokenize(input, dictionary, ignoreList);
        setTokens(result);
        // Determine plain text for copy
        // const plainText = result.map(t => t.content).join('');
        // setFormatted(plainText); 
    }, [input, dictionary, ignoreList]);

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
        const containerRect = e.target.closest('.relative').getBoundingClientRect(); // get relative coordinates

        setActiveCandidate({
            text,
            position: {
                top: rect.bottom - containerRect.top, // Relative to container
                left: rect.left - containerRect.left
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
                    onChange={(e) => setInput(e.target.value)}
                    spellCheck="false"
                />
            </Card>

            <Card className="flex flex-col h-full bg-gradient-to-br from-blue-50/50 to-indigo-50/50 backdrop-blur-sm shadow-xl shadow-blue-500/5 border-blue-100/50 relative">
                <div className="p-4 border-b border-blue-100/50 bg-white/30 flex justify-between items-center">
                    <h2 className="font-semibold text-blue-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Formatted Output
                    </h2>
                    <Button variant="primary" onClick={handleCopy} className="text-xs py-1 px-3 shadow-none">
                        {copied ? 'Copied!' : 'Copy Text'}
                    </Button>
                </div>
                <div className="flex-1 w-full p-6 overflow-auto leading-relaxed font-mono text-sm whitespace-pre-wrap relative">
                    {tokens.length === 0 && <span className="text-slate-400 italic">Formatted text will appear here...</span>}

                    {tokens.map((token, idx) => {
                        if (token.type === TOKEN_TYPES.UNKNOWN) {
                            return (
                                <span
                                    key={idx}
                                    className="bg-yellow-100 border-b-2 border-dashed border-yellow-400 cursor-pointer hover:bg-yellow-200 text-slate-800"
                                    onClick={(e) => handleUnknownClick(e, token.content)}
                                    title="Unknown Drug - Click to Add"
                                >
                                    {token.content}
                                </span>
                            );
                        }
                        // KNOWN or TEXT
                        return <span key={idx} className="text-slate-800">{token.content}</span>;
                    })}

                    {activeCandidate && (
                        <UnknownDrugPanel
                            candidate={activeCandidate.text}
                            position={activeCandidate.position}
                            onAdd={handleAddUnknown}
                            onIgnore={handleIgnoreUnknown}
                            onClose={() => setActiveCandidate(null)}
                        />
                    )}
                </div>
            </Card>
        </div>
    );
}
