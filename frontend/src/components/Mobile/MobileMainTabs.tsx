import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import MobileHomeLayout from "./MobileHomeLayout";
import MobileFiltersScreen from "./MobileFiltersScreen";
import {
    emptyMobileFilterDetails,
    getMobileSelectedFiltersCount,
    type MobileFilterDetails,
} from "./mobileDateRange";
import MobileSearchScreen from "./MobileSearchScreen";
import MobileScrollPane from "./MobileScrollPane";
import MobileNav from "./MobileNav";
import { parseMainTab, type MainMobileTab } from "./MobileNavTypes";
import MainSide from "../Desktop/MainSide";
import EventCard from "../Desktop/Side/EventCard";
import Friends from "../Desktop/Friends";
import Favorites from "../Desktop/Favorites";
import MobileProfile from "./Profile/MobileProfile";
import { useFriendsData } from "../Desktop/friends/useFriendsData";

export default function MobileMainTabs() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = parseMainTab(searchParams);
    const searchQuery = searchParams.get("q") || "";
    const selectedEventId = searchParams.get("event");

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [mobileFilterDetails, setMobileFilterDetails] = useState<MobileFilterDetails>(emptyMobileFilterDetails);
    const [filtersScreenOpen, setFiltersScreenOpen] = useState(false);
    const filtersVisible = true;
    const selectedFiltersCount = getMobileSelectedFiltersCount(selectedCategories, mobileFilterDetails);
    const { authenticated, loadOverview, overview } = useFriendsData();
    useEffect(() => {
        if (authenticated) void loadOverview();
    }, [authenticated, loadOverview]);
    const friendsGoingEventIds = useMemo(
        () => new Set(overview.willAttendEvents.map((event) => event._id)),
        [overview.willAttendEvents],
    );
    const friendsInterestedEventIds = useMemo(
        () => new Set(overview.mightAttendEvents.map((event) => event._id)),
        [overview.mightAttendEvents],
    );

    const updateParams = (mutate: (params: URLSearchParams) => void, { replace = false }: { replace?: boolean } = {}) => {
        const nextParams = new URLSearchParams(searchParams);
        mutate(nextParams);
        setSearchParams(nextParams, { replace });
    };

    const setSearchQuery = (value: string) => {
        const nextValue = value.trim();
        updateParams((nextParams) => {
            if (nextValue) {
                nextParams.set("q", value);
            } else {
                nextParams.delete("q");
            }
        }, { replace: true });
    };

    const setMainTab = (t: MainMobileTab) => {
        if (t === tab && !selectedEventId) return;

        updateParams((nextParams) => {
            nextParams.delete("event");
            if (t === "home") {
                nextParams.delete("tab");
            } else {
                nextParams.set("tab", t);
            }
        });
    };

    const openEvent = (eventId: string) => {
        if (selectedEventId === eventId) return;

        updateParams((nextParams) => {
            nextParams.set("event", eventId);
        });
    };

    const handleCloseEvent = () => {
        updateParams((nextParams) => {
            nextParams.delete("event");
        }, { replace: true });
    };

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden">
            {tab === "home" && (
                <div className="relative h-[100dvh] w-full">
                    <MobileHomeLayout
                        selectedCategories={selectedCategories}
                        setSelectedCategories={setSelectedCategories}
                        onEventMapClick={openEvent}
                        activeEventId={selectedEventId}
                        filtersVisible={filtersVisible}
                        onOpenFullSearch={() => setMainTab("search")}
                        onOpenFullFilters={() => setFiltersScreenOpen(true)}
                        selectedFiltersCount={selectedFiltersCount}
                        mobileFilterDetails={mobileFilterDetails}
                        setMobileFilterDetails={setMobileFilterDetails}
                        friendsGoingEventIds={friendsGoingEventIds}
                        friendsInterestedEventIds={friendsInterestedEventIds}
                        searchText={searchQuery}
                    >
                        <MainSide
                            onClick={openEvent}
                            mobileVariant
                            activeEventId={selectedEventId}
                            onViewFriends={() => setMainTab("friends")}
                            filterDetails={mobileFilterDetails}
                            selectedCategories={selectedCategories}
                            friendsGoingEventIds={friendsGoingEventIds}
                            friendsInterestedEventIds={friendsInterestedEventIds}
                        />
                    </MobileHomeLayout>
                </div>
            )}

            {tab === "search" && (
                <MobileSearchScreen
                    query={searchQuery}
                    onQueryChange={setSearchQuery}
                    onEventClick={openEvent}
                />
            )}

            {tab === "friends" && (
                <MobileScrollPane>
                    <Friends />
                </MobileScrollPane>
            )}

            {tab === "favorites" && (
                <MobileScrollPane>
                    <Favorites onClick={openEvent} />
                </MobileScrollPane>
            )}

            {tab === "profile" && (
                <MobileScrollPane>
                    <MobileProfile />
                </MobileScrollPane>
            )}

            {selectedEventId && <EventCard onClose={handleCloseEvent} eventId={selectedEventId} />}

            {filtersScreenOpen ? (
                <MobileFiltersScreen
                    selectedCategories={selectedCategories}
                    setSelectedCategories={setSelectedCategories}
                    filterDetails={mobileFilterDetails}
                    onApplyDetails={setMobileFilterDetails}
                    onAddFriends={() => {
                        setFiltersScreenOpen(false);
                        setMainTab("friends");
                    }}
                    onClose={() => setFiltersScreenOpen(false)}
                />
            ) : null}

            {!selectedEventId && !filtersScreenOpen ? <MobileNav activeTab={tab} onTabChange={setMainTab} /> : null}
        </div>
    );
}
