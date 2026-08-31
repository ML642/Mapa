import React from 'react';
import { useAuthModal } from '../contexts/AuthModalContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AuthModal: React.FC = () => {
    const { showAuthModal, closeAuthModal } = useAuthModal();

    return (
        <AnimatePresence>
            {showAuthModal && (
                <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-[var(--color-brand-overlay)] p-4"
                >
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="surface-card-modal relative w-full max-w-[405px] rounded-[20px] p-6 text-center sm:rounded-[12px] sm:p-[32px]"
                        style={{
                            paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 0px))",
                            maxHeight: "min(92dvh, 640px)",
                            overflowY: "auto",
                        }}
                    >
                        <h2 className="mb-1 pr-10 text-left text-[16px] font-[500] leading-snug tracking-[-0.64px] text-brand sm:mb-[4px] sm:leading-[18px]">
                            This feature is available only to logged-in users
                        </h2>
                        <p className="mb-4 text-left text-[14px] font-[400] leading-snug tracking-[-0.28px] text-brand-muted sm:mb-[12px] sm:leading-[16px]">
                            Sign up or log in to save favorite events
                        </p>

                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:gap-[4px]">
                            <Link
                                to="/login"
                                onClick={closeAuthModal}
                                className="btn-soft flex w-full items-center justify-center rounded-[12px] py-[12px] text-[14px] font-[400] leading-[16px] tracking-[-0.28px]"
                            >
                                Log in
                            </Link>
                            <Link
                                to="/register"
                                onClick={closeAuthModal}
                                className="btn-secondary flex w-full items-center justify-center rounded-[12px] py-[12px] text-[14px] font-[400] leading-[16px] tracking-[-0.28px]"
                            >
                                Sign up
                            </Link>
                        </div>

                        <button
                            type="button"
                            onClick={closeAuthModal}
                            className="icon-button-surface absolute right-3 top-3 flex items-center justify-center rounded-full p-[6.5px] sm:right-[16px] sm:top-[16px]"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="11"
                                height="11"
                                viewBox="0 0 11 11"
                                fill="none"
                                className="text-brand"
                            >
                                <path
                                    d="M1 1L9.48528 9.48528"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M9.48438 1L0.999093 9.48528"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AuthModal;
