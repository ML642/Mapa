import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { commentsService, readSessionUserId, type EventComment } from '../../../../services';
import { getApiErrorMessage } from '../../../../utils/apiErrors';

const COMMENT_MAX_LENGTH = 1000;

const formatCommentDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const getCommentAuthorName = (comment: EventComment) => comment.author?.username || 'Deleted user';

export default function EventCardComments({ eventId, isAuthenticated }: { eventId: string; isAuthenticated: boolean }) {
    const queryClient = useQueryClient();
    const currentUserId = readSessionUserId();
    const [body, setBody] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);
    const commentsQueryKey = ['event-comments', eventId] as const;
    const { data, isLoading, error } = useQuery({
        queryKey: commentsQueryKey,
        queryFn: () => commentsService.getEventComments(eventId),
        enabled: Boolean(eventId),
        staleTime: 60_000,
    });

    const createMutation = useMutation({
        mutationFn: (nextBody: string) => commentsService.createEventComment(eventId, nextBody),
        onSuccess: () => {
            setBody('');
            setSubmitError(null);
            void queryClient.invalidateQueries({ queryKey: commentsQueryKey });
        },
        onError: (mutationError) => {
            setSubmitError(getApiErrorMessage(mutationError, { fallbackMessage: 'Could not post the comment.' }));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (commentId: string) => commentsService.deleteEventComment(eventId, commentId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: commentsQueryKey });
        },
    });

    const submitComment = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalizedBody = body.trim();
        if (!normalizedBody || createMutation.isPending) return;

        createMutation.mutate(normalizedBody);
    };

    const comments = data?.comments || [];

    return (
        <section className="mt-6 border-t border-brand-soft pt-5" aria-labelledby="event-comments-title">
            <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-brand" aria-hidden="true" />
                <h3 id="event-comments-title" className="text-[20px] font-[500] text-brand">
                    Comments{data ? ` (${data.total})` : ''}
                </h3>
            </div>

            {isAuthenticated ? (
                <form className="mt-3" onSubmit={submitComment}>
                    <label className="sr-only" htmlFor={`event-comment-${eventId}`}>New comment</label>
                    <textarea
                        id={`event-comment-${eventId}`}
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        maxLength={COMMENT_MAX_LENGTH}
                        rows={3}
                        placeholder="Share your thoughts"
                        className="app-input min-h-[82px] w-full resize-y rounded-xl px-3 py-2 text-[13px] text-brand outline-none"
                    />
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-brand-muted">{body.length}/{COMMENT_MAX_LENGTH}</span>
                        <button
                            type="submit"
                            disabled={!body.trim() || createMutation.isPending}
                            className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-[12px] text-white disabled:cursor-not-allowed disabled:opacity-55"
                        >
                            <Send className="h-3.5 w-3.5" aria-hidden="true" />
                            {createMutation.isPending ? 'Posting…' : 'Post'}
                        </button>
                    </div>
                    {submitError ? <p role="alert" className="mt-2 text-[12px] text-[var(--color-danger)]">{submitError}</p> : null}
                </form>
            ) : (
                <p className="mt-3 text-[13px] text-brand-muted">
                    <Link to="/login" className="text-brand underline underline-offset-2">Log in</Link> to leave a comment.
                </p>
            )}

            <div className="mt-4 flex flex-col divide-y divide-brand-soft">
                {isLoading ? <p className="py-3 text-[13px] text-brand-muted">Loading comments…</p> : null}
                {error ? <p role="alert" className="py-3 text-[13px] text-[var(--color-danger)]">Could not load comments.</p> : null}
                {!isLoading && !error && comments.length === 0 ? (
                    <p className="py-3 text-[13px] text-brand-muted">There are no comments yet. Be the first.</p>
                ) : null}
                {comments.map((comment) => {
                    const authorName = getCommentAuthorName(comment);
                    const canDelete = currentUserId === comment.author?._id;

                    return (
                        <article key={comment._id} className="py-3">
                            <div className="flex items-start gap-2">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-surface text-[11px] font-semibold text-brand" aria-hidden="true">
                                    {authorName.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate text-[13px] font-semibold text-brand">{authorName}</span>
                                        <time dateTime={comment.createdAt} className="shrink-0 text-[11px] text-brand-muted">{formatCommentDate(comment.createdAt)}</time>
                                    </div>
                                    <p className="mt-1 whitespace-pre-wrap break-words text-[13px] text-brand">{comment.body}</p>
                                </div>
                                {canDelete ? (
                                    <button
                                        type="button"
                                        onClick={() => deleteMutation.mutate(comment._id)}
                                        disabled={deleteMutation.isPending}
                                        className="shrink-0 rounded-md p-1 text-brand-muted hover:bg-brand-surface hover:text-[var(--color-danger)] disabled:opacity-50"
                                        aria-label="Delete comment"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                    </button>
                                ) : null}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
