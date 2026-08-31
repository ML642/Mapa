import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function ShareArrowIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none" {...props}>
            <path
                d="M9.92308 8.94479C3.77886 8.23117 1.31832 13.8509 0.856083 16.75C-0.167954 7.29399 6.47407 4.41056 9.92308 4.15084V0.75L16.75 6.60391L9.92308 12.3463V8.94479Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function BookmarkOutlineIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="14" viewBox="0 0 12 14" fill="none" {...props}>
            <path
                d="M0.75 0.75H11.25V12.749L11.248 12.75C11.2464 12.7502 11.2449 12.75 11.2441 12.75C11.2434 12.7494 11.2425 12.7483 11.2412 12.7471L7.0459 8.73047C6.46372 8.17346 5.53628 8.17346 4.9541 8.73047L0.758789 12.7471C0.757506 12.7483 0.756635 12.7494 0.755859 12.75C0.755095 12.75 0.753581 12.7502 0.751953 12.75L0.75 12.749V0.75Z"
                stroke="currentColor"
                strokeWidth="1.5"
            />
        </svg>
    );
}

export function BookmarkFilledIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="14" viewBox="0 0 12 14" fill="none" {...props}>
            <path
                d="M11 1V12.6035L7.23047 8.87402L7.09863 8.75488C6.45929 8.23822 5.54071 8.23822 4.90137 8.75488L4.76953 8.87402L1 12.6035V1H11Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
            />
        </svg>
    );
}

export function PremiumRingIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="17" viewBox="0 0 16 17" fill="none" {...props}>
            <circle cx="8" cy="8.82825" r="7.5" stroke="currentColor" />
        </svg>
    );
}

export function ThreeDotsIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="4" viewBox="0 0 20 4" fill="none" {...props}>
            <circle cx="2" cy="2" r="2" fill="currentColor" />
            <circle cx="10" cy="2" r="2" fill="currentColor" />
            <circle cx="18" cy="2" r="2" fill="currentColor" />
        </svg>
    );
}

export function LogoutIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" viewBox="0 0 17 16" fill="none" {...props}>
            <path d="M11 1H1V15H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 8H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12.4648 4.46484L16.0004 8.00038" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 8L12.4645 11.5355" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function BackChevronIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="9" height="15" viewBox="0 0 9 15" fill="none" {...props}>
            <path d="M7.36719 1L1.00323 7.36396L7.36719 13.7279" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function CloseSmallIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" {...props}>
            <path d="M1 1L12.3137 12.3137" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12.3125 1L0.998791 12.3137" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function EditPencilIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none" {...props}>
            <path d="M2.125 14.875H14.875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path
                d="M11.6649 2.77366C12.191 2.2476 13.044 2.24759 13.5701 2.77366L14.2263 3.42991C14.7524 3.95598 14.7524 4.809 14.2263 5.33506L6.1882 13.3732L3.0625 13.9375L3.62682 10.8118L11.6649 2.77366Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function SettingsSlidersIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none" {...props}>
            <path d="M2.125 4.25H14.875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M2.125 12.75H14.875" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M5.3125 7.4375L5.3125 1.0625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11.6875 15.9375L11.6875 9.5625" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="5.3125" cy="7.4375" r="1.59375" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="11.6875" cy="9.5625" r="1.59375" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}
