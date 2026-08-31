export interface RegisterInput {
    username: string;
    email: string;
    password: string;
}

export interface VerifyEmailInput {
    email: string;
    code: number;
    userAgent: string;
}

export interface VerifyEmailResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
    };
}

export interface LoginInput {
    email?: string;
    password?: string;
    userAgent?: string;
}

export interface LoginResult {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        username: string;
        email: string;
        role: string;
        profilePicture?: string;
        bio?: string;
        isPayed?: boolean;
        type?: string;
        payedUntil?: Date | null | undefined;
    };
}

export interface GoogleAuthResult extends LoginResult {
    isNewUser: boolean;
}   
