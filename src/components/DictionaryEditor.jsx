import { useState, useRef, useMemo } from 'react';
import { useDictionary } from '../context/DictionaryContext';
import { useToast } from '../context/ToastContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { DictionaryItem } from './DictionaryItem';
import { ForeignAliasItem } from './ForeignAliasItem';
import { ConfirmationModal } from './ui/ConfirmationModal';
import { ExcelImportModal } from './ui/ExcelImportModal';
import { Tooltip } from './ui/Tooltip';
import { IMPORT_TYPES } from '../utils/excelParser';

export default function DictionaryEditor() {
    const { dictionary, aliases, addEntry, removeEntry, loading } = useDictionary();
    const { showToast } = useToast();

    const [newBrand, setNewBrand] = useState('');
    const [newGeneric, setNewGeneric] = useState('');
    const [search, setSearch] = useState('');
    const [importStatus, setImportStatus] = useState('');

    // Tab State
    const [activeTab, setActiveTab] = useState('english'); // 'english' | 'foreign'

    // Import State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importType, setImportType] = useState(IMPORT_TYPES.ENGLISH);

    // Deletion State
    const [itemToDelete, setItemToDelete] = useState(null); // { brand, generic } or { alias_term ... }

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // ... handlers ...

    const confirmDelete = () => {
        if (!itemToDelete) return;

        if (activeTab === 'english') {
            const { brand, generic } = itemToDelete;
            removeEntry(brand);
            showToast(`"${brand}" removed`, 'error', () => addEntry(brand, generic));
        } else {
            // TODO: Add removeAlias capability in Context if needed. 
            // For now, maybe just show toast that it's not implemented or implement strict delete.
            showToast("Deleting aliases is not yet supported via UI", 'warning');
        }
        setItemToDelete(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (activeTab === 'english') {
            if (newBrand && newGeneric) {
                addEntry(newBrand, newGeneric);
                setNewBrand('');
                setNewGeneric('');
            }
        } else {
            // Manual Alias Add? Not yet implemented in UI form
            showToast("Please use Import to add aliases for now.", "info");
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                const stats = analyzeImport(json);
                setImportStats(stats);
            } catch (err) {
                setImportStatus('Error: Invalid JSON format.');
                setTimeout(() => setImportStatus(''), 3000);
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const handleImportProceed = async () => {
        if (!importStats || !importStats.entries) return;

        try {
            const count = await importDictionary(importStats.entries);
            setImportStatus(`Successfully imported/merged ${count} entries.`);
            setTimeout(() => setImportStatus(''), 3000);
            setImportStats(null);
        } catch (err) {
            setImportStatus('Error importing entries.');
        }
    };

    // Filter and Sort entries
    const filteredEntries = useMemo(() => {
        if (activeTab === 'english') {
            return Object.entries(dictionary)
                .sort((a, b) => a[0].localeCompare(b[0]))
                .filter(([key, value]) =>
                    value.brand.toLowerCase().includes(search.toLowerCase()) ||
                    value.generic.toLowerCase().includes(search.toLowerCase())
                );
        } else {
            // Foreign Aliases
            // aliases is an array: [{ alias_term, language, english_brand, notes }]
            if (!aliases) return [];
            return aliases
                .filter(a =>
                    a.alias_term.toLowerCase().includes(search.toLowerCase()) ||
                    a.english_brand.toLowerCase().includes(search.toLowerCase())
                )
                .sort((a, b) => a.alias_term.localeCompare(b.alias_term));
        }
    }, [dictionary, aliases, search, activeTab]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
    const paginatedEntries = filteredEntries.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 max-w-5xl mx-auto">
            {/* Sticky Header Section */}
            <div className="flex-none space-y-4 bg-slate-50 z-10 pb-2">

                {/* Tabs */}
                <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-lg w-fit">
                    <button
                        onClick={() => { setActiveTab('english'); setSearch(''); setCurrentPage(1); }}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'english'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        English Dictionary
                    </button>
                    <button
                        onClick={() => { setActiveTab('foreign'); setSearch(''); setCurrentPage(1); }}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'foreign'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Foreign Aliases
                    </button>
                </div>

                <Card className="p-6 bg-white shadow-lg shadow-slate-200/40">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600">
                                {activeTab === 'english'
                                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 18a21.48 21.48 0 018.75-8.8m8.75-8.8c.8.8.8 2.1 0 2.9h-10m4.3-11.8v3.5m-4.3 8.3L3.5 18" />
                                }
                            </svg>
                            {activeTab === 'english' ? 'Add New Entry' : 'Import Foreign Aliases'}
                            {activeTab === 'foreign' && (
                                <div className="flex items-center gap-1 ml-4 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                                    <span className="text-xs font-normal text-slate-500">Language code</span>
                                    <Tooltip content="Supported Languages: ko (Korean), ja (Japanese), zh-cn (Simplified Chinese), zh-tw (Traditional Chinese)">
                                        <svg className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </Tooltip>
                                </div>
                            )}
                        </h2>

                        <div className="flex items-center gap-2">
                            {importStatus && <span className={`text-sm ${importStatus.includes('Error') ? 'text-red-500' : 'text-green-600'} font-medium`}>{importStatus}</span>}

                            {activeTab === 'english' && (
                                <Button
                                    variant="secondary"
                                    className="text-xs flex items-center gap-2"
                                    onClick={() => {
                                        setImportType(IMPORT_TYPES.ENGLISH);
                                        setIsImportModalOpen(true);
                                    }}
                                >
                                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Import English
                                </Button>
                            )}

                            {activeTab === 'foreign' && (
                                <Button
                                    variant="secondary"
                                    className="text-xs flex items-center gap-2"
                                    onClick={() => {
                                        setImportType(IMPORT_TYPES.ALIASES);
                                        setIsImportModalOpen(true);
                                    }}
                                >
                                    <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                                    Import Foreign
                                </Button>
                            )}
                        </div>
                    </div>

                    {activeTab === 'english' ? (
                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
                            <input
                                type="text"
                                placeholder="Brand Name (e.g. Keytruda)"
                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={newBrand}
                                onChange={e => setNewBrand(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Generic Name (e.g. pembrolizumab)"
                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                value={newGeneric}
                                onChange={e => setNewGeneric(e.target.value)}
                            />
                            <Button type="submit" variant="primary" disabled={!newBrand || !newGeneric}>
                                Add Entry
                            </Button>
                        </form>
                    ) : (
                        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-500 flex items-center justify-between">
                            <span>Manually adding aliases is coming soon. Please use the Import button.</span>
                        </div>
                    )}
                </Card>

                <div className="flex flex-col sm:flex-row justify-between items-center px-2 gap-4">
                    <h2 className="text-xl font-bold text-slate-800">
                        {activeTab === 'english' ? 'Dictionary' : 'Foreign Aliases'} ({filteredEntries.length})
                    </h2>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <select
                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1); // Reset to page 1 on size change
                            }}
                        >
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={30}>30 per page</option>
                            <option value={50}>50 per page</option>
                        </select>
                        <input
                            type="text"
                            placeholder={activeTab === 'english' ? "Search entries..." : "Search aliases..."}
                            className="flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1); // Reset to page 1 on search
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Scrollable List Section */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {paginatedEntries.length > 0 ? (
                    paginatedEntries.map((item, index) => {
                        if (activeTab === 'english') {
                            const [key, value] = item;
                            return (
                                <DictionaryItem
                                    key={key}
                                    brand={value.brand}
                                    generic={value.generic}
                                    onRemove={() => setItemToDelete({ brand: value.brand, generic: value.generic })}
                                />
                            );
                        } else {
                            // Foreign Item
                            return (
                                <ForeignAliasItem key={item.id || index} alias={item} />
                            );
                        }
                    })
                ) : (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                        No {activeTab === 'english' ? 'entries' : 'aliases'} found.
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 py-2 flex-none bg-slate-50 pt-2 border-t border-slate-200">
                    <Button
                        variant="secondary"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="text-xs px-3 py-1"
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-slate-600 font-medium">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="secondary"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="text-xs px-3 py-1"
                    >
                        Next
                    </Button>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!itemToDelete}
                title="Remove Entry?"
                message={`Are you sure want to remove the drug "${itemToDelete?.brand}" from the dictionary?`}
                confirmText="Remove"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setItemToDelete(null)}
            />

            <ExcelImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                type={importType}
            />
        </div>
    );
}
