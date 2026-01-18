'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ModeToggle } from '@/components/mode-toggle';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';

// Page title mappings for each route
const pageTitles: Record<string, string> = {
    '/dashboard': 'Admin Dashboard',
    '/users': 'User Management',
    '/subjects': 'Subjects, Chapters and Topics',
    '/student-groups': 'Student Groups',
    '/questions': 'Question Bank',
    '/questions/create': 'Create Question',
    '/tests': 'Tests Management',
    '/tests/create': 'Create Test',
    '/reports': 'Reports & Analytics',
    '/settings': 'Settings',
    '/profile': 'My Profile',
    '/docs': 'Documentation',
    '/support': 'Help & Support',
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const { labels } = useBreadcrumb();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Get the page title based on the current pathname
    const getPageTitle = () => {
        // Check for exact match first
        if (pageTitles[pathname]) {
            return pageTitles[pathname];
        }

        // Check for custom labels from context (for dynamic routes)
        const pathSegments = pathname.split('/').filter(Boolean);
        const lastSegment = pathSegments[pathSegments.length - 1];

        if (labels[pathname] || labels[lastSegment]) {
            return labels[pathname] || labels[lastSegment];
        }

        // Find the closest matching route (for nested routes like /tests/[id]/submissions)
        const sortedRoutes = Object.keys(pageTitles).sort((a, b) => b.length - a.length);
        for (const route of sortedRoutes) {
            if (pathname.startsWith(route) && route !== '/dashboard') {
                const baseName = pageTitles[route];
                // For dynamic sub-routes, try to get a descriptive title
                if (pathname.includes('/submissions')) {
                    return 'Test Submissions';
                }
                if (pathname.includes('/evaluate')) {
                    return 'Evaluate Submission';
                }
                if (pathname.includes('/take')) {
                    return 'Take Test';
                }
                return baseName;
            }
        }

        // Fallback: capitalize the last segment
        return lastSegment
            ? lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ')
            : 'Dashboard';
    };

    const pageTitle = getPageTitle();

    return (
        <SidebarProvider defaultOpen={true} className="h-svh overflow-hidden">
            <AppSidebar />
            <SidebarInset className="overflow-hidden flex flex-col">
                <header className="flex h-16 w-full shrink-0 items-center gap-2 border-b px-4 bg-background md:rounded-t-xl z-10 transition-all">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <h1 className="text-lg font-semibold">{pageTitle}</h1>
                    <div className="ml-auto">
                        <ModeToggle />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
