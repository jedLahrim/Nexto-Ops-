'use client';

import {useAuth} from '@/hooks/use-auth';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertTriangle,
    BarChart3,
    BookOpen,
    Building2,
    CalendarCog,
    ChevronDown,
    FileBarChart,
    FileText,
    GitPullRequest,
    Handshake,
    KeyRound,
    Layers,
    LayoutDashboard,
    LogOut,
    Package,
    ScrollText,
    Server,
    ServerCog,
    ShieldAlert,
    ShieldCheck,
    ShoppingCart,
    TriangleAlert,
    Users,
    Wallet,
} from 'lucide-react';
import {ReactNode, useState} from 'react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {cn} from '@/lib/utils';
import {Avatar, AvatarFallback} from '@/components/ui/avatar';
import {UserType} from "@/services/auth.service";
import Image from "next/image";
import logo from "@/assets/logo.png";

const NAV: Array<{
    to: string;
    label: string;
    icon: any;
    end?: boolean;
    module: string;
    always?: boolean;
}> = [
    {to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true, module: 'dashboard', always: true},
    {to: '/org', label: 'Departments & rooms', icon: Building2, module: 'org'},
    {to: '/inventory', label: 'Inventory', icon: Server, module: 'inventory'},
    {to: '/incidents', label: 'Incidents', icon: AlertTriangle, module: 'incidents'},
    {to: '/problems', label: 'Problems', icon: Layers, module: 'problems'},
    {to: '/changes', label: 'Changes', icon: GitPullRequest, module: 'changes'},
    {to: '/stock', label: 'Stock', icon: Package, module: 'stock'},
    {to: '/maintenance', label: 'Maintenance', icon: CalendarCog, module: 'maintenance'},
    {to: '/vendors', label: 'Vendors', icon: Handshake, module: 'vendors'},
    {to: '/procurement', label: 'Procurement', icon: ShoppingCart, module: 'procurement'},
    {to: '/contracts', label: 'Contracts', icon: FileText, module: 'contracts'},
    {to: '/licenses', label: 'Licenses', icon: KeyRound, module: 'licenses'},
    {to: '/risks', label: 'Risks', icon: ShieldAlert, module: 'risks'},
    {to: '/budget', label: 'Budget', icon: Wallet, module: 'budget'},
    {to: '/reports', label: 'Reports', icon: FileBarChart, module: 'reports'},
    {to: '/powerbi', label: 'Power BI', icon: BarChart3, module: 'powerbi'},
    {to: '/docs', label: 'Docs', icon: BookOpen, module: 'docs'},
    {to: '/users', label: 'Users', icon: Users, module: 'users'},
    {to: '/permissions', label: 'Permission sets', icon: ShieldCheck, module: 'users'},
    {to: '/audit', label: 'Audit log', icon: ScrollText, module: 'audit'},
];

export default function ErpLayout({children}: { children: ReactNode }) {
    const {user, signOut, isLoading} = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [reportOpen, setReportOpen] = useState(false);

    const isAdmin = user?.type === UserType.SUPER_USER;

    const visibleNav = NAV.filter(
        (item) => isAdmin || item.always === true
    );

    const currentRoute = NAV.find(
        (item) => pathname === item.to || (item.end !== true && pathname.startsWith(item.to + '/'))
    );

    const routeAllowed =
        isAdmin || !currentRoute || currentRoute.always === true;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-pulse text-muted-foreground">Loading...</div>
            </div>
        );
    }

    // Next.js: Optional manual redirect to auth if no user is found
    // (Could also be handled via middleware)
    if (!user) {
        if (typeof window !== 'undefined') {
            window.location.href = '/auth';
        }
        return null;
    }

    const initials = (user?.fullName || user?.email || 'IT')
        .split(/[\s@.]+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="flex">
                {/* Sidebar */}
                <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-sidebar md:flex">
                    <div className="flex h-16 items-center gap-2.5 border-b px-5">
                        <div className="flex size-9 items-center justify-center rounded-md">
                            <Image src={logo} alt="NextoOps" width={32} height={32} className="rounded"/>
                        </div>
                        <div className="leading-tight">
                            <p className="text-sm font-semibold tracking-tight">NextoOps</p>
                            <p className="text-[11px] text-muted-foreground">IT Management ERP</p>
                        </div>
                    </div>
                    <div className="border-b p-3">
                        <Button
                            variant="outline"
                            className="w-full gap-2 border-amber-500/60 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40"
                            onClick={() => setReportOpen(true)}
                        >
                            <TriangleAlert className="size-4"/> Report an issue
                        </Button>
                    </div>
                    <nav className="flex-1 space-y-1 overflow-y-auto p-3">
                        {visibleNav.map((item) => {
                            const isActive = pathname === item.to || (item.end !== true && pathname.startsWith(item.to + '/'));
                            return (
                                <Link
                                    key={item.to}
                                    href={item.to}
                                    className={cn(
                                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors',
                                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                                        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_0_var(--sidebar-primary)]'
                                    )}
                                >
                                    <item.icon className="size-4"/>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="border-t p-3 text-[11px] leading-relaxed text-muted-foreground">
                        {isAdmin
                            ? 'You have full administrator access. Every action is audit-logged.'
                            : 'You see the modules your administrator granted. Every action is audit-logged.'}
                    </div>
                </aside>

                {/* Topbar */}
                <div className="flex min-h-screen flex-1 flex-col md:pl-60">
                    <header
                        className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
                        <div className="flex items-center gap-1 md:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <ServerCog className="size-4"/> Menu
                                        <ChevronDown className="size-3.5"/>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48">
                                    <DropdownMenuItem onClick={() => setReportOpen(true)}
                                                      className="text-amber-700 focus:text-amber-700 dark:text-amber-400">
                                        <TriangleAlert className="mr-2 size-4"/> Report an issue
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator/>
                                    {visibleNav.map((item) => (
                                        <DropdownMenuItem key={item.to} onClick={() => router.push(item.to)}>
                                            <item.icon className="mr-2 size-4"/>
                                            {item.label}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="hidden items-center gap-2 md:flex">
                            <Badge variant="secondary" className="font-medium">
                                ISO-aligned processes · v12.1
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            {isAdmin ? (
                                <Badge className="gap-1 bg-primary">
                                    <Users className="size-3"/> IT Admin
                                </Badge>
                            ) : (
                                <Badge variant="outline">Limited access</Badge>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2"
                                        aria-label="Account menu"
                                    >
                                        <Avatar className="size-8">
                                            <AvatarFallback
                                                className="bg-primary/10 text-xs font-semibold text-primary">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <ChevronDown className="size-4 text-muted-foreground"/>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <p className="truncate text-sm">{user?.fullName ?? 'IT user'}</p>
                                        <p className="truncate text-xs font-normal text-muted-foreground">
                                            {user?.email ?? '—'}
                                        </p>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator/>
                                    {isAdmin && (
                                        <DropdownMenuItem onClick={() => router.push('/users')}>
                                            <Users className="mr-2 size-4"/> Users & roles
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator/>
                                    <DropdownMenuItem
                                        onClick={signOut}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <LogOut className="mr-2 size-4"/> Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>
                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                        {routeAllowed ? (
                            children
                        ) : (
                            <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center">
                                <ShieldAlert className="mx-auto size-10 text-muted-foreground"/>
                                <h2 className="mt-3 text-lg font-semibold">No access to this module</h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Your administrator has not granted you access to{' '}
                                    <strong>{currentRoute?.label}</strong>. If you need it, ask them
                                    to add it under <strong>Users → Permissions</strong>.
                                </p>
                                <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard')}>
                                    Back to Overview
                                </Button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
            {/* Quick report dialog component will be integrated once built */}
        </div>
    );
}
