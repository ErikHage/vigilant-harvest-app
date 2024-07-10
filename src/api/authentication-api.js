import axios from "axios";

import { feralAuthenticationServiceUrl, applicationId } from "@/utils/constants";

async function verifySsoToken(ssoToken) {
    try {
        const response = await axios.post(
            `${feralAuthenticationServiceUrl.v0.auth}/tokens/applications/${applicationId}/execute`,
            {
                ssoToken,
            },
        );
        return response.data.token;
    } catch (err) {
        console.log('token is invalid');
        throw err;
    }
}

async function verifyActorToken(actorToken) {
    try {
        await axios.post(`${feralAuthenticationServiceUrl.v0.auth}/tokens/verify`, {}, {
            headers: {
                'x-feral-auth-token': actorToken,
            },
        });
    } catch (err) {
        console.log('token is invalid');
        return false;
    }

    return true;
}

export default {
    verifySsoToken,
    verifyActorToken,
};