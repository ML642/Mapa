import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { socialShareService } from '../../../services';
import { CloseSmallIcon } from '../../Icons/CommonIcons';
import {
    CopyShareIcon,
} from '../../Icons/SocialShareIcons';

type SocialSharePlatform = 'copy' | 'telegram' | 'whatsapp' | 'viber' | 'vk' | 'instagram';

interface SocialShareModalProps {
    isOpen: boolean;
    title: string;
    titleClassName?: string;
    onClose: () => void;
    getShareLink: () => string;
    shareText: string;
    copySuccessMessage: string;
    instagramSuccessMessage?: string;
}

interface ShareOption {
    platform: SocialSharePlatform;
    label: string;
    icon: ReactNode;
}

const DEFAULT_INSTAGRAM_SUCCESS_MESSAGE =
    'Link copied! You can now share it on Instagram.';

function ShareCircle({
    backgroundClassName,
    children,
}: {
    backgroundClassName: string;
    children: ReactNode;
}) {
    return (
        <span
            className={`flex h-[48px] w-[48px] items-center justify-center rounded-full ${backgroundClassName}`}
            aria-hidden
        >
            {children}
        </span>
    );
}

function CopyIcon() {
    return (
        <ShareCircle backgroundClassName="bg-accent-soft text-brand">
            <CopyShareIcon />
        </ShareCircle>
    );
}

function TelegramIcon() {
    return (
        <ShareCircle backgroundClassName="bg-[var(--color-social-telegram)] text-white">
            <img src="https://cdn.simpleicons.org/telegram/white" alt="" className="h-[22px] w-[22px]" />
        </ShareCircle>
    );
}

function WhatsAppIcon() {
    return (
        <ShareCircle backgroundClassName="bg-[var(--color-social-whatsapp)] text-white">
            <img src="https://cdn.simpleicons.org/whatsapp/white" alt="" className="h-[22px] w-[22px]" />
        </ShareCircle>
    );
}

function ViberIcon() {
    return (
        <ShareCircle backgroundClassName="bg-[var(--color-social-viber)] text-white">
            <img src="https://cdn.simpleicons.org/viber/white" alt="" className="h-[22px] w-[22px]" />
        </ShareCircle>
    );
}

function VkIcon() {
    return (
        <ShareCircle backgroundClassName="bg-[var(--color-social-vk)] text-white">
            <img src="https://cdn.simpleicons.org/vk/white" alt="" className="h-[22px] w-[22px]" />
        </ShareCircle>
    );
}

function InstagramIcon() {
    return (
        <ShareCircle backgroundClassName="bg-[image:var(--gradient-social-instagram)] text-white">
            <img src="https://cdn.simpleicons.org/instagram/white" alt="" className="h-[22px] w-[22px]" />
        </ShareCircle>
    );
}

function CloseIcon() {
    return <CloseSmallIcon className="h-[11px] w-[11px] text-brand" />;
}

const SHARE_OPTIONS: ShareOption[] = [
    {
        platform: 'copy',
        label: 'Copy link',
        icon: <CopyIcon />,
    },
    {
        platform: 'telegram',
        label: 'Telegram',
        icon: <TelegramIcon />,
    },
    {
        platform: 'whatsapp',
        label: 'WhatsApp',
        icon: <WhatsAppIcon />,
    },
    {
        platform: 'viber',
        label: 'Viber',
        icon: <ViberIcon />,
    },
    {
        platform: 'vk',
        label: 'VK',
        icon: <VkIcon />,
    },
    {
        platform: 'instagram',
        label: 'Instagram',
        icon: <InstagramIcon />,
    },
];

export default function SocialShareModal({
    isOpen,
    title,
    titleClassName = 'text-[24px]',
    onClose,
    getShareLink,
    shareText,
    copySuccessMessage,
    instagramSuccessMessage = DEFAULT_INSTAGRAM_SUCCESS_MESSAGE,
}: SocialShareModalProps) {
    const handleShareClick = async (platform: SocialSharePlatform) => {
        const link = getShareLink();

        switch (platform) {
            case 'copy':
                if (await socialShareService.copyToClipboard(link)) {
                    alert(copySuccessMessage);
                }
                break;
            case 'telegram':
                socialShareService.shareToTelegram({ link, text: shareText });
                break;
            case 'whatsapp':
                socialShareService.shareToWhatsApp({ link, text: shareText });
                break;
            case 'viber':
                socialShareService.shareToViber({ link, text: shareText });
                break;
            case 'vk':
                socialShareService.shareToVK({ link, text: shareText });
                break;
            case 'instagram':
                if (await socialShareService.shareToInstagram(link)) {
                    alert(instagramSuccessMessage);
                }
                break;
            default:
                break;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--color-brand-overlay)]"
                >
                    <motion.div
                        key="modal"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="relative w-[405px] rounded-[12px] bg-surface-base p-[32px] text-center shadow-app-lg"
                    >
                        <h2
                            className={`mb-[32px] text-left leading-[28px] text-brand ${titleClassName}`}
                            id="text-cool"
                        >
                            {title}
                        </h2>

                        <div className="grid grid-cols-3 grid-rows-2 gap-x-[12px] gap-y-[16px]">
                            {SHARE_OPTIONS.map((option) => (
                                <button
                                    key={option.platform}
                                    type="button"
                                    onClick={() => handleShareClick(option.platform)}
                                    className="flex w-[102px] flex-col items-center gap-[4px] text-[14px] font-[400] leading-[16px] tracking-[-0.28px] text-brand outline-none focus-visible:rounded-[8px] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                                >
                                    {option.icon}
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute right-[16px] top-[16px] flex items-center justify-center rounded-full bg-surface-base p-[12.5px] shadow-[var(--shadow-app-md)]"
                        >
                            <CloseIcon />
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
