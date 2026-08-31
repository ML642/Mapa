// Backend category keys are intentionally retained for API compatibility.
type CategoryTagStyle = {
    backgroundColor: string;
    icon?: string;
};

const LEGACY_OTHER_CATEGORY = String.fromCodePoint(0x434, 0x440, 0x443, 0x433, 0x43e, 0x435);

const CATEGORY_TAG_STYLES: Record<string, CategoryTagStyle> = {
    'выставка': { backgroundColor: '#E4A4EF', icon: '/icons/auth/exhibitions.svg' },
    'выставки': { backgroundColor: '#E4A4EF', icon: '/icons/auth/exhibitions.svg' },
    'музыка': { backgroundColor: '#FFE59A', icon: '/icons/auth/music.svg' },
    'концерт': { backgroundColor: '#FFE59A', icon: '/icons/auth/music.svg' },
    'концерты': { backgroundColor: '#FFE59A', icon: '/icons/auth/music.svg' },
    'театр': { backgroundColor: '#A7E1F4', icon: '/icons/auth/theatre.svg' },
    'спектакль': { backgroundColor: '#A7E1F4', icon: '/icons/auth/theatre.svg' },
    'спектакли': { backgroundColor: '#A7E1F4', icon: '/icons/auth/theatre.svg' },
    'фестиваль': { backgroundColor: '#FFD2A2', icon: '/icons/auth/festival.svg' },
    'фестивали': { backgroundColor: '#FFD2A2', icon: '/icons/auth/festival.svg' },
    'музей': { backgroundColor: '#E6DDE1', icon: '/icons/auth/museum.svg' },
    'музеи': { backgroundColor: '#E6DDE1', icon: '/icons/auth/museum.svg' },
    'кино': { backgroundColor: '#D8D3D6', icon: '/icons/auth/cinema.svg' },
    'спорт': { backgroundColor: '#F4BBC2', icon: '/icons/auth/sport.svg' },
    'образование': { backgroundColor: '#D8B1F5', icon: '/icons/auth/education.svg' },
    'клуб': { backgroundColor: '#ECA8DC', icon: '/icons/auth/clubs.svg' },
    'вечеринка': { backgroundColor: '#ECA8DC', icon: '/icons/auth/clubs.svg' },
    'вечеринки': { backgroundColor: '#ECA8DC', icon: '/icons/auth/clubs.svg' },
    'экскурсия': { backgroundColor: '#F9E6A9', icon: '/icons/auth/excursion.svg' },
    'экскурсии': { backgroundColor: '#F9E6A9', icon: '/icons/auth/excursion.svg' },
    'знакомства': { backgroundColor: '#F4BFDE' },
    'квест': { backgroundColor: '#D8F39B', icon: '/icons/auth/quests.svg' },
    'квесты': { backgroundColor: '#D8F39B', icon: '/icons/auth/quests.svg' },
    'для детей': { backgroundColor: '#F3E4F0', icon: '/icons/auth/children.svg' },
    'шоу': { backgroundColor: '#D2B6F2', icon: '/icons/show.svg' },
    'квиз': { backgroundColor: '#A9EBD5', icon: '/icons/auth/education.svg' },
    [LEGACY_OTHER_CATEGORY]: { backgroundColor: '#D8D3D6' },
};

const CATEGORY_LABELS: Record<string, string> = {
    'выставка': 'Exhibition',
    'выставки': 'Exhibitions',
    'музыка': 'Music',
    'концерт': 'Concert',
    'концерты': 'Concerts',
    'театр': 'Theater',
    'спектакль': 'Performance',
    'спектакли': 'Performances',
    'фестиваль': 'Festival',
    'фестивали': 'Festivals',
    'музей': 'Museum',
    'музеи': 'Museums',
    'кино': 'Cinema',
    'спорт': 'Sports',
    'образование': 'Education',
    'клуб': 'Club',
    'вечеринка': 'Party',
    'вечеринки': 'Parties',
    'экскурсия': 'Tour',
    'экскурсии': 'Tours',
    'знакомства': 'Meetups',
    'квест': 'Quest',
    'квесты': 'Quests',
    'для детей': 'For children',
    'шоу': 'Show',
    'квиз': 'Quiz',
    [LEGACY_OTHER_CATEGORY]: 'Other',
};

const normalizeCategoryKey = (category?: string) => category?.trim().toLocaleLowerCase('en-GB') ?? '';

export function getCategoryTagStyle(category?: string): CategoryTagStyle {
    return CATEGORY_TAG_STYLES[normalizeCategoryKey(category)] ?? {
        backgroundColor: 'var(--color-category-chip)',
    };
}

export function getCategoryLabel(category?: string) {
    const trimmedCategory = category?.trim() ?? '';
    return CATEGORY_LABELS[normalizeCategoryKey(trimmedCategory)] ?? trimmedCategory;
}
