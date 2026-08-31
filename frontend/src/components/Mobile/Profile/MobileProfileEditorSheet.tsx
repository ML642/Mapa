import type { ChangeEvent, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { CloseSmallIcon } from '../../Icons/CommonIcons';
import { getMobileCategoryLabel } from '../Filters/MobileFilterOptions';

type ProfileFormState = {
    username: string;
    bio: string;
    isPublic: boolean;
};

export default function MobileProfileEditorSheet({
    avatarUrl,
    fileInputRef,
    form,
    interestOptions,
    mode,
    onAvatarSelect,
    onClose,
    onFieldChange,
    onSave,
    onToggleInterest,
    profileUsername,
    saveError,
    saving,
    selectedInterests,
    successMessage,
}: {
    avatarUrl: string;
    fileInputRef: RefObject<HTMLInputElement | null>;
    form: ProfileFormState;
    interestOptions: readonly string[];
    mode: 'edit' | 'settings' | null;
    onAvatarSelect: (event: ChangeEvent<HTMLInputElement>) => void;
    onClose: () => void;
    onFieldChange: (field: keyof ProfileFormState, value: string | boolean) => void;
    onSave: () => Promise<void>;
    onToggleInterest: (interest: string) => void;
    profileUsername: string;
    saveError: string | null;
    saving: boolean;
    selectedInterests: string[];
    successMessage: string | null;
}) {
    if (!mode || typeof document === 'undefined') {
        return null;
    }

    const title = mode === 'settings' ? 'Settings' : 'Edit profile';

    return createPortal(
        <section className="fixed inset-0 z-[120] flex flex-col bg-white">
            <header
                className="flex items-center justify-between border-b border-[rgba(107,40,94,0.12)] px-[18px] pb-[14px]"
                style={{ paddingTop: 'max(18px, env(safe-area-inset-top, 0px))' }}
            >
                <p className="text-[22px] font-[600] leading-none tracking-[-0.66px] text-brand">
                    {title}
                </p>

                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-white text-brand shadow-[0_4px_16px_rgba(107,40,94,0.08)]"
                    aria-label="Close"
                >
                    <CloseSmallIcon className="h-[12px] w-[12px] text-brand" />
                </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-[18px] py-[18px]">
                <div className="flex flex-col gap-[16px]">
                    <div className="rounded-[18px] bg-[var(--color-brand-surface)] px-[14px] py-[14px]">
                        <div className="flex items-center gap-[14px]">
                            <div className="flex h-[78px] w-[78px] items-center justify-center overflow-hidden rounded-full bg-brand">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={`Avatar: ${profileUsername}`} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-[26px] text-surface-page">
                                        {profileUsername.trim().charAt(0).toUpperCase() || '?'}
                                    </span>
                                )}
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
                                <div className="flex flex-col gap-[4px]">
                                    <p className="text-[16px] font-[600] tracking-[-0.32px] text-brand">Profile photo</p>
                                    <p className="text-[13px] leading-[1.45] tracking-[-0.26px] text-brand-muted">
                                        Supported formats: jpg, png, and webp. Maximum 5 MB.
                                    </p>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp,image/jpg"
                                    className="hidden"
                                    onChange={onAvatarSelect}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex w-fit min-h-[38px] items-center justify-center rounded-[12px] bg-brand px-[14px] py-[10px] text-[14px] tracking-[-0.28px] text-surface-page"
                                >
                                    Upload photo
                                </button>
                            </div>
                        </div>
                    </div>

                    {(saveError || successMessage) && (
                        <div
                            className={`rounded-[16px] px-[14px] py-[12px] text-[14px] tracking-[-0.28px] ${
                                saveError
                                    ? 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]'
                                    : 'bg-accent-soft text-brand'
                            }`}
                        >
                            {saveError || successMessage}
                        </div>
                    )}

                    <label className="flex flex-col gap-[8px]">
                        <span className="text-[14px] tracking-[-0.28px] text-brand">Username</span>
                        <input
                            type="text"
                            value={form.username}
                            maxLength={40}
                            className="app-input min-h-[48px] rounded-[14px] px-[16px] py-[12px] text-[14px] tracking-[-0.28px] outline-none"
                            placeholder="Enter username"
                            onChange={(event) => onFieldChange('username', event.target.value)}
                        />
                    </label>

                    <label className="flex flex-col gap-[8px]">
                        <span className="text-[14px] tracking-[-0.28px] text-brand">About me</span>
                        <textarea
                            value={form.bio}
                            maxLength={280}
                            rows={5}
                            className="app-input min-h-[120px] resize-none rounded-[14px] px-[16px] py-[12px] text-[14px] tracking-[-0.28px] outline-none"
                            placeholder="Tell us briefly about your interests"
                            onChange={(event) => onFieldChange('bio', event.target.value)}
                        />
                        <span className="text-[12px] tracking-[-0.24px] text-brand-muted">
                            {form.bio.replace(/\r\n/g, '\n').trim().length}/280
                        </span>
                    </label>

                    <div className="rounded-[18px] bg-[var(--color-brand-surface)] px-[14px] py-[14px]">
                        <div className="flex items-start justify-between gap-[12px]">
                            <div className="flex flex-col gap-[4px]">
                                <p className="text-[16px] font-[600] tracking-[-0.32px] text-brand">Profile visibility</p>
                                <p className="text-[13px] leading-[1.45] tracking-[-0.26px] text-brand-muted">
                                    A public profile is visible to other users without adding them as friends.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => onFieldChange('isPublic', !form.isPublic)}
                                className={`relative h-[30px] w-[52px] shrink-0 rounded-full transition ${
                                    form.isPublic ? 'bg-accent' : 'bg-brand-border'
                                }`}
                                aria-label={form.isPublic ? 'Make profile private' : 'Make profile public'}
                            >
                                <span
                                    className={`absolute top-[3px] h-[24px] w-[24px] rounded-full bg-white shadow transition ${
                                        form.isPublic ? 'left-[25px]' : 'left-[3px]'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-[10px]">
                        <div className="flex flex-col gap-[4px]">
                            <p className="text-[16px] font-[600] tracking-[-0.32px] text-brand">Interests</p>
                            <p className="text-[13px] tracking-[-0.26px] text-brand-muted">
                                These categories are used for recommendations and event suggestions.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-[8px]">
                            {interestOptions.map((interest) => {
                                const selected = selectedInterests.includes(interest);

                                return (
                                    <button
                                        key={interest}
                                        type="button"
                                        onClick={() => onToggleInterest(interest)}
                                        className={`inline-flex items-center rounded-full px-[14px] py-[10px] text-[14px] tracking-[-0.28px] transition ${
                                            selected
                                                ? 'gap-[6px] border border-accent bg-accent-soft text-accent'
                                                : 'bg-brand-surface text-brand'
                                        }`}
                                    >
                                        {getMobileCategoryLabel(interest)}
                                        {selected ? <span className="text-[12px] leading-none">×</span> : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <footer
                className="border-t border-[rgba(107,40,94,0.12)] px-[18px] py-[14px]"
                style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom, 0px))' }}
            >
                <div className="flex justify-end gap-[8px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex min-h-[38px] items-center justify-center rounded-[12px] bg-[var(--color-brand-surface)] px-[16px] py-[10px] text-[14px] tracking-[-0.28px] text-brand"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => void onSave()}
                        disabled={saving}
                        className="inline-flex min-h-[38px] items-center justify-center rounded-[12px] bg-brand px-[16px] py-[10px] text-[14px] tracking-[-0.28px] text-surface-page disabled:opacity-60"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </footer>
        </section>,
        document.body,
    );
}
