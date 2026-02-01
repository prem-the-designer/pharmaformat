import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from './ToastContext';

const DictionaryContext = createContext();

export function DictionaryProvider({ children }) {
    const [dictionary, setDictionary] = useState(() => {
        const saved = localStorage.getItem('drug_dictionary');
        return saved ? JSON.parse(saved) : {};
    });
    const [aliases, setAliases] = useState([]); // Array of { alias_term, language, english_brand }
    const [loading, setLoading] = useState(true);

    const { showToast } = useToast();

    // Load initial data
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Load Dictionary
                console.log("Fetching from 'dictionary' table...");
                const { data: dictData, error: dictError } = await supabase.from('dictionary').select('*');
                console.log("Dict Data:", dictData);
                console.log("Dict Error:", dictError);
                if (dictError) throw dictError;

                if (dictData) {
                    const dictMap = {};
                    dictData.forEach(item => {
                        if (item.brand) {
                            dictMap[item.brand.toLowerCase()] = {
                                brand: item.brand,
                                generic: item.generic
                            };
                        }
                    });
                    setDictionary(dictMap);
                    localStorage.setItem('drug_dictionary', JSON.stringify(dictMap));
                }

                // Load Aliases
                const { data: aliasData, error: aliasError } = await supabase.from('drug_aliases').select('*');
                if (aliasError) throw aliasError;

                if (aliasData) {
                    setAliases(aliasData);
                }

            } catch (err) {
                console.error("Error loading data:", err.message);
                showToast(`Load Error: ${err.message}`, 'error');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    const importAliases = async (newAliases) => {
        // newAliases: [{ alias_term, language, english_brand, generic_name, notes }]
        try {
            const { data, error } = await supabase
                .from('drug_aliases')
                .upsert(newAliases, { onConflict: 'alias_term, language' }) // Fix 409: Upsert
                .select();

            if (error) throw error;

            if (data) {
                setAliases(prev => [...prev, ...data]);
                return data.length;
            }
            return 0;
        } catch (err) {
            console.error('Alias import error:', err);
            throw err;
        }
    };

    const removeAlias = async (id) => {
        // Optimistic Update
        setAliases(prev => prev.filter(a => a.id !== id));

        try {
            const { error } = await supabase
                .from('drug_aliases')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast('Alias removed successfully', 'success');
        } catch (err) {
            console.error("Error removing alias:", err.message);
            showToast(`Failed to remove alias: ${err.message}`, 'error');
            // Revert state if needed, but for now simple log
        }
    };

    const updateAlias = async (id, updates) => {
        // updates: { alias_term, language, english_brand, generic_name, notes }

        // Optimistic Update
        setAliases(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));

        try {
            const { error } = await supabase
                .from('drug_aliases')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
            showToast('Alias updated successfully', 'success');
        } catch (err) {
            console.error("Error updating alias:", err.message);
            showToast(`Failed to update alias: ${err.message}`, 'error');
        }
    };

    const addEntry = async (brand, generic) => {
        if (!brand || !generic) return;

        const formattedBrand = brand.trim().toUpperCase(); // Strict Uppercase
        const key = formattedBrand.toLowerCase();

        // Duplicate Check
        if (dictionary[key]) {
            showToast(`Already the ${dictionary[key].brand} is added`, 'warning'); // Show existing brand execution
            return;
        }

        // Optimistic Update
        const newEntry = { brand: formattedBrand, generic: generic.trim() };

        setDictionary(prev => ({ ...prev, [key]: newEntry }));

        // Show Success Toast
        showToast(`Drug ${formattedBrand} is added successfully`, 'success');

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
        const formattedNewBrand = newBrand.trim().toUpperCase(); // Strict Uppercase
        const newKey = formattedNewBrand.toLowerCase();

        if (!newKey || !newGeneric) return;

        // Optimistic
        setDictionary(prev => {
            const next = { ...prev };
            if (oldKey !== newKey) delete next[oldKey];
            next[newKey] = { brand: formattedNewBrand, generic: newGeneric.trim() };
            return next;
        });

        try {
            if (oldKey !== newKey) {
                await supabase.from('dictionary').delete().eq('brand', oldBrand);
            }
            await supabase
                .from('dictionary')
                .upsert({ brand: formattedNewBrand, generic: newGeneric.trim() }, { onConflict: 'brand' });

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
                entriesToInsert.push({ brand: b.trim().toUpperCase(), generic: g.trim() }); // Strict Uppercase
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
                entriesToProcess.push({ brand: b.trim().toUpperCase(), generic: g.trim() }); // Strict Uppercase
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
        <DictionaryContext.Provider value={{ dictionary, aliases, addEntry, removeEntry, updateEntry, importDictionary, importAliases, removeAlias, updateAlias, analyzeImport, getEntry, resetDictionary, loading }}>
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
