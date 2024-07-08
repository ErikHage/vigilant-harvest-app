import axios from "axios";

import { feralAuthenticationServiceUrl, applicationId } from "@/utils/constants";

async function verifyApplicationToken(appToken) {
    try {
        const response = await axios.post(
            `${feralAuthenticationServiceUrl.v0.auth}/tokens/applications/${applicationId}/execute`,
            {
                appToken,
            },
        );
        return response.data.token;
    } catch (err) {
        console.log('token is invalid');
        throw err;
    }
}

export default {
    verifyApplicationToken,
};