import React, { useState } from 'react';
import { motion, type Variants } from "framer-motion";
import { useFriendModal } from './contexts/AddFriendsContext';
import MainSideEventList from './mainSide/MainSideEventList';
import MainSideFriendsSection from './mainSide/MainSideFriendsSection';
import MainSideTabs from './mainSide/MainSideTabs';
import { MAIN_SIDE_TABS, type MainSideTab } from './mainSide/formatters';
import EventSearchResults from '../Search/EventSearchResults';
import MobileSearchNoResults from '../Mobile/MobileSearchNoResults';
import MobileSearchResultsList from '../Mobile/MobileSearchResultsList';
import MobileInterestingEvents from '../Mobile/MobileInterestingEvents';
import { useMainSideData } from './hooks/useMainSideData';
import { filterEventsForMobile } from '../../utils/mobileEventFilters';
import type { MobileFilterDetails } from '../Mobile/mobileDateRange';

interface Props {
    onClick?: (id: string) => void;
    searchQuery?: string;
    selectedCategories?: string[];
    filterDetails?: MobileFilterDetails;
    friendsGoingEventIds?: Set<string>;
    friendsInterestedEventIds?: Set<string>;
    activeEventId?: string | null;
    mobileVariant?: boolean;
    onViewFriends?: () => void;
}

const MainSide: React.FC<Props> = ({
    onClick,
    searchQuery = '',
    selectedCategories = [],
    filterDetails,
    friendsGoingEventIds,
    friendsInterestedEventIds,
    activeEventId,
    mobileVariant = false,
    onViewFriends,
}) => {
    const [activeTab, setActiveTab] = useState<MainSideTab>('Today');
    const [hoverTab, setHoverTab] = useState<string | null>(null);
    const [showMoreInteresting, setShowMoreInteresting] = useState(false);

    const { openAddFriendsModal } = useFriendModal();

    const {
        authenticated,
        friends,
        friendsOverview,
        interestingEvents,
        interestingEventsLoading,
        searchHistoryRecommendations,
        searchHistoryRecommendationsLoading,
        events,
        loading,
        normalizedSearchQuery,
    } = useMainSideData(searchQuery, activeTab);
    const activeFilterDetails: MobileFilterDetails = filterDetails ?? {
        dateFilter: '', dateRange: { start: '', end: '' }, timeStart: '', timeEnd: '', priceMin: '', priceMax: '', friendsInterested: false, friendsGoing: false,
    };
    const filterContext = {
        categories: selectedCategories,
        details: activeFilterDetails,
        friendsGoingEventIds,
        friendsInterestedEventIds,
    };
    const filteredInterestingEvents = filterEventsForMobile(interestingEvents, filterContext);
    const filteredSearchRecommendations = filterEventsForMobile(searchHistoryRecommendations?.events ?? [], filterContext);
    const personalizedEvents = filteredSearchRecommendations.length > 0
        ? filteredSearchRecommendations
        : filteredInterestingEvents;
    const personalizedEventsLoading = searchHistoryRecommendationsLoading || interestingEventsLoading;
    const filteredEvents = filterEventsForMobile(events, filterContext);

    const cardVariants: Variants = {
        hidden: { opacity: 0, y: 40, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring", stiffness: 120, damping: 18, duration: 0.5 }
        },
        exit: { opacity: 0, y: 30, scale: 0.98, transition: { duration: 0.3, ease: "easeInOut" } }
    };

    if (normalizedSearchQuery) {
        return (
            <div className='flex w-full flex-col gap-[16px] px-[16px] pt-[8px]'>
                <EventSearchResults
                    query={searchQuery}
                    onClick={onClick}
                    emptyState={<MobileSearchNoResults />}
                    renderResults={(props) => <MobileSearchResultsList {...props} activeEventId={activeEventId} />}
                />
            </div>
        );
    }

    return (
        <div className='flex w-full flex-col gap-[24px] px-[16px]'>
            <MainSideFriendsSection
                isAuthenticated={authenticated}
                hasFriends={friends.length > 0}
                events={friendsOverview?.willAttendEvents ?? []}
                onAddFriends={openAddFriendsModal}
                onClickEvent={onClick}
                mobileVariant={mobileVariant}
                activeEventId={activeEventId}
                onViewAll={onViewFriends}
            />

            {mobileVariant ? (
                <MobileInterestingEvents
                    events={personalizedEvents}
                    loading={personalizedEventsLoading}
                    onClick={onClick}
                    activeEventId={activeEventId}
                />
            ) : (
            <div className='flex flex-col items-center'>
                <motion.p
                    className='text-display mb-0 w-full text-[20px]'
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    Interesting events
                </motion.p>

                <div className="w-full">
                    <MainSideEventList
                       
                        events={personalizedEvents}
                        loading={personalizedEventsLoading}
                        loadingText="Loading interesting events..."
                        emptyText="There are no recommendations right now"
                        onClick={onClick}
                        cardVariants={cardVariants}
                        collapsedCount={1}
                        expandedCount={7}
                        expanded={showMoreInteresting}
                        activeEventId={activeEventId}
                    />
                </div>

                {personalizedEvents.length > 1 && !personalizedEventsLoading && (
                    <motion.button
                        type="button"
                        onClick={() => setShowMoreInteresting(!showMoreInteresting)}
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className='mt-[16px] flex items-center justify-center text-[12px] font-[400] tracking-[-0.48px] text-brand underline'
                    >
                        {showMoreInteresting ? 'Show less' : 'Show more'}
                    </motion.button>
                )}
            </div>
            )}

            <div>
                <p className='text-display mb-[15px] w-full text-[20px]'>Events in Warsaw</p>

                <MainSideTabs
                    tabs={MAIN_SIDE_TABS}
                    activeTab={activeTab}
                    hoverTab={hoverTab}
                    onTabChange={(tab) => setActiveTab(tab as MainSideTab)}
                    onHoverTabChange={setHoverTab}
                />

                <div className="flex flex-col pb-[16px]">
                    <MainSideEventList
                        events={filteredEvents}
                        loading={loading}
                        loadingText="Loading events..."
                        emptyText="No events during this period"
                        onClick={onClick}
                        cardVariants={cardVariants}
                        activeEventId={activeEventId}
                    />
                </div>
            </div>
        </div>
    );
};

export default MainSide;
