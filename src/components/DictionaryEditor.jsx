import { useState, useRef, useMemo } from 'react';
import { useDictionary } from '../context/DictionaryContext';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { DictionaryItem } from './DictionaryItem';

export default function DictionaryEditor() {
    const { dictionary, addEntry, removeEntry, importDictionary } = useDictionary();
    const [newBrand, setNewBrand] = useState('');
    const [newGeneric, setNewGeneric] = useState('');
    const [search, setSearch] = useState('');
    const [importStatus, setImportStatus] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fileInputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newBrand && newGeneric) {
            addEntry(newBrand, newGeneric);
            setNewBrand('');
            setNewGeneric('');
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                const count = importDictionary(json);
                setImportStatus(`Successfully imported/merged ${count} entries.`);
                setTimeout(() => setImportStatus(''), 3000);
            } catch (err) {
                setImportStatus('Error: Invalid JSON format.');
                setTimeout(() => setImportStatus(''), 3000);
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    // Filter and Sort entries
    const filteredEntries = useMemo(() => {
        return Object.entries(dictionary)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .filter(([key, value]) =>
                value.brand.toLowerCase().includes(search.toLowerCase()) ||
                value.generic.toLowerCase().includes(search.toLowerCase())
            );
    }, [dictionary, search]);

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

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 max-w-5xl mx-auto">
            {/* Sticky Header Section */}
            <div className="flex-none space-y-4 bg-slate-50 z-10 pb-2">
                <Card className="p-6 bg-white shadow-lg shadow-slate-200/40">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-blue-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Add New Entry
                        </h2>

                        <div className="flex items-center gap-2">
                            {importStatus && <span className={`text-sm ${importStatus.includes('Error') ? 'text-red-500' : 'text-green-600'} font-medium`}>{importStatus}</span>}
                            <input
                                type="file"
                                accept=".json"
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-xs"
                            >
                                Bulk Import (JSON)
                            </Button>
                        </div>
                    </div>

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
                </Card>

                <div className="flex flex-col sm:flex-row justify-between items-center px-2 gap-4">
                    <h2 className="text-xl font-bold text-slate-800">Dictionary ({filteredEntries.length})</h2>
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
                            placeholder="Search entries..."
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
                    paginatedEntries.map(([key, value]) => (
                        <DictionaryItem key={key} brand={value.brand} generic={value.generic} />
                    ))
                ) : (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                        No entries found matching your search.
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
        </div>
    );
}

