import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { parseExcelFile, validateEnglishImport, validateAliasImport, IMPORT_TYPES } from '../../utils/excelParser';
import { useDictionary } from '../../context/DictionaryContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function ExcelImportModal({ isOpen, onClose, type = IMPORT_TYPES.ENGLISH }) {
    const { dictionary, importDictionary, importAliases } = useDictionary();
    const [step, setStep] = useState('upload'); // upload, preview, processing, done
    const [file, setFile] = useState(null);
    const [stats, setStats] = useState(null); // { valid, errors, warnings }
    const [statusMsg, setStatusMsg] = useState('');

    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;
        setFile(selectedFile);

        try {
            const workbook = await parseExcelFile(selectedFile);
            let validationResult;

            if (type === IMPORT_TYPES.ENGLISH) {
                validationResult = validateEnglishImport(workbook, dictionary);
            } else {
                validationResult = validateAliasImport(workbook, dictionary);
            }

            setStats(validationResult);
            setStep('preview');
        } catch (err) {
            console.error(err);
            setStatusMsg('Failed to parse Excel file. Please ensure it is a valid .xlsx file.');
        }
    };

    const handleCommit = async () => {
        if (!stats || stats.valid.length === 0) return;
        setStep('processing');

        try {
            let count = 0;
            if (type === IMPORT_TYPES.ENGLISH) {
                count = await importDictionary(stats.valid);
            } else {
                count = await importAliases(stats.valid);
            }
            setStatusMsg(`Successfully imported ${count} entries.`);
            setStep('done');
        } catch (err) {
            setStatusMsg('Error importing data. Please check console.');
            setStep('preview'); // Allow retry
        }
    };

    const handleReset = () => {
        setStep('upload');
        setFile(null);
        setStats(null);
        setStatusMsg('');
    };

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const isEnglish = type === IMPORT_TYPES.ENGLISH;
    const title = isEnglish ? 'Import English Dictionary' : 'Import Foreign Aliases';
    const templateName = isEnglish ? 'english_drug_dictionary.xlsx' : 'drug_language_aliases.xlsx';

    const downloadTemplate = () => {
        const wsData = isEnglish
            ? [['brand_name', 'generic_name', 'notes'], ['Keytruda', 'pembrolizumab', 'Example']]
            : [['alias_term', 'language', 'english_brand', 'generic_name', 'notes'], ['키트루다', 'ko', 'Keytruda', 'pembrolizumab', 'Korean Name']];

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, isEnglish ? 'English_Drugs' : 'Language_Aliases');
        XLSX.writeFile(wb, templateName);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                        <p className="text-sm text-slate-500">
                            {step === 'upload' && 'Select an Excel file to begin.'}
                            {step === 'preview' && 'Review validation results before committing.'}
                            {step === 'done' && 'Import complete.'}
                        </p>
                    </div>
                    <button onClick={handleClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {step === 'upload' && (
                        <div className="flex flex-col items-center justify-center space-y-6 py-8">
                            <div className="text-center">
                                <Button variant="secondary" onClick={downloadTemplate} className="mb-4">
                                    Download {isEnglish ? 'English' : 'Foreign'} Template
                                </Button>
                                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                    Use the template to format your data. Only .xlsx files are supported.
                                </p>
                            </div>

                            <div className="w-full max-w-md">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                        <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                        <p className="text-xs text-slate-500">Excel (.xlsx)</p>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx"
                                        className="hidden"
                                        onChange={handleFileSelect}
                                    />
                                </label>
                            </div>
                            {statusMsg && <p className="text-red-500 text-sm font-medium">{statusMsg}</p>}
                        </div>
                    )}

                    {step === 'preview' && stats && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                <StatBox label="Valid Rows" value={stats.valid.length} color="green" />
                                <StatBox label="Warnings" value={stats.warnings.length} color="yellow" />
                                <StatBox label="Errors" value={stats.errors.length} color="red" />
                            </div>

                            {stats.errors.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-bold text-red-600 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Blocking Errors
                                    </h3>
                                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 max-h-40 overflow-y-auto text-sm space-y-1">
                                        {stats.errors.map((e, i) => (
                                            <div key={i} className="text-red-700">Line {e.row}: {e.message}</div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {stats.warnings.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="font-bold text-orange-600 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-orange-500"></span> Warnings
                                    </h3>
                                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 max-h-40 overflow-y-auto text-sm space-y-1">
                                        {stats.warnings.map((e, i) => (
                                            <div key={i} className="text-orange-800">Line {e.row}: {e.message}</div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-blue-800 text-sm font-medium">
                                    Ready to import <span className="font-bold">{stats.valid.length}</span> rows.
                                    {stats.errors.length > 0 && " Rows with errors will be skipped."}
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-600 font-medium">Importing data...</p>
                        </div>
                    )}

                    {step === 'done' && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 text-2xl">
                                ✔
                            </div>
                            <p className="text-lg font-bold text-slate-800 mb-2">Import Successful</p>
                            <p className="text-slate-600">{statusMsg}</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end gap-3">
                    {step === 'done' ? (
                        <Button onClick={handleClose}>Close</Button>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                            {step === 'preview' && (
                                <Button
                                    onClick={handleCommit}
                                    disabled={stats?.valid.length === 0}
                                    variant="primary"
                                >
                                    Confirm Import
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}

function StatBox({ label, value, color }) {
    const colors = {
        green: 'bg-green-50 text-green-700 border-green-200',
        yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        red: 'bg-red-50 text-red-700 border-red-200'
    };
    return (
        <div className={`p-4 rounded-lg border text-center ${colors[color]}`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs uppercase font-semibold opacity-80">{label}</div>
        </div>
    );
}
