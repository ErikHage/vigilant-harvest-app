import axios from "axios";

import { withApiErrorHandling } from './error-handler';
import { feralAuthenticationServiceUrl, applicationId } from "@/utils/constants";

async function verifySsoToken(ssoToken) {
    try {
        const response = await axios.post(
            `${feralAuthenticationServiceUrl.v0}/tokens/sso/execute`,
            {
                applicationId,
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
        await axios.post(`${feralAuthenticationServiceUrl.v0}/tokens/verify`, {}, {
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
    verifySsoToken: withApiErrorHandling(verifySsoToken),
    verifyActorToken: withApiErrorHandling(verifyActorToken),
};