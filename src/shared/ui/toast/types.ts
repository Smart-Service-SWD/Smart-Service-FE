export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition = 'top' | 'bottom';

export interface ToastOptions {
    title?: string;
    message: string;
    type?: ToastType;
    duration?: number;
    position?: ToastPosition;
}

export interface ToastContextType {
    show: (options: ToastOptions) => void;
    hide: () => void;
}
