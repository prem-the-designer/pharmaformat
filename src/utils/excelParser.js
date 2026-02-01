import * as XLSX from 'xlsx';

export const IMPORT_TYPES = {
    ENGLISH: 'english',
    ALIASES: 'aliases'
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
            warnings.push({ row: rowNum, message: `Brand "${brand}" already exists. Will allow update.` });
            // We allow updates/overwrites in this logic, or we could skip. Requirements say "Skip duplicate brand names".
            // Prompt says: "Skip duplicate brand names".
            // Let's mark as skipped in this logic or warn? "Block rows" vs "Skip duplicates".
            // Let's warn and NOT add to valid if we want to skip strictly. 
            // Re-reading: "Skip duplicate brand names". -> So we shouldn't add them to 'valid'.
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
