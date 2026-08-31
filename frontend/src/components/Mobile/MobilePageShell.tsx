import { useNavigate } from "react-router-dom";
import MobileNav from "./MobileNav";
import { type MainMobileTab } from "./MobileNavTypes";
import PullToRefreshScrollView from "./PullToRefreshScrollView";

const navBottomOffset = "calc(5rem + env(safe-area-inset-bottom, 0px))";

export default function MobilePageShell({
    children,
    activeTab = null,
}: {
    children: React.ReactNode;
    activeTab?: MainMobileTab | null;
}) {
    const navigate = useNavigate();
    const goMainTab = (t: MainMobileTab) => {
        if (t === "home") {
            navigate("/");
            return;
        }
        navigate({ pathname: "/", search: `tab=${t}` });
    };
    return (
        <div className="flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-white">
            <PullToRefreshScrollView
                wrapperClassName="min-h-0 flex-1"
                scrollClassName="h-full overscroll-y-contain [-webkit-overflow-scrolling:touch] touch-pan-y"
                scrollStyle={{ paddingBottom: navBottomOffset }}
                contentClassName="min-h-full"
            >
                {children}
            </PullToRefreshScrollView>
            <MobileNav activeTab={activeTab} onTabChange={goMainTab} />
        </div>
    );
}
