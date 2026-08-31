const MOBILE_SEARCH_EMPTY_ICON_SRC = "/icons/mobile-search-empty.png";

const MobileSearchNoResults = () => (
    <div className="flex w-full flex-col items-center justify-center">
        <div className="h-[70px] w-[350px] overflow-hidden" aria-hidden="true">
            <img
                src={MOBILE_SEARCH_EMPTY_ICON_SRC}
                alt=""
                className="h-auto w-[350px]"
                draggable={false}
            />
        </div>
        <p className="mt-2 text-[16px] text-brand-muted">No matches found</p>
    </div>
);

export default MobileSearchNoResults;
