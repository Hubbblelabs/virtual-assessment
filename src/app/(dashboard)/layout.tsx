'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { ModeToggle } from '@/components/mode-toggle';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';

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

    const pathSegments = pathname.split('/').filter(Boolean);

    const getBreadcrumbItems = () => {
        if (pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard')) {
            return [{ label: 'Dashboard', path: '/dashboard' }];
        }

        const items = [{ label: 'Dashboard', path: '/dashboard' }];
        let currentPath = '';

        pathSegments.forEach((segment, index) => {
            if (segment === 'dashboard') return;

            currentPath += `/${segment}`;

            const customLabel = labels[currentPath] || labels[segment];

            let label = customLabel || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

            const isLast = index === pathSegments.length - 1;

            items.push({
                label: label,
                path: isLast ? '' : currentPath
            });
        });

        return items;
    };

    const breadcrumbs = getBreadcrumbItems();

    return (
        <SidebarProvider defaultOpen={true}>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            {breadcrumbs.map((item, index) => (
                                <div key={index} className="flex items-center">
                                    <BreadcrumbItem className="hidden md:block">
                                        {item.path ? (
                                            <BreadcrumbLink asChild>
                                                <Link href={item.path}>{item.label}</Link>
                                            </BreadcrumbLink>
                                        ) : (
                                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                        )}
                                    </BreadcrumbItem>
                                    {index < breadcrumbs.length - 1 && (
                                        <BreadcrumbSeparator className="hidden md:block mx-2" />
                                    )}
                                </div>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="ml-auto">
                        <ModeToggle />
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
