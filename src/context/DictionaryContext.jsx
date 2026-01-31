import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from './ToastContext';

const DictionaryContext = createContext();

// Default dictionary for fallback or initial optimistic load
const DEFAULT_DICTIONARY = {};

export function DictionaryProvider({ children }) {
    const [dictionary, setDictionary] = useState(DEFAULT_DICTIONARY);
    const [loading, setLoading] = useState(true);

    const { showToast } = useToast();

    // Initial Load from Supabase
    useEffect(() => {
        async function fetchDictionary() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('dictionary')
                    .select('*');

                if (error) throw error;

                if (data && data.length > 0) {
                    const dict = {};
                    data.forEach(item => {
                        if (item.brand && item.generic) {
                            dict[item.brand.toLowerCase()] = {
                                brand: item.brand,
                                generic: item.generic
                            };
                        }
                    });
                    setDictionary(dict);
                } else {
                    setDictionary({});
                }
            } catch (err) {
                console.error("Error loading dictionary from Supabase:", err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchDictionary();
    }, []);

    const addEntry = async (brand, generic) => {
        if (!brand || !generic) return;

        const key = brand.toLowerCase().trim();

        // Duplicate Check
        if (dictionary[key]) {
            showToast(`Already the ${brand} is added`, 'warning');
            return;
        }

        // Optimistic Update
        const newEntry = { brand: brand.trim(), generic: generic.trim() };

        setDictionary(prev => ({ ...prev, [key]: newEntry }));

        // Show Success Toast
        showToast(`Drug ${brand} is added successfully`, 'success');

        try {
            const { error } = await supabase
                .from('dictionary')
                .upsert({ brand: newEntry.brand, generic: newEntry.generic }, { onConflict: 'brand' });

            if (error) throw error;
        } catch (err) {
            console.error("Error adding entry to Supabase:", err.message);
            showToast(`Failed to add: ${err.message}`, 'error');
            // Rollback optimistic update? 
            // Ideally yes, but for now we log error.
        }
    };

    const removeEntry = async (brand) => {
        const key = brand.toLowerCase().trim();

        // Optimistic Update
        setDictionary(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });

        try {
            const { error } = await supabase
                .from('dictionary')
                .delete()
                .eq('brand', brand);

            if (error) throw error;
        } catch (err) {
            console.error("Error removing entry:", err.message);
        }
    };

    const updateEntry = async (oldBrand, newBrand, newGeneric) => {
        const oldKey = oldBrand.toLowerCase().trim();
        const newKey = newBrand.toLowerCase().trim();

        if (!newKey || !newGeneric) return;

        // Optimistic
        setDictionary(prev => {
            const next = { ...prev };
            if (oldKey !== newKey) delete next[oldKey];
            next[newKey] = { brand: newBrand.trim(), generic: newGeneric.trim() };
            return next;
        });

        try {
            if (oldKey !== newKey) {
                await supabase.from('dictionary').delete().eq('brand', oldBrand);
            }
            await supabase
                .from('dictionary')
                .upsert({ brand: newBrand.trim(), generic: newGeneric.trim() }, { onConflict: 'brand' });

        } catch (err) {
            console.error("Error updating entry:", err.message);
        }
    };

    const resetDictionary = async () => {
        window.location.reload();
    };

    const importDictionary = async (newEntries) => {
        let entriesToInsert = [];

        const process = (b, g) => {
            if (b && g) {
                entriesToInsert.push({ brand: b.trim(), generic: g.trim() });
            }
        };

        if (Array.isArray(newEntries)) {
            newEntries.forEach(item => process(item.brand, item.generic));
        } else if (typeof newEntries === 'object' && newEntries !== null) {
            Object.entries(newEntries).forEach(([k, v]) => {
                if (typeof v === 'string') process(k, v);
                else if (typeof v === 'object') process(v.brand, v.generic);
            });
        }

        if (entriesToInsert.length > 0) {
            // Optimistic Update
            setDictionary(prev => {
                const next = { ...prev };
                entriesToInsert.forEach(item => {
                    next[item.brand.toLowerCase()] = item;
                });
                return next;
            });

            // Batch Insert
            try {
                const { error } = await supabase
                    .from('dictionary')
                    .upsert(entriesToInsert, { onConflict: 'brand' });

                if (error) throw error;
                return entriesToInsert.length;
            } catch (err) {
                console.error("Bulk import error:", err.message);
                return 0;
            }
        }
        return 0;
    };

    const analyzeImport = (newEntries) => {
        let entriesToProcess = [];

        const process = (b, g) => {
            if (b && g) {
                entriesToProcess.push({ brand: b.trim(), generic: g.trim() });
            }
        };

        if (Array.isArray(newEntries)) {
            newEntries.forEach(item => process(item.brand, item.generic));
        } else if (typeof newEntries === 'object' && newEntries !== null) {
            Object.entries(newEntries).forEach(([k, v]) => {
                if (typeof v === 'string') process(k, v);
                else if (typeof v === 'object') process(v.brand, v.generic);
            });
        }

        let newCount = 0;
        let duplicateCount = 0;

        entriesToProcess.forEach(item => {
            if (dictionary[item.brand.toLowerCase().trim()]) {
                duplicateCount++;
            } else {
                newCount++;
            }
        });

        return { newCount, duplicateCount, entries: entriesToProcess };
    };

    const getEntry = (brand) => dictionary[brand.toLowerCase().trim()];

    return (
        <DictionaryContext.Provider value={{ dictionary, addEntry, removeEntry, updateEntry, importDictionary, analyzeImport, getEntry, resetDictionary, loading }}>
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
