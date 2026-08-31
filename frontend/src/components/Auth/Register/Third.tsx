import React, { useState } from 'react';
const exhibitions = "/icons/auth/exhibitions.svg";
const music = "/icons/auth/music.svg";
const theatre = "/icons/auth/theatre.svg";
const festival = "/icons/auth/festival.svg";
const museum = "/icons/auth/museum.svg";
const sport = "/icons/auth/sport.svg";
const cinema = "/icons/auth/cinema.svg";
const clubs = "/icons/auth/clubs.svg";
const quests = "/icons/auth/quests.svg";
const education = "/icons/auth/education.svg";
const excursion = "/icons/auth/excursion.svg";
const children = "/icons/auth/children.svg";

interface UserData {
    username: string;
    email: string;
    password: string;
    agreement: boolean;
}

interface ThirdProps {
    onSubmit: (data: { email: string; categories: string[] }) => void;
    userData: UserData;
    updateUserData: (data: Partial<UserData>) => void;
}

const categories = [
    { id: 1, name: 'Выставки', label: 'Exhibitions', icon: exhibitions },
    { id: 2, name: 'Музеи', label: 'Museums', icon: museum },
    { id: 3, name: 'Фестивали', label: 'Festivals', icon: festival },
    { id: 4, name: 'Концерты', label: 'Concerts', icon: music },
    { id: 5, name: 'Спектакли', label: 'Theatre', icon: theatre },
    { id: 6, name: 'Кино', label: 'Cinema', icon: cinema },
    { id: 7, name: 'Спорт', label: 'Sport', icon: sport },
    { id: 8, name: 'Вечеринки', label: 'Parties', icon: clubs },
    { id: 9, name: 'Экскурсии', label: 'Tours', icon: excursion },
    { id: 10, name: 'Квесты', label: 'Quests', icon: quests },
    { id: 11, name: 'Образование', label: 'Education', icon: education },
    { id: 12, name: 'Для детей', label: 'For children', icon: children },
];

const Third = ({ onSubmit, userData }: ThirdProps) => {
    const [selectedCategories, setSelectedCategories] = useState<number[]>([1, 2, 3]);

    const toggleCategory = (id: number) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleFinish = () => {
        if (selectedCategories.length < 3) {
            alert('Select at least 3 categories.');
            return;
        }

        const selectedCategoryNames = categories
            .filter(cat => selectedCategories.includes(cat.id))
            .map(cat => cat.name);

        onSubmit({
            email: userData.email,
            categories: selectedCategoryNames,
        });
    };


    return (
        <div className='flex w-full min-h-0 flex-col'>
            <div className='flex flex-1 flex-col'>
                <h2 className='text-display mb-[12px] text-start text-[28px]'>
                    Interests
                </h2>
                <p className='w-full max-w-full text-[12px] font-[400] tracking-[-0.48px] text-brand-border'>
                    Select at least 3 categories. This helps us tailor recommendations to your interests. You can change these categories later in your profile settings.
                </p>

                <div className='mt-[18px] flex w-full justify-center'>
                    <div className='flex w-full max-w-[352px] flex-wrap justify-center gap-[12px]'>
                        {categories.map(cat => {
                            const active = selectedCategories.includes(cat.id);
                            return (
                                <button
                                    type="button"
                                    key={cat.id}
                                    onClick={() => toggleCategory(cat.id)}
                                    className={`surface-card flex items-center gap-[6px] rounded-[36px] px-[12px] py-[8px] text-[12px] font-[400] tracking-[-0.48px] transition-all duration-200
                                    ${active
                                            ? 'border border-accent text-accent'
                                            : 'border border-transparent text-brand'
                                        }`}
                                >
                                    <span
                                        aria-hidden="true"
                                        className={`h-[16px] w-[16px] shrink-0 ${active ? 'bg-accent' : 'bg-brand'}`}
                                        style={{
                                            WebkitMask: `url(${cat.icon}) center / contain no-repeat`,
                                            mask: `url(${cat.icon}) center / contain no-repeat`,
                                        }}
                                    />
                                    <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className='mt-[28px]'>
                <button
                    type="button"
                    onClick={handleFinish}
                    disabled={selectedCategories.length < 3}
                    className='btn-secondary flex w-full items-center justify-center rounded-[12px] px-[20px] py-[12px] text-center text-[12px] font-[400] tracking-[-0.48px]'
                >
                    Complete registration
                </button>
            </div>
        </div>
    );
};

export default Third;
