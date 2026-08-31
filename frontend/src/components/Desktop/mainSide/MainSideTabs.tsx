interface MainSideTabsProps {
    tabs: readonly string[];
    activeTab: string;
    hoverTab: string | null;
    onTabChange: (tab: string) => void;
    onHoverTabChange: (tab: string | null) => void;
}

export default function MainSideTabs({
    tabs,
    activeTab,
    hoverTab,
    onTabChange,
    onHoverTabChange,
}: MainSideTabsProps) {
    return (
        <div className="relative mb-0">
            <div className="absolute bottom-0 left-0 h-[1px] w-full bg-brand-muted"></div>

            <div className="relative flex overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onMouseEnter={() => onHoverTabChange(tab)}
                        onMouseLeave={() => onHoverTabChange(null)}
                        onClick={() => onTabChange(tab)}
                        className={`relative flex items-center justify-center whitespace-nowrap py-[12px] text-[12px] font-[400] transition-colors ${
                            activeTab === tab ? 'text-brand' : 'text-brand-muted'
                        }`}
                        style={{ width: `${100 / tabs.length}%` }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div
                className="absolute bottom-0 h-[1px] bg-brand transition-all duration-300 ease-in-out"
                style={{
                    width: `${100 / tabs.length}%`,
                    left: `${(hoverTab ? tabs.indexOf(hoverTab) : tabs.indexOf(activeTab)) * (100 / tabs.length)}%`,
                }}
            />
        </div>
    );
}
