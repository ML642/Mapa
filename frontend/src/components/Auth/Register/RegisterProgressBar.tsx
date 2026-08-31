import { motion } from "framer-motion";

export default function RegisterProgressBar({ step }: { step: number }) {
    return (
        <div className="flex flex-col w-full">
            <div className="relative mx-auto mb-1 w-full max-w-[300px]">
                <div className="absolute left-[16.6667%] right-[16.6667%] top-[5px] h-[3px] rounded-full bg-brand-border" />
                <div className="grid grid-cols-3">
                    {[1, 2, 3].map((stepNumber) => (
                    <div key={stepNumber} className="flex items-center justify-center">
                        <div className="relative flex items-center justify-center">
                            <motion.div
                                className={`w-3 h-3 rounded-full z-10 ${stepNumber === step ? 'bg-accent' : 'bg-brand-border'}`}
                                initial={false}
                                animate={{
                                    scale: stepNumber === step ? 1.2 : 1,
                                    backgroundColor: stepNumber === step ? 'var(--color-accent)' : 'var(--color-brand-border)'
                                }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                            />
                        </div>

                    </div>
                    ))}
                </div>
            </div>

            <div className="mx-auto mt-1 grid w-full max-w-[300px] grid-cols-3">
                {[1, 2, 3].map((stepNumber) => (
                    <motion.span
                        key={stepNumber}
                        className={`min-w-0 whitespace-nowrap text-center text-[10px] font-[400] tracking-[-0.48px] max-[359px]:text-[9px] max-[359px]:tracking-[-0.4px] sm:text-[12px] ${stepNumber === step ? "text-accent" : "text-brand-border"}`}
                        initial={false}
                        animate={{ color: stepNumber === step ? 'var(--color-accent)' : 'var(--color-brand-border)' }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        {stepNumber === 1 && 'Details'}
                        {stepNumber === 2 && 'Verification'}
                        {stepNumber === 3 && 'Preferences'}
                    </motion.span>
                ))}
            </div>
        </div>
    );
}
