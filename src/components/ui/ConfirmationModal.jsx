import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmationModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title={title}
        >
            <p className="text-slate-600 mb-6">
                {message}
            </p>
            <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={onCancel}>
                    {cancelText}
                </Button>
                <Button variant="danger" onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white border-transparent">
                    {confirmText}
                </Button>
            </div>
        </Modal>
    );
}
