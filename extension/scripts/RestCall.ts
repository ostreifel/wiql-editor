import { authTokenManager } from "VSS/Authentication/Services";
export function callApi<T>(
    url: string,
    method: string,
    headers: {[header: string]: string} | undefined,
    data: any | undefined,
    success: (response: T) => void,
    failure: (error: TfsError, errorThrown: string, status: number) => void,
) {
    VSS.getAccessToken().then((sessionToken) => {
        const authorizationHeaderValue = authTokenManager.getAuthorizationHeader(sessionToken);
        $.ajax({
            url,
            method,
            data: data || "",
            success: (respData, textStatus, jqueryXHR) => {
                success(respData);
            },
            error: (jqXHR, textStatus, errorThrown) => {
                if (jqXHR.responseJSON || 401 !== jqXHR.status && 403 !== jqXHR.status) {
                    if (jqXHR.responseJSON) {
                        failure(jqXHR.responseJSON, errorThrown, jqXHR.status);
                    } else {
                        failure({name: "CallFailure", message: "call failed with status code " + jqXHR.status}, errorThrown, jqXHR.status);
                    }
                } else {
                    failure({name: "AuthorizationFailure", message: "unauthorized call"}, errorThrown, jqXHR.status);
                }
            },
            beforeSend: (jqXHR) => {
                jqXHR.setRequestHeader("Authorization", authorizationHeaderValue);
                if (headers) {
                    for (const header in headers) {
                        jqXHR.setRequestHeader(header, headers[header]);
                    }
                }
            },
        } as JQueryAjaxSettings);
    });
}
