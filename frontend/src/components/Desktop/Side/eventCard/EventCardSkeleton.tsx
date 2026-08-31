interface EventCardSkeletonProps {
    isMobile?: boolean;
}

function SkeletonBlock({ className }: { className?: string }) {
    return <div className={`animate-pulse rounded-[8px] bg-brand-tint ${className ?? ''}`} />;
}

export default function EventCardSkeleton({ isMobile }: EventCardSkeletonProps) {
    return (
        <div
            className={`
                flex flex-col overflow-hidden
                ${isMobile
                    ? 'fixed z-50 bg-white inset-0 w-full h-full rounded-none'
                    : 'absolute z-30 flex flex-col left-[528px] bottom-[12px] w-[393px] h-[78%] max-h-[791px] rounded-[20px] shadow-lg bg-white'
                }
            `}
        >
            <div className="flex h-full flex-col overflow-y-hidden">
                <SkeletonBlock className="h-[410px] w-full rounded-none" />

                <div className="relative -mt-[12px] flex flex-col rounded-t-[20px] bg-white px-[20px] pt-[24px]">
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-[16px]">
                            <SkeletonBlock className="h-[24px] w-[270px]" />
                            <SkeletonBlock className="h-[24px] w-[80px]" />
                        </div>

                        <div className="flex gap-2">
                            <SkeletonBlock className="h-[36px] w-[36px] rounded-full" />
                            <SkeletonBlock className="h-[36px] w-[36px] rounded-full" />
                        </div>
                    </div>

                    <div className="mt-[12px] flex w-full gap-[8px]">
                        <SkeletonBlock className="h-[38px] w-full rounded-[12px]" />
                        <SkeletonBlock className="h-[38px] w-full rounded-[12px]" />
                    </div>

                    <div className="mt-[24px] h-[1px] w-full bg-brand-muted" />

                    <div className="flex flex-col gap-[12px] py-4">
                        <SkeletonBlock className="h-[20px] w-[140px]" />

                        <SkeletonBlock className="h-[16px] w-[80px]" />

                        <SkeletonBlock className="h-[12px] w-full" />
                        <SkeletonBlock className="h-[12px] w-full" />
                        <SkeletonBlock className="h-[12px] w-[60%]" />

                        <div className="mt-[12px]">
                            <SkeletonBlock className="h-[20px] w-[100px]" />
                        </div>

                        <SkeletonBlock className="h-[16px] w-[180px]" />

                        <div className="mt-[12px]">
                            <SkeletonBlock className="h-[20px] w-[100px]" />
                        </div>

                        <SkeletonBlock className="h-[220px] w-full rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
