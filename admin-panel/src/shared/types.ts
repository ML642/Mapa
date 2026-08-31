export type Role =
  | 'deleted'
  | 'banned'
  | 'user'
  | 'creator'
  | 'moderator'
  | 'admin'
  | 'superadmin';

export type SubscriptionType = 'default' | 'premium' | 'pro';

export type EventStatus = 'active' | 'parsed' | 'inactive' | 'ignored' | 'deleted';

export type ToastTone = 'success' | 'error' | 'info';
export type ParserLaunchMode = 'full' | 'category';
export type ParserRunStatus = 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
export type ParserRunPhase = 'discovering' | 'filtering' | 'parsing' | 'completed' | 'cancelled' | '';

export interface EventModerationDiffEntry {
  current?: unknown;
  parsed?: unknown;
}

export interface EventModerationState {
  required?: boolean;
  queue?: string | null;
  state?: string | null;
  reason?: string | null;
  source?: string | null;
  runId?: string | null;
  diff?: Record<string, EventModerationDiffEntry>;
  lastReviewedAt?: string | null;
}

export interface EventParserMeta {
  source?: string | null;
  externalId?: string | null;
  version?: string | null;
  lastParsedAt?: string | null;
  lastRunId?: string | null;
}

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role?: Role;
  profilePicture?: string;
  bio?: string;
  isPublic?: boolean;
  isPayed?: boolean;
  type?: SubscriptionType;
  payedUntil?: string | null;
  friendCount?: number;
  pendingFriendRequestsCount?: number;
  favoritesCount?: number;
  willAttendCount?: number;
  mightAttendCount?: number;
  interests?: string[];
}

export interface HealthStatus {
  status: string;
  uptime: number;
  commit: string;
}

export interface EventItem {
  _id: string;
  title: string;
  description?: string;
  event_date?: string;
  event_dates?: string[];
  address: string;
  coordinates?: number[];
  category?: string;
  event_image?: string[];
  price?: number | null;
  price_description?: string;
  is_premium?: boolean;
  phone?: string;
  source?: string;
  status?: EventStatus;
  createdBy?: string;
  updatedBy?: string | null;
  moderation?: EventModerationState;
  parserMeta?: EventParserMeta;
  parseInfo?: Record<string, unknown>;
}

export interface ParserStats {
  created: number;
  updated_review: number;
  updated_auto: number;
  unchanged: number;
  ignored: number;
  skipped_existing: number;
  failed: number;
}

export interface ParserRunResponse {
  message: string;
  run: ParserRunRecord;
}

export interface ParserRunRecord {
  _id: string;
  source: string;
  mode: ParserLaunchMode;
  category?: string | null;
  categories?: string[];
  limit?: number | null;
  skipExisting?: boolean;
  requestedBy?: string;
  cancelRequested?: boolean;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  status: ParserRunStatus;
  progress: {
    total: number;
    completed: number;
    current?: string;
    currentCategory?: string;
    percentage: number;
    phase?: ParserRunPhase | string;
    discovered?: number;
    skippedExisting?: number;
  };
  stats: ParserStats;
  error?: {
    message?: string;
    stack?: string;
  };
  logs?: Array<{
    at: string;
    level: 'info' | 'warn' | 'error' | string;
    message: string;
  }>;
}

export interface EventsResponse {
  events: EventItem[];
  total: number;
  page?: number;
  totalPages?: number;
}

export interface UserLookupResult {
  id?: string;
  username: string;
  profilePicture?: string;
  mutualFriends?: number | unknown[];
  userId?: string;
}

export interface UserProfile {
  id?: string;
  username: string;
  email?: string;
  role?: Role;
  bio?: string;
  profilePicture?: string;
  isPublic?: boolean;
  isPayed?: boolean;
  type?: SubscriptionType;
  payedUntil?: string | null;
  friendCount?: number;
  mutualFriends?: number | unknown[];
  pendingFriendRequestsCount?: number;
  favoritesCount?: number;
  willAttendCount?: number;
  mightAttendCount?: number;
  interests?: string[];
}

export interface SessionSnapshot {
  accessToken: string | null;
  user: AuthUser | null;
}

export interface AuditRecord {
  id: string;
  actor: string;
  action: string;
  target: string;
  details?: string;
  createdAt: string;
  status: ToastTone;
}
