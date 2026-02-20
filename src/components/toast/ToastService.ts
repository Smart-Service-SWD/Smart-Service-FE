import { ToastContextType, ToastOptions } from './types';

class ToastServiceClass {
    private _toastContext: ToastContextType | null = null;

    setContext(context: ToastContextType) {
        this._toastContext = context;
    }

    show(options: ToastOptions) {
        if (this._toastContext) {
            this._toastContext.show(options);
        } else {
            console.warn('ToastService: Context not set. Wrap your app in <ToastProvider>.', options);
        }
    }

    hide() {
        if (this._toastContext) {
            this._toastContext.hide();
        }
    }
}

export const ToastService = new ToastServiceClass();
