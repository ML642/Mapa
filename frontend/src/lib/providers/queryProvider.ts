import { QueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false, 
            retry: (failureCount, error) => {
                if (isAxiosError(error) && error.response?.status === 401) {
                    return false;
                }

                return failureCount < 1;
            },
        },
    },
});
