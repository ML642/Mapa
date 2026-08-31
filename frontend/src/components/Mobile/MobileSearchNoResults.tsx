const MOBILE_SEARCH_EMPTY_ICON_SRC = "/icons/mobile-search-empty.png";

const MobileSearchNoResults = () => (
    <div className="flex w-full items-center justify-center">
        <img
            src={MOBILE_SEARCH_EMPTY_ICON_SRC}
            alt="No search results"
            className="h-auto w-[350px]"
            draggable={false}
        />
    </div>
);

export default MobileSearchNoResults;
