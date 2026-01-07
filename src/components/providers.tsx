'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext';
import { BreadcrumbProvider } from '@/contexts/BreadcrumbContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
                <BreadcrumbProvider>
                    {children}
                    <Toaster richColors position="top-right" />
                </BreadcrumbProvider>
            </AuthProvider>
        </NextThemesProvider>
    );
}
