import { type FriendRequest, type FriendActivityEvent } from "../../../services";
import FriendAvatar from "./FriendAvatar";
import FriendActivityCard from "./FriendActivityCard";
import { CloseSmallIcon } from "../../Icons/CommonIcons";

export default function FriendsNotificationsPanel({
    incomingRequests,
    willAttendEvents,
    mightAttendEvents,
    pendingIds,
    actionMessage,
    error,
    onAccept,
    onReject,
    onClose,
}: {
    incomingRequests: FriendRequest[];
    willAttendEvents: FriendActivityEvent[];
    mightAttendEvents: FriendActivityEvent[];
    pendingIds: Set<string>;
    actionMessage: string | null;
    error: string | null;
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
    onClose: () => void;
}) {
    const hasNotificationItems =
        incomingRequests.length > 0 ||
        willAttendEvents.length > 0 ||
        mightAttendEvents.length > 0;

    return (
        <div className="flex min-h-full w-full flex-col px-[16px] py-[18px] md:h-full md:min-h-0">
            <div className="flex items-center justify-between">
                <h1 className="text-[20px] font-[600] tracking-[-0.6px] text-brand">Notifications</h1>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white shadow-[0_4px_16px_rgba(107,40,94,0.08)]"
                    aria-label="Close notifications"
                >
                    <CloseSmallIcon className="h-[12px] w-[12px] text-brand" />
                </button>
            </div>

            {(actionMessage || error) && (
                <div className="mt-[14px] rounded-full bg-[var(--color-brand-surface)] px-[14px] py-[8px] text-center text-[13px] tracking-[-0.26px] text-brand">
                    {actionMessage || error}
                </div>
            )}

            <div className="mt-[20px] pr-[2px] md:min-h-0 md:flex-1 md:overflow-y-auto">
                {!hasNotificationItems ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="flex flex-col items-center text-center">
                            <img
                                src="/icons/nomessage.png"
                                alt=""
                                className="h-auto w-[min(230px,70vw)]"
                            />
                            <p className="mt-[14px] text-[16px] leading-[1.2] tracking-[-0.32px] text-brand-muted">
                                You do not have any notifications yet
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-[12px]">
                        {incomingRequests.map((request) => {
                            const requestId = request.id || request._id || "";
                            const isPending = pendingIds.has(requestId);

                            return (
                                <div
                                    key={requestId}
                                    className="rounded-[18px] bg-[linear-gradient(180deg,rgba(255,252,241,0.98)_0%,rgba(255,244,210,0.92)_100%)] px-[16px] py-[14px] shadow-[0_8px_24px_rgba(107,40,94,0.06)]"
                                >
                                    <div className="flex items-center gap-[10px]">
                                        <FriendAvatar avatar={request.avatar} username={request.username} />
                                        <p className="text-[14px] leading-[1.35] tracking-[-0.28px] text-brand">
                                            <span className="font-[600] underline underline-offset-[2px]">{request.username}</span>{" "}
                                            sent you a friend request
                                        </p>
                                    </div>

                                    <div className="mt-[14px] flex gap-[8px]">
                                        <button
                                            type="button"
                                            onClick={() => onReject(requestId)}
                                            disabled={isPending}
                                            className="flex-1 rounded-[14px] bg-white px-[14px] py-[12px] text-[14px] leading-none tracking-[-0.28px] text-brand disabled:opacity-60"
                                        >
                                            Decline
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onAccept(requestId)}
                                            disabled={isPending}
                                            className="flex-1 rounded-[14px] bg-brand px-[14px] py-[12px] text-[14px] leading-none tracking-[-0.28px] text-white disabled:opacity-60"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {mightAttendEvents.slice(0, 2).map((event) => (
                            <div
                                key={`might-${event._id}`}
                                className="rounded-[18px] bg-white/88 px-[16px] py-[14px] shadow-[0_8px_24px_rgba(107,40,94,0.05)]"
                            >
                                <p className="mb-[12px] text-[14px] leading-[1.35] tracking-[-0.28px] text-brand">
                                    <span className="font-[600] underline underline-offset-[2px]">
                                        {event.attendees[0]?.username || "Friend"}
                                    </span>{" "}
                                    wants to attend this event:
                                </p>
                                <FriendActivityCard event={event} />
                            </div>
                        ))}

                        {willAttendEvents.slice(0, 2).map((event) => (
                            <div
                                key={`will-${event._id}`}
                                className="rounded-[18px] bg-white/88 px-[16px] py-[14px] shadow-[0_8px_24px_rgba(107,40,94,0.05)]"
                            >
                                <p className="mb-[12px] text-[14px] leading-[1.35] tracking-[-0.28px] text-brand">
                                    <span className="font-[600] underline underline-offset-[2px]">
                                        {event.attendees[0]?.username || "Friend"}
                                    </span>{" "}
                                    is attending this event:
                                </p>
                                <FriendActivityCard event={event} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
