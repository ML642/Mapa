import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function NotificationBellIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="19" viewBox="0 0 15 19" fill="none" {...props}>
            <path d="M7.375 1V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.375 17.8086L6.375 17.8086" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path
                d="M13.75 15.3125H1C1.54167 14.1667 2.6875 13.875 2.6875 8.625C2.6875 5.3744 4.1875 3 7.5 3C10.8125 3 12.1875 5.12444 12.1875 8.625C12.1875 13.9688 13.25 14.25 13.75 15.3125Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export function AddPlusIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none" {...props}>
            <path d="M1 7H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M7 1L7 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export function ForwardArrowIcon(props: IconProps) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="15" viewBox="0 0 18 15" fill="none" {...props}>
            <path
                d="M1 6.36426C0.447715 6.36426 0 6.81197 0 7.36426C0 7.91654 0.447715 8.36426 1 8.36426V7.36426V6.36426ZM17.7071 8.07136C18.0976 7.68084 18.0976 7.04768 17.7071 6.65715L11.3431 0.29319C10.9526 -0.0973344 10.3195 -0.0973344 9.92893 0.29319C9.53841 0.683714 9.53841 1.31688 9.92893 1.7074L15.5858 7.36426L9.92893 13.0211C9.53841 13.4116 9.53841 14.0448 9.92893 14.4353C10.3195 14.8259 10.9526 14.8259 11.3431 14.4353L17.7071 8.07136ZM1 7.36426V8.36426H17V7.36426V6.36426H1V7.36426Z"
                fill="currentColor"
            />
        </svg>
    );
}
