import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { type SearchHistoryItem, type ViewHistoryItem, userService } from '../../services/userService';

export default function HistoryPanel() {
    const [searches, setSearches] = useState<SearchHistoryItem[]>([]);
    const [views, setViews] = useState<ViewHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        void Promise.all([userService.getSearchHistoryData(), userService.getViewHistoryData()])
            .then(([searchHistory, viewHistory]) => {
                setSearches(searchHistory.searches);
                setViews(viewHistory.views);
            })
            .finally(() => setLoading(false));
    }, []);

    const clearSearches = async () => {
        await userService.clearSearchHistory();
        setSearches([]);
    };

    const clearViews = async () => {
        await userService.clearViewHistory();
        setViews([]);
    };

    if (loading) return <div className="p-6 text-brand-muted">Loading history…</div>;

    return (
        <section className="w-full p-4 text-brand">
            <h1 className="mb-6 text-xl font-semibold">History</h1>
            <div className="mb-8">
                <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold">Recent searches</h2>{searches.length > 0 && <button onClick={() => void clearSearches()} className="text-sm text-brand-muted underline">Clear</button>}</div>
                {searches.length ? <div className="flex flex-wrap gap-2">{searches.map((item) => <Link key={`${item.query}-${item.searchedAt}`} to={`/?q=${encodeURIComponent(item.query)}`} className="rounded-full bg-brand-surface px-3 py-2 text-sm">{item.query}</Link>)}</div> : <p className="text-sm text-brand-muted">No searches yet.</p>}
            </div>
            <div>
                <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold">Recently viewed</h2>{views.length > 0 && <button onClick={() => void clearViews()} className="text-sm text-brand-muted underline">Clear</button>}</div>
                {views.length ? <div className="flex flex-col gap-2">{views.map(({ event, viewedAt }) => <Link key={`${event._id}-${viewedAt}`} to={`/?event=${event._id}`} className="rounded-xl bg-white p-3 shadow-app-xs"><p className="font-medium">{event.title}</p><p className="mt-1 text-sm text-brand-muted">{event.address || 'Address not provided'}</p></Link>)}</div> : <p className="text-sm text-brand-muted">No viewed events yet.</p>}
            </div>
        </section>
    );
}
