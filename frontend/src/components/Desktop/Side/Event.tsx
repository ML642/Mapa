import React, { useEffect, useState } from 'react';
import { useFavorites } from '../contexts/FavoriteContext';
import { getEventImageUrl } from '../../../utils/eventImage';
import { BookmarkFilledIcon, BookmarkOutlineIcon } from '../../Icons/CommonIcons';
import { EventCategoryIcon, EventPriceIcon, EventTimeIcon } from '../../Icons/EventIcons';
import { getCategoryLabel, getCategoryTagStyle } from '../../categoryTag';

interface Props {
    id: string;
    category?: string;
    title?: string;
    date?: string;
    location?: string;
    time?: string;
    price?: string;
    priceDescription?: string;
    image?: string | string[];
    onClick?: (id: string) => void;
    isSelected?: boolean;
}

const Event: React.FC<Props> = ({ id, title, category, date, location, time, price, priceDescription, onClick, image, isSelected = false }) => {
    const { isFavorite, toggleFavorite, loadingFavorites } = useFavorites();
    const [animation, setAnimation] = useState<string>('');
    const [imageFailed, setImageFailed] = useState(false);
    const [priceDetailsOpen, setPriceDetailsOpen] = useState(false);
    const categoryTagStyle = getCategoryTagStyle(category);
    const imageUrl = getEventImageUrl(image, category);

    useEffect(() => {
        setImageFailed(false);
    }, [imageUrl]);

    useEffect(() => {
        setPriceDetailsOpen(false);
    }, [id]);

    const handleFavoriteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (loadingFavorites.has(id)) return;

        const newFavoriteState = !isFavorite(id);

        setAnimation(newFavoriteState ? 'heartBeat' : 'heartReverse');
        setTimeout(() => setAnimation(''), 600);

        try {
            await toggleFavorite(id);
        } catch (error) {
            console.error('Error updating favorites:', error);
            setAnimation('shake');
            setTimeout(() => setAnimation(''), 600);
        }
    };

    const formattedPrice = price?.trim() || 'Free';
    const fullPriceDescription = priceDescription?.trim();
    const priceDetails = fullPriceDescription && fullPriceDescription !== formattedPrice ? fullPriceDescription : formattedPrice;
    const canShowPriceDetails = Boolean(priceDetails && (priceDetails !== formattedPrice || formattedPrice.length > 22));
    const priceBadgeClassName = 'flex max-w-[152px] min-w-0 p-[4px] justify-center items-center gap-[4px] rounded-[36px] bg-surface-base shadow-app-sm transition-all duration-200';
    const priceBadgeContent = (
        <>
            <EventPriceIcon className='shrink-0 text-brand' />
            <p className='min-w-0 truncate text-brand text-[12px] font-[400]'>{formattedPrice}</p>
        </>
    );

    const handlePriceClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        if (!canShowPriceDetails) return;

        setPriceDetailsOpen((isOpen) => !isOpen);
    };

    const handleClick = () => {
        if (onClick) onClick(id);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;

        e.preventDefault();
        handleClick();
    };

    const loading = loadingFavorites.has(id);

    return (
        <div
            className={`flex h-[161px] w-full items-start gap-[12px] border-b-[1px] border-brand-soft px-[12px] py-[20px] outline-none transition-colors duration-200 ${isSelected ? 'bg-[var(--color-brand-surface)]' : 'hover:bg-[var(--color-brand-surface)]'}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
        >
            <div className='h-[120px] w-[187.7px] shrink-0 overflow-hidden rounded-[4px] bg-[var(--color-surface-placeholder)] max-md:w-[120px]'>
                {imageUrl && !imageFailed ? (
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover rounded-[4px] transition-transform duration-300 hover:scale-105"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[var(--color-surface-placeholder)]">
                        <img
                            src="/mapa.svg"
                            alt="Event image is not available yet"
                            className="h-[54px] w-[54px] object-contain opacity-80"
                            draggable={false}
                        />
                    </div>
                )}
            </div>
            <div className='flex h-[120px] min-w-0 flex-1 flex-col justify-between'>
                <div className='flex flex-col justify-between w-full'>
                    <div className='flex items-start justify-between'>
                        <div className='flex px-[8px] py-[4px] justify-center items-center gap-[4px] rounded-[36px] transition-all duration-200' style={{ backgroundColor: categoryTagStyle.backgroundColor }}>
                            {categoryTagStyle.icon ? <img src={categoryTagStyle.icon} alt="" className='h-[15px] w-[19px]' /> : <EventCategoryIcon className='text-brand w-[19px] h-[15px]' />}
                            <p className='text-brand text-[12px] font-[400]'>{getCategoryLabel(category)}</p>
                        </div>
                        <button
                            onClick={handleFavoriteClick}
                            className={`flex w-[24px] h-[24px] justify-center items-center rounded-full bg-surface-page shadow-app-sm transition-all duration-300 hover:scale-110 ${animation === 'heartBeat' ? 'animate-pulse scale-125' :
                                animation === 'heartReverse' ? 'animate-pulse scale-125' :
                                    animation === 'shake' ? 'animate-shake' : ''
                                }`}
                            disabled={loading}
                        >
                            {isFavorite(id) ? (
                                <BookmarkFilledIcon className="text-accent transition-all duration-300 transform" />
                            ) : (
                                <BookmarkOutlineIcon className="text-brand transition-all duration-300 transform" />
                            )}
                        </button>
                    </div>
                </div>

                <div className='flex w-full min-w-0 flex-col items-start gap-[2px]'>
                    <p
                        style={{ letterSpacing: '-0.64px' }}
                        className='mb-[2px] block h-[19px] w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[16px] font-[500] leading-[19px] text-brand transition-all duration-200'
                    >
                        {title}
                    </p>

                    <p style={{ letterSpacing: '-0.48px' }} className='flex h-[12px] w-full items-center truncate whitespace-nowrap text-[12px] font-[400] text-brand transition-all duration-200'>{date}</p>
                    <p
                        style={{ letterSpacing: '-0.48px' }}
                        className='block h-[12px] w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] font-[400] leading-[12px] text-brand-soft transition-all duration-200'
                        title={location}
                    >
                        {location}
                    </p>
                </div>

                <div className='flex gap-[4px]'>
                    {time ? (
                        <div className='flex p-[4px] justify-center items-center gap-[4px] rounded-[36px] bg-surface-base shadow-app-sm transition-all duration-200'>
                            <EventTimeIcon className='text-brand' />
                            <p className='text-brand text-[12px] font-[400]'>{time}</p>
                        </div>
                    ) : null}

                    <div className="relative min-w-0">
                        {canShowPriceDetails ? (
                            <button
                                type="button"
                                onClick={handlePriceClick}
                                className={`${priceBadgeClassName} cursor-pointer hover:shadow-md`}
                                title={priceDetails}
                                aria-expanded={priceDetailsOpen}
                            >
                                {priceBadgeContent}
                            </button>
                        ) : (
                            <div className={priceBadgeClassName} title={formattedPrice}>
                                {priceBadgeContent}
                            </div>
                        )}

                        {canShowPriceDetails && priceDetailsOpen ? (
                            <div
                                className="absolute bottom-[calc(100%+8px)] right-0 z-30 max-w-[260px] rounded-[8px] bg-surface-base px-[10px] py-[8px] text-left text-[12px] leading-[1.35] text-brand shadow-app-md ring-1 ring-brand-soft whitespace-pre-line"
                                onClick={(event) => event.stopPropagation()}
                            >
                                {priceDetails}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Event;
