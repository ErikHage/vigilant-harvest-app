import axios from "axios";

import { feralAuthenticationServiceUrl } from "@/utils/constants";

async function verifyToken(token) {
    try {
        await axios.post(`${feralAuthenticationServiceUrl.v0.auth}/tokens/verify`, {}, {
            headers: {
                'x-feral-auth-token': token,
            },
        });
    } catch (err) {
        console.log('token is invalid');
        return false;
    }

    return true;
}

export default {
    verifyToken,
};