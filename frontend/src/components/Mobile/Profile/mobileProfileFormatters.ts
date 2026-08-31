export const MOBILE_PROFILE_TOP_INSET_STYLE = {
    paddingTop: 'max(18px, env(safe-area-inset-top, 0px))',
};

const INTEREST_CHIP_THEMES = [
    'bg-[linear-gradient(90deg,rgba(215,160,247,0.85)_0%,rgba(243,164,248,0.92)_100%)]',
    'bg-[rgba(254,245,220,0.95)]',
    'bg-[rgba(165,228,255,0.92)]',
    'bg-[rgba(198,160,247,0.92)]',
    'bg-[rgba(213,192,255,0.92)]',
    'bg-[linear-gradient(90deg,rgba(215,160,247,0.78)_0%,rgba(255,154,237,0.9)_100%)]',
] as const;

export const getMobileInterestChipClassName = (index: number) =>
    INTEREST_CHIP_THEMES[index % INTEREST_CHIP_THEMES.length];

export const formatMobileProfileDate = (eventDate: string) =>
    new Date(eventDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
    });

export const formatMobileProfileTime = (eventDate: string) =>
    new Date(eventDate).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
    });

export const formatFriendCountLabel = (count: number) => {
    return `${count} ${Math.abs(count) === 1 ? 'friend' : 'friends'}`;
};
