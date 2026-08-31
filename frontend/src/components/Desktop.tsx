import { useState, useEffect, useCallback, useMemo } from 'react'
import MainSide from './Desktop/MainSide'
import MapBoxMap from './Desktop/Map/MapBoxMap'
import { AnimatePresence, motion } from 'framer-motion'
import EventCard from './Desktop/Side/EventCard'
import Filters from './Desktop/Filters/Filters'
import MapEventCard from './Desktop/Side/MapEventCard'
import Friends from './Desktop/Friends'
import Register from './Auth/Register'
import Login from './Auth/Login'
import Favorites from './Desktop/Favorites'
import Profile from './Desktop/Profile/Profile'
import { Routes, Route, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import AuthModal from './Desktop/Modal/AuthModal'
import AddFriendsModal from './Desktop/Modal/AddFriendsModal'
import ShareEventModal from './Desktop/Modal/ShareEventModal'
import PublicProfile from './Desktop/Profile/PublicProfile'
import MyFriends from './Desktop/Profile/MyFriends'
import HistoryPanel from './Profile/HistoryPanel'
import ForgotPassword from './Auth/ForgotPassword/ForgotPassword'
import DesktopLayout from './Desktop/DesktopLayout'
import DesktopFilterPanel from './Desktop/Filters/DesktopFilterPanel'
import { emptyMobileFilterDetails, type MobileFilterDetails } from './Mobile/mobileDateRange'
import { useFriendsData } from './Desktop/friends/useFriendsData'

export default function DesktopContent() {
    const [eventCardMode, setEventCardMode] = useState<'search' | 'map' | null>(null);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
    const [filterDetails, setFilterDetails] = useState<MobileFilterDetails>(emptyMobileFilterDetails);
    const { authenticated, loadOverview, overview } = useFriendsData();

    const [filtersVisible, setFiltersVisible] = useState(true);
    const [mainVisible, setMainVisible] = useState(true);

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

    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const eventIdFromUrl = searchParams.get('event');


    const navigate = useNavigate();

    const handleSearchQueryChange = useCallback((value: string) => {
        const newSearchParams = new URLSearchParams(searchParams);
        const nextValue = value.trim();

        if (nextValue) {
            newSearchParams.set('q', value);
        } else {
            newSearchParams.delete('q');
        }

        setSearchParams(newSearchParams, { replace: true });
    }, [searchParams, setSearchParams]);

    const handleEventClick = (eventId: string) => {
        if (location.pathname !== '/') {
            setEventCardMode(null);
            navigate(`/?event=${encodeURIComponent(eventId)}`);
            return;
        }

        setSelectedEventId(eventId);
        setEventCardMode('search');
    };

    const handleCloseEvent = () => {
        setFiltersVisible(true);
        setEventCardMode(null);
        setSelectedEventId(null);

        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('event');
        setSearchParams(newSearchParams);
    };

    const handleEventMapClick = (eventId: string) => {
        // On secondary pages, return to the main search screen before opening
        // the event. React Router handles this without reloading the app.
        if (location.pathname !== '/') {
            navigate(`/?event=${encodeURIComponent(eventId)}`);
            return;
        }

        setFiltersVisible(false);
        setMainVisible(false);
        setSelectedEventId(eventId);
        setEventCardMode(null);

        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('event', eventId);
        setSearchParams(newSearchParams);
    };

    const handleCloseMapEvent = useCallback(() => {
        setMainVisible(true);
        setEventCardMode(null);
        setSelectedEventId(null);
        setFiltersVisible(true);

        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('event');
        setSearchParams(newSearchParams);
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        if (!eventIdFromUrl) {
            setEventCardMode((currentMode) => currentMode === 'map' ? null : currentMode);
            if (location.pathname === '/') {
                setSelectedEventId(null);
                setFiltersVisible(true);
                setMainVisible(true);
            }
            return;
        }

        // Immediately remove any previous card before changing the route or event.
        // This prevents the search card and map card from coexisting during navigation.
        setEventCardMode(null);
        setSelectedEventId(eventIdFromUrl);

        if (location.pathname !== '/') {
            navigate(`/?event=${encodeURIComponent(eventIdFromUrl)}`, { replace: true });
            return;
        }

        setFiltersVisible(false);
        setMainVisible(false);

        const openTimer = window.setTimeout(() => {
            setEventCardMode('map');
        }, 400);

        return () => window.clearTimeout(openTimer);
    }, [eventIdFromUrl, location.pathname, navigate]);

    useEffect(() => {
        if (location.pathname !== '/' && !eventIdFromUrl) {
            setDesktopFiltersOpen(false);
            setEventCardMode(null);
            setSelectedEventId(null);
            setFiltersVisible(true);
            setMainVisible(true);
        }
    }, [eventIdFromUrl, location.pathname]);

    const noMapPages = ['/register', '/login', '/forgot-password'];
    const isMapVisible = !noMapPages.includes(location.pathname);

    const shouldShowMainSide = mainVisible && eventCardMode !== 'map' && location.pathname === '/';

    return (
        <div className="relative w-full h-screen">
            {isMapVisible && (
                <>
                    <div className="absolute inset-0 z-0">
                        <MapBoxMap
                            onEventClick={handleEventMapClick}
                            selectedCategories={selectedCategories}
                            activeEventId={selectedEventId}
                            mobileFilterDetails={filterDetails}
                            friendsGoingEventIds={friendsGoingEventIds}
                            friendsInterestedEventIds={friendsInterestedEventIds}
                        />
                    </div>

                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: filtersVisible ? 1 : 0 }}
                        style={{ pointerEvents: filtersVisible ? "auto" : "none" }}
                        className="absolute top-0 left-[529px] right-4 z-10 bg-transparent flex min-w-0"
                    >
                        <Filters
                            selectedCategories={selectedCategories}
                            setSelectedCategories={setSelectedCategories}
                            onOpenFullFilters={() => setDesktopFiltersOpen(true)}
                            filterDetails={filterDetails}
                            setFilterDetails={setFilterDetails}
                        />
                    </motion.div>

                    <DesktopFilterPanel
                        open={desktopFiltersOpen && filtersVisible}
                        selectedCategories={selectedCategories}
                        filterDetails={filterDetails}
                        searchQuery={searchQuery}
                        onSearchChange={handleSearchQueryChange}
                        onClose={() => setDesktopFiltersOpen(false)}
                        onApply={(categories, details) => {
                            setSelectedCategories(categories);
                            setFilterDetails(details);
                        }}
                    />

                    {eventCardMode === 'search' && location.pathname === '/' && selectedEventId && (
                        <EventCard
                            key={`search-${selectedEventId}`}
                            onClose={handleCloseEvent}
                            eventId={selectedEventId}
                        />
                    )}

                    <AnimatePresence  >
                        {eventCardMode === 'map' && location.pathname === '/' && selectedEventId && (
                            <MapEventCard
                                key={`map-${selectedEventId}`}
                                eventId={selectedEventId}
                                onClose={handleCloseMapEvent}
                            />
                        )}
                    </AnimatePresence>
                </>
            )}

            <Routes>
                <Route path="/" element={
                    <DesktopLayout
                        mainVisible={shouldShowMainSide}
                        searchQuery={searchQuery}
                        onSearchQueryChange={handleSearchQueryChange}
                    >
                        <MainSide
                            onClick={handleEventClick}
                            searchQuery={searchQuery}
                            selectedCategories={selectedCategories}
                            filterDetails={filterDetails}
                            activeEventId={selectedEventId}
                            friendsGoingEventIds={friendsGoingEventIds}
                            friendsInterestedEventIds={friendsInterestedEventIds}
                        />
                    </DesktopLayout>
                } />
                <Route path="/friends" element={<DesktopLayout mainVisible={mainVisible} searchQuery={searchQuery} onSearchQueryChange={handleSearchQueryChange}><Friends /></DesktopLayout>} />
                <Route path="/favorites" element={<DesktopLayout mainVisible={mainVisible} searchQuery={searchQuery} onSearchQueryChange={handleSearchQueryChange}><Favorites onClick={handleEventClick} /></DesktopLayout>} />
                <Route path="/profile" element={<DesktopLayout mainVisible={mainVisible} searchQuery={searchQuery} onSearchQueryChange={handleSearchQueryChange}><Profile /></DesktopLayout>} />
                <Route path="/profile/history" element={<DesktopLayout mainVisible={mainVisible} searchQuery={searchQuery} onSearchQueryChange={handleSearchQueryChange}><HistoryPanel /></DesktopLayout>} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/:id/profile" element={<DesktopLayout mainVisible={mainVisible} searchQuery={searchQuery} onSearchQueryChange={handleSearchQueryChange}><PublicProfile /></DesktopLayout>} />
                <Route path="/profile/my-friends" element={<DesktopLayout mainVisible={mainVisible} searchQuery={searchQuery} onSearchQueryChange={handleSearchQueryChange}><MyFriends /></DesktopLayout>} />
            </Routes>

            <AuthModal />
            <AddFriendsModal />
            <ShareEventModal />
        </div >
    );
}
