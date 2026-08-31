import PullToRefreshScrollView from './PullToRefreshScrollView';

const navBottomOffset = "calc(5rem + env(safe-area-inset-bottom, 0px))";

export default function MobileScrollPane({ children }: { children: React.ReactNode }) {
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
        </div>
    );
}
