import { Injectable, signal } from '@angular/core';

export interface Toast {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
}

export interface ConfirmDialog {
    id: string;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    toasts = signal<Toast[]>([]);
    confirmDialog = signal<ConfirmDialog | null>(null);

    show(type: 'success' | 'error' | 'info' | 'warning', message: string, durationMs = 5000) {
        const id = crypto.randomUUID();
        this.toasts.update(t => [...t, { id, type, message }]);
        setTimeout(() => this.remove(id), durationMs);
    }

    success(message: string, durationMs = 5000) { this.show('success', message, durationMs); }
    error(message: string, durationMs = 5000) { this.show('error', message, durationMs); }
    info(message: string, durationMs = 5000) { this.show('info', message, durationMs); }
    warning(message: string, durationMs = 5000) { this.show('warning', message, durationMs); }

    remove(id: string) {
        this.toasts.update(t => t.filter(toast => toast.id !== id));
    }

    confirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void) {
        this.confirmDialog.set({ id: crypto.randomUUID(), title, message, onConfirm, onCancel });
    }

    resolveConfirm() {
        const dialog = this.confirmDialog();
        if (dialog) {
            dialog.onConfirm();
            this.confirmDialog.set(null);
        }
    }

    rejectConfirm() {
        const dialog = this.confirmDialog();
        if (dialog) {
            if (dialog.onCancel) {
                dialog.onCancel();
            }
            this.confirmDialog.set(null);
        }
    }
}
