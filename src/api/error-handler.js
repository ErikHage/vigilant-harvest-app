import axios from "axios";

export class ApiError extends Error {
    constructor(message, status, data, options) {
        super(message, options);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

export function withApiErrorHandling(fn) {
    return async function (...args) {
        try {
            return await fn(...args);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new ApiError(
                    error.message,
                    error.response ? error.response.status : null,
                    error.response ? error.response.data : null
                );
            } else {
                // not an HTTP failure, so there is no status or body, as with no answer
                throw new ApiError(error.message, null, null, { cause: error });
            }
        }
    };
}