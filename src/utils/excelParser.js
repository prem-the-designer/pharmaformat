import * as XLSX from 'xlsx';
import { formatAndTokenize } from './formatter';

export const IMPORT_TYPES = {
    ENGLISH: 'english',
    ALIASES: 'aliases',
    BULK_FORMAT: 'bulk_format'
};

export const ALLOWED_LANGUAGES = ['ko', 'ja', 'zh-cn', 'zh-tw'];

export const parseExcelFile = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                resolve(workbook);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsArrayBuffer(file);
    });
};

export const validateEnglishImport = (workbook, currentDictionary) => {
    const sheetName = workbook.SheetNames[0]; // Default to first sheet
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const valid = [];
    const errors = [];
    const warnings = [];

    // Helper to normalize keys
    const normalize = (str) => str?.toString().trim();
    const normalizeBrand = (str) => str?.toString().trim().toUpperCase();

    rows.forEach((row, index) => {
        const rowNum = index + 2; // Excel row number (1-based, +1 header)
        const brand = normalizeBrand(row['brand_name']);
        const generic = normalize(row['generic_name']);
        const notes = normalize(row['notes']);

        if (!brand || !generic) {
            errors.push({ row: rowNum, message: 'Missing "brand_name" or "generic_name".' });
            return;
        }

        // Duplicate Check (Case-insensitive)
        const lowerBrand = brand.toLowerCase();
        if (currentDictionary[lowerBrand]) {
            warnings.push({ row: rowNum, message: `Skipping duplicate brand "${brand}".` });
            return;
        }

        valid.push({ brand, generic, notes });
    });

    return { valid, errors, warnings };
};

export const validateAliasImport = (workbook, currentDictionary) => {
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const valid = [];
    const errors = [];
    const warnings = [];

    const normalize = (str) => str?.toString().trim();
    const normalizeLower = (str) => str?.toString().trim().toLowerCase();
    const normalizeBrand = (str) => str?.toString().trim().toUpperCase();

    // Track local duplicates within the file
    const fileDuplicates = new Set();

    rows.forEach((row, index) => {
        const rowNum = index + 2;
        const alias = normalize(row['alias_term']);
        const lang = normalizeLower(row['language']); // strict lower check
        const englishBrand = normalizeBrand(row['english_brand']); // Strict Uppercase
        const notes = normalize(row['notes']);

        // 1. Check Missing Fields
        if (!alias) {
            errors.push({ row: rowNum, message: 'Missing "alias_term".' });
            return;
        }
        if (!lang) {
            errors.push({ row: rowNum, message: 'Missing "language".' });
            return;
        }
        if (!englishBrand) {
            errors.push({ row: rowNum, message: 'Missing "english_brand".' });
            return;
        }

        // 2. Validate Language Code
        if (!ALLOWED_LANGUAGES.includes(lang)) {
            errors.push({ row: rowNum, message: `Invalid language "${lang}". Allowed: ${ALLOWED_LANGUAGES.join(', ')}.` });
            return;
        }

        // 3. Validate English Brand Existence
        const brandKey = englishBrand.toLowerCase();
        if (!currentDictionary[brandKey]) {
            warnings.push({ row: rowNum, message: `Linked brand "${englishBrand}" not found in dictionary.` });
            // Req: "Warn check if english_brand does not exist (allow linking later)". So we ADD to valid.
        }

        // 4. Duplicate Check (Alias + Lang)
        const uniqueKey = `${alias}|${lang}`;
        if (fileDuplicates.has(uniqueKey)) {
            warnings.push({ row: rowNum, message: `Skipping duplicate alias in file "${alias}" (${lang}).` });
            return;
        }
        fileDuplicates.add(uniqueKey);

        const generic = normalize(row['generic_name']); // Caputre optional generic name

        valid.push({ alias_term: alias, language: lang, english_brand: englishBrand, generic_name: generic, notes });
    });

    return { valid, errors, warnings };
};

export const validateBulkFormat = (workbook) => {
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const valid = [];
    const errors = [];
    const warnings = [];

    // Check headers
    if (rows.length === 0) {
        errors.push({ row: 1, message: 'File is empty.' });
        return { valid, errors, warnings };
    }

    const firstRow = rows[0];
    const keys = Object.keys(firstRow).map(k => k.toLowerCase());

    // We check for presence of at least one target column
    if (!keys.includes('headline') && !keys.includes('summary')) {
        errors.push({ row: 1, message: 'Missing "headline" or "summary" column.' });
    }

    rows.forEach((row, index) => {
        // Just checking if we have content to format
        valid.push(row);
    });

    return { valid, errors, warnings };
};

// --- Formatter Integration ---

// We need a helper to run the "formatAndTokenize" logic in a pure JS way (without React state)
// But formatAndTokenize is in utils/formatter.js and is pure.

export const processExcelForFormatting = (workbook, dictionary, aliases) => {
    // We'll process the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get headers to find columns
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const headers = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
        headers.push(cell ? cell.v.toString().trim().toLowerCase() : '');
    }

    const colHeadline = headers.indexOf('headline');
    const colSummary = headers.indexOf('summary');

    if (colHeadline === -1 && colSummary === -1) {
        throw new Error('Could not find "headline" or "summary" columns in the first row.');
    }

    const rows = XLSX.utils.sheet_to_json(sheet);

    // Process rows
    const processedRows = rows.map(row => {
        const newRow = { ...row };

        if (colHeadline !== -1 && row['headline']) {
            const tokens = formatAndTokenize(row['headline'], dictionary, new Set(), aliases);
            newRow['formatted_headline'] = tokens.map(t => t.content).join('');
        }

        if (colSummary !== -1 && row['summary']) {
            const tokens = formatAndTokenize(row['summary'], dictionary, new Set(), aliases);
            newRow['formatted_summary'] = tokens.map(t => t.content).join('');
        }

        return newRow;
    });

    // Create new sheet
    const newSheet = XLSX.utils.json_to_sheet(processedRows);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Formatted");

    return newWorkbook;
};
