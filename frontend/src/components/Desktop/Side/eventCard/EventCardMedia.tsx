import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface EventCardMediaProps {
    eventImageUrl: string;
    title?: string;
    onClose?: () => void;
}

export default function EventCardMedia({
    eventImageUrl,
    title,
    onClose,
}: EventCardMediaProps) {
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        setImageFailed(false);
    }, [eventImageUrl]);

    const showPlaceholder = !eventImageUrl || imageFailed;

    return (
        <div className="relative h-[410px] w-full bg-[var(--color-surface-placeholder)]">
            {showPlaceholder ? (
                <div className="flex h-full w-full items-center justify-center bg-[var(--color-surface-placeholder)]">
                    <img
                        src="/mapa.svg"
                        alt="Event image is not available yet"
                        className="h-[160px] w-[160px] object-contain opacity-80"
                        draggable={false}
                    />
                </div>
            ) : (
                <img
                    src={eventImageUrl}
                    alt={title || 'Event image'}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                />
            )}

            <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full bg-white p-2 shadow"
                aria-label="Close event card"
            >
                <X size={20} />
            </button>
        </div>
    );
}
