import { type ReactNode } from "react";
import type { MainMobileTab } from "./MobileNavTypes";
import {
    MobileNavHomeIcon,
    MobileNavSearchTabIcon,
    MobileNavFriendsIcon,
    MobileNavBookmarkIcon,
    MobileNavProfileIcon,
} from "./MobileNavIcons";

type MobileTab = {
    name: string;
    id: MainMobileTab;
    icon: (active: boolean) => ReactNode;
};

const tabs: MobileTab[] = [
    { name: "Home", id: "home", icon: (active) => <MobileNavHomeIcon active={active} /> },
    { name: "Search", id: "search", icon: () => <MobileNavSearchTabIcon /> },
    { name: "Friends", id: "friends", icon: () => <MobileNavFriendsIcon /> },
    { name: "Favorites", id: "favorites", icon: () => <MobileNavBookmarkIcon /> },
    { name: "Profile", id: "profile", icon: () => <MobileNavProfileIcon /> },
];

export default function MobileNav({
    activeTab,
    onTabChange,
}: {
    activeTab: MainMobileTab | null;
    onTabChange: (tab: MainMobileTab) => void;
}) {
	const isFirefoxAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent) && /firefox/i.test(navigator.userAgent);
	const bottomPadding = isFirefoxAndroid ? "8px" : "max(10px, env(safe-area-inset-bottom, 0px))";

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 flex justify-around rounded-t-[20px] border-t border-[var(--color-surface-border-subtle)] bg-surface-page py-2 shadow-[var(--shadow-app-topbar)]"
            style={{ paddingBottom: bottomPadding }}
        >
            {tabs.map((tab) => {
                const active = activeTab !== null && activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 text-[10px] sm:text-xs ${active ? "text-brand" : "text-brand-border"}`}
                    >
                        <span
                            className={`flex h-10 w-10 items-center justify-center rounded-full [&_svg]:h-[30px] [&_svg]:w-[30px] ${active ? "bg-brand-tint" : ""}`}
                        >
                            {tab.icon(active)}
                        </span>
                        <span className="truncate px-0.5">{tab.name}</span>
                    </button>
                );
            })}
        </nav>
    );
}
