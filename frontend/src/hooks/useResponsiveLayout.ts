import { useSyncExternalStore } from 'react';

export const MOBILE_BREAKPOINT_PX = 768;
export const DESKTOP_MEDIA_QUERY = `(min-width: ${MOBILE_BREAKPOINT_PX}px)`;
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 0.02}px)`;

const subscribers = new Set<() => void>();

let mediaQueryList: MediaQueryList | null = null;
let unsubscribeMediaQuery: (() => void) | null = null;

const getMediaQueryList = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    if (!mediaQueryList) {
        mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);
    }

    return mediaQueryList;
};

const getIsMobileSnapshot = () => getMediaQueryList()?.matches ?? false;

const getServerSnapshot = () => false;

const notifySubscribers = () => {
    subscribers.forEach((subscriber) => subscriber());
};

const subscribeToViewport = (subscriber: () => void) => {
    const queryList = getMediaQueryList();

    if (!queryList) {
        return () => undefined;
    }

    subscribers.add(subscriber);

    if (!unsubscribeMediaQuery) {
        if (typeof queryList.addEventListener === 'function') {
            queryList.addEventListener('change', notifySubscribers);
            unsubscribeMediaQuery = () => queryList.removeEventListener('change', notifySubscribers);
        } else {
            queryList.addListener(notifySubscribers);
            unsubscribeMediaQuery = () => queryList.removeListener(notifySubscribers);
        }
    }

    return () => {
        subscribers.delete(subscriber);

        if (subscribers.size === 0 && unsubscribeMediaQuery) {
            unsubscribeMediaQuery();
            unsubscribeMediaQuery = null;
        }
    };
};

export const useIsMobile = () => (
    useSyncExternalStore(
        subscribeToViewport, 
        getIsMobileSnapshot, 
        getServerSnapshot
    )
);

export const useResponsiveLayout = () => {
    const isMobile = useIsMobile();

    return {
        isMobile,
        isDesktop: !isMobile,
        breakpoint: MOBILE_BREAKPOINT_PX,
    };
};
