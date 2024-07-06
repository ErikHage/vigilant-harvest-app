import axios from "axios";

import { feralAuthenticationServiceUrl } from "@/utils/constants";

async function verifyApplicationToken(token) {
    try {
        await axios.post(`${feralAuthenticationServiceUrl.v0.auth}/tokens/applications/verify`, {
            appToken: token,
        }, {
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
    verifyApplicationToken,
};