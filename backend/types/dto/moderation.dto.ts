export interface GetEventsModerationInput {
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
    page?: string | number;
    size?: string | number;
}

export interface GetParsedEventsModerationInput {
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string | number;
    size?: string | number;
}

export interface EventScheduleSession {
    startsAt?: string;
    time?: string;
}

export interface EventScheduleDay {
    date?: string | null;
    times?: string[];
    sessions?: EventScheduleSession[];
}

export interface UploadEventModerationInput {
    title: string;
    description?: string;
    event_dates?: string[];
    schedule?: EventScheduleDay[];
    dateDisplayMode?: 'sessions' | 'range' | 'permanent';
    dateRange?: {
        from: string;
        to?: string | null;
    };
    isPermanent?: boolean;
    address: string;
    coordinates: [number, number];
    category: string;
    is_premium: boolean;
    price?: number | null;
    price_description?: string;
    phone?: string;
    files: any[];
    userId: string;
}

export interface ApproveEventInput {
    eventId: string;
    userId: string;
}

export interface RejectParserReviewInput {
    eventId: string;
    userId: string;
}

export interface UploadEventImagesInput {
    eventId: string;
    files: any[];
    userId: string;
}

export interface DeleteEventImagesInput {
    eventId: string;
    imageIndexes: any[];
}

export interface ParseEventsInput {
    userId: string;
}

export interface ParseEventsByCategoryInput {
    category: string;
    size?: string | number;
    userId: string;
}
