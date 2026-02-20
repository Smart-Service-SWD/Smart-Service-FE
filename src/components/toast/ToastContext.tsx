import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ToastItem from './ToastItem';
import { ToastService } from './ToastService';
import { ToastContextType, ToastOptions } from './types';

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
    const [toast, setToast] = useState<ToastOptions | null>(null);
    const insets = useSafeAreaInsets();
    const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);


    const hide = useCallback(() => {
        setToast(null);
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
        }
    }, []);

    const show = useCallback(
        (options: ToastOptions) => {
            setToast(options);

            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }

            const duration = options.duration || 3000;
            if (duration > 0) {
                hideTimeoutRef.current = setTimeout(() => {
                    hide();
                }, duration);
            }
        },
        [hide]
    );

    useEffect(() => {
        ToastService.setContext({ show, hide });
    }, [show, hide]);

    return (
        <ToastContext.Provider value={{ show, hide }}>
            {children}
            <ToastItem
                toast={toast}
                onHide={hide}
                insets={insets}
            />
        </ToastContext.Provider>
    );
};
