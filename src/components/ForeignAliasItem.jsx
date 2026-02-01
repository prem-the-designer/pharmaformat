import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useDictionary } from '../context/DictionaryContext';

export function ForeignAliasItem({ alias }) {
    const { removeAlias, updateAlias } = useDictionary();

    const [isEditing, setIsEditing] = useState(false);

    // Edit State
    const [editTerm, setEditTerm] = useState(alias.alias_term);
    const [editEnglish, setEditEnglish] = useState(alias.english_brand);
    const [editGeneric, setEditGeneric] = useState(alias.generic_name || '');
    const [editLanguage, setEditLanguage] = useState(alias.language);

    const handleSave = () => {
        if (editTerm && editEnglish) {
            updateAlias(alias.id, {
                alias_term: editTerm,
                english_brand: editEnglish.toUpperCase().trim(),
                generic_name: editGeneric.trim(),
                language: editLanguage
            });
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditTerm(alias.alias_term);
        setEditEnglish(alias.english_brand);
        setEditGeneric(alias.generic_name || '');
        setEditLanguage(alias.language);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <Card className="flex flex-col gap-3 p-4 shadow-md bg-blue-50/50 border-blue-200">
                {/* Row 1: Term & Language */}
                <div className="flex gap-2">
                    <input
                        className="flex-[2] px-2 py-1 bg-white border border-blue-200 rounded text-sm font-bold text-slate-800"
                        value={editTerm}
                        onChange={(e) => setEditTerm(e.target.value)}
                        placeholder="Foreign Alias"
                        autoFocus
                    />
                    <select
                        className="flex-1 px-2 py-1 bg-white border border-blue-200 rounded text-sm text-slate-600"
                        value={editLanguage}
                        onChange={(e) => setEditLanguage(e.target.value)}
                    >
                        <option value="ko">Korean (ko)</option>
                        <option value="ja">Japanese (ja)</option>
                        <option value="zh-cn">Chinese Simp (zh-cn)</option>
                        <option value="zh-tw">Chinese Trad (zh-tw)</option>
                    </select>
                </div>

                {/* Row 2: English Brand & Generic */}
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <input
                            className="w-full px-2 py-1 pr-8 bg-white border border-blue-200 rounded text-sm font-semibold text-slate-700 placeholder:text-slate-400"
                            value={editEnglish}
                            onChange={(e) => setEditEnglish(e.target.value)}
                            placeholder="English Brand (Link)"
                        />
                        <button
                            onClick={() => setEditEnglish(editEnglish.toUpperCase())}
                            className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 p-0.5 rounded"
                            title="Capitalize"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        </button>
                    </div>
                    <input
                        className="flex-1 px-2 py-1 bg-white border border-blue-200 rounded text-sm text-slate-600 placeholder:text-slate-400"
                        value={editGeneric}
                        onChange={(e) => setEditGeneric(e.target.value)}
                        placeholder="Generic Name (Optional)"
                    />
                </div>

                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="primary" onClick={handleSave} className="text-xs py-1 px-3">
                        Save
                    </Button>
                    <Button variant="secondary" onClick={handleCancel} className="text-xs py-1 px-3">
                        Cancel
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col sm:flex-row justify-between items-center p-4 hover:shadow-md transition-shadow group shrink-0 bg-white">
            <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left mb-3 sm:mb-0">
                <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
                    <span className={`fi fi-${alias.language === 'en' ? 'us' : alias.language === 'ko' ? 'kr' : alias.language === 'ja' ? 'jp' : 'cn'} rounded shadow-sm opacity-80`} />
                    <h3 className="font-bold text-slate-800 text-lg">{alias.alias_term}</h3>
                </div>

                <div className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">{alias.english_brand}</span>
                    {alias.generic_name && (
                        <span className="text-slate-500 italic ml-1">({alias.generic_name})</span>
                    )}
                </div>
                <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">{alias.language}</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    variant="secondary"
                    className="text-xs py-1.5"
                    onClick={() => setIsEditing(true)}
                >
                    Edit
                </Button>
                <Button
                    variant="danger"
                    className="text-xs py-1.5 bg-red-50 hover:bg-red-100 text-red-600 shadow-none border border-transparent hover:border-red-200"
                    onClick={() => removeAlias(alias.id)}
                >
                    Remove
                </Button>
            </div>
        </Card>
    );
}
