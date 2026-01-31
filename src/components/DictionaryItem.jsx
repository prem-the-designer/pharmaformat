import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useDictionary } from '../context/DictionaryContext';

export function DictionaryItem({ brand, generic }) {
    const { updateEntry, removeEntry } = useDictionary();
    const [isEditing, setIsEditing] = useState(false);
    const [editBrand, setEditBrand] = useState(brand);
    const [editGeneric, setEditGeneric] = useState(generic);

    const handleSave = () => {
        if (editBrand && editGeneric) {
            updateEntry(brand, editBrand, editGeneric);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditBrand(brand);
        setEditGeneric(generic);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <Card className="flex flex-col sm:flex-row justify-between items-center p-4 shadow-md bg-blue-50/50 border-blue-200">
                <div className="flex-1 w-full flex gap-2">
                    <input
                        className="flex-1 px-2 py-1 bg-white border border-blue-200 rounded text-sm font-bold text-slate-800 uppercase"
                        value={editBrand}
                        onChange={(e) => setEditBrand(e.target.value)}
                        placeholder="Brand"
                        autoFocus
                    />
                    <input
                        className="flex-1 px-2 py-1 bg-white border border-blue-200 rounded text-sm text-slate-600"
                        value={editGeneric}
                        onChange={(e) => setEditGeneric(e.target.value)}
                        placeholder="Generic"
                    />
                </div>
                <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:ml-4 w-full sm:w-auto justify-end">
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
        <Card className="flex flex-col sm:flex-row justify-between items-center p-4 hover:shadow-md transition-shadow group shrink-0">
            <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left mb-3 sm:mb-0">
                <div className="font-bold text-slate-800 text-lg uppercase tracking-wide">{brand}</div>
                <div className="text-slate-500 text-sm font-medium">{generic.charAt(0).toUpperCase() + generic.slice(1)}</div>
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
                    onClick={() => removeEntry(brand)}
                >
                    Remove
                </Button>
            </div>
        </Card>
    );
}
