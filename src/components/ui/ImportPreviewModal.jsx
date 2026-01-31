import { Modal } from './Modal';
import { Button } from './Button';

export function ImportPreviewModal({ isOpen, stats, onProceed, onCancel }) {
    if (!stats) return null;

    const { newCount, duplicateCount } = stats;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title="Import Summary"
        >
            <div className="space-y-4">
                <p className="text-slate-600">The uploaded document contains:</p>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-700 font-medium">New drugs:</span>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{newCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-700 font-medium">Duplicates:</span>
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">{duplicateCount}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <Button
                        variant="primary"
                        onClick={onProceed}
                        className="w-full justify-center"
                    >
                        {duplicateCount > 0 ? "Proceed anyway" : "Proceed"}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        className="w-full justify-center"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
