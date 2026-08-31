import type { LucideIcon } from 'lucide-react';
import {
  Gauge,
  MapPinned,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Users,
} from 'lucide-react';

export const EVENT_CATEGORIES = [
  'Выставка',
  'Концерт',
  'Спектакль',
  'Фестиваль',
  'Музей',
  'Кино',
  'Спорт',
  'Образование',
  'Вечеринка',
  'Экскурсия',
  'Знакомства',
  'Квест',
  'Для детей',
  'Шоу',
  'Квиз',
  'Другое',
] as const;

export const EVENT_CATEGORY_LABELS: Record<string, string> = {
  Выставка: 'Exhibition',
  Концерт: 'Concert',
  Спектакль: 'Theater',
  Фестиваль: 'Festival',
  Музей: 'Museum',
  Кино: 'Cinema',
  Спорт: 'Sport',
  Образование: 'Education',
  Вечеринка: 'Party',
  Экскурсия: 'Tour',
  Знакомства: 'Dating',
  Квест: 'Quest',
  'Для детей': 'Kids',
  Шоу: 'Show',
  Квиз: 'Quiz',
  Другое: 'Other',
  'Новый год': 'New Year',
  Бесплатные: 'Free',
  Стендап: 'Stand-up',
  Мероприятие: 'Event',
  Квизы: 'Quizzes',
  Разное: 'Miscellaneous',
};

export const ROLE_OPTIONS = [
  'deleted',
  'banned',
  'user',
  'creator',
  'moderator',
  'admin',
  'superadmin',
] as const;

export const PAGE_SIZE_OPTIONS = [10, 20, 40, 80] as const;

export const NAV_ITEMS: Array<{
  label: string;
  path: string;
  icon: LucideIcon;
}> = [
  { label: 'Dashboard', path: '/dashboard', icon: Gauge },
  { label: 'Events', path: '/events', icon: MapPinned },
  { label: 'Users', path: '/users', icon: Users },
  { label: 'Quality', path: '/complaints', icon: ShieldAlert },
  { label: 'Audit', path: '/audit', icon: ShieldCheck },
  { label: 'Settings', path: '/settings', icon: SlidersHorizontal },
];
