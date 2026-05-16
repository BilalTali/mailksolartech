// ====== Notification ======
export interface Notification {
    id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
}

// ====== Settings ======
export interface Setting {
    id: number;
    key: string;
    value: string | null;
    group: string | null;
}

// ====== API Response Wrapper ======
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data: T;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}
