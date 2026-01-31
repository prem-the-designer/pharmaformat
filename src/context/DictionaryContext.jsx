import { createContext, useContext, useState, useEffect } from 'react';

const DictionaryContext = createContext();

const DEFAULT_DICTIONARY = {
    "darzalex faspro": { brand: "DARZALEX FASPRO", generic: "Daratumumab and hyaluronidase-fihj" },
    "keytruda": { brand: "KEYTRUDA", generic: "Pembrolizumab" },
    "tecentriq": { brand: "TECENTRIQ", generic: "Atezolizumab" },
    "opdivo": { brand: "OPDIVO", generic: "Nivolumab" }
};

const STORAGE_KEY = 'drug_dictionary_v1';

// Migration Helper
function migrateDictionary(data) {
    const migrated = {};
    if (!data) return DEFAULT_DICTIONARY;

    Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'string') {
            // Migrate string to object
            // Default: Use key as Brand (Uppercased?) and value as Generic (Capitalized?)
            // Or just keep as is. Let's try to infer standard casing if migrating.
            migrated[key.toLowerCase()] = {
                brand: key.toUpperCase(), // Best guess for existing keys
                generic: value.charAt(0).toUpperCase() + value.slice(1)
            };
        } else if (typeof value === 'object' && value.brand && value.generic) {
            // Already migrated format
            migrated[key.toLowerCase()] = {
                brand: value.brand.trim(),
                generic: value.generic.trim()
            };
        }
    });
    return Object.keys(migrated).length > 0 ? migrated : DEFAULT_DICTIONARY;
}

export function DictionaryProvider({ children }) {
    const [dictionary, setDictionary] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const parsed = stored ? JSON.parse(stored) : DEFAULT_DICTIONARY;
            return migrateDictionary(parsed);
        } catch (e) {
            console.error("Failed to load dictionary", e);
            return DEFAULT_DICTIONARY;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dictionary));
    }, [dictionary]);

    const addEntry = (brand, generic) => {
        const key = brand.toLowerCase().trim();
        if (!key || !generic) return;

        setDictionary(prev => ({
            ...prev,
            [key]: {
                brand: brand.trim(), // Store exact display casing
                generic: generic.trim()
            }
        }));
    };

    const removeEntry = (brand) => {
        const key = brand.toLowerCase().trim();
        setDictionary(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const updateEntry = (oldBrand, newBrand, newGeneric) => {
        const oldKey = oldBrand.toLowerCase().trim();
        const newKey = newBrand.toLowerCase().trim();

        if (!newKey || !newGeneric) return;

        setDictionary(prev => {
            const next = { ...prev };
            if (oldKey !== newKey) {
                delete next[oldKey];
            }
            // Update with new display values
            next[newKey] = {
                brand: newBrand.trim(),
                generic: newGeneric.trim()
            };
            return next;
        });
    };

    const resetDictionary = () => {
        setDictionary(DEFAULT_DICTIONARY);
    };

    const importDictionary = (newEntries) => {
        let entriesToMerge = {};

        // Helper to process entry
        const process = (b, g) => {
            if (b && g) {
                entriesToMerge[b.toLowerCase().trim()] = {
                    brand: b.trim(),
                    generic: g.trim()
                };
            }
        };

        if (Array.isArray(newEntries)) {
            newEntries.forEach(item => {
                // Support both [{brand, generic}] and maybe simple strings if any (unlikely from our export)
                process(item.brand, item.generic);
            });
        } else if (typeof newEntries === 'object' && newEntries !== null) {
            Object.entries(newEntries).forEach(([k, v]) => {
                if (typeof v === 'string') {
                    process(k, v);
                } else if (typeof v === 'object' && v.brand && v.generic) {
                    process(v.brand, v.generic);
                }
            });
        }

        if (Object.keys(entriesToMerge).length > 0) {
            setDictionary(prev => ({
                ...prev,
                ...entriesToMerge
            }));
            return Object.keys(entriesToMerge).length;
        }
        return 0;
    };

    const getEntry = (brand) => dictionary[brand.toLowerCase().trim()];

    return (
        <DictionaryContext.Provider value={{ dictionary, addEntry, removeEntry, updateEntry, importDictionary, getEntry, resetDictionary }}>
            {children}
        </DictionaryContext.Provider>
    );
}

export function useDictionary() {
    const context = useContext(DictionaryContext);
    if (!context) {
        throw new Error('useDictionary must be used within a DictionaryProvider');
    }
    return context;
}
