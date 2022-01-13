import { Base64 } from "js-base64";
import { toast } from "react-toastify";

export function wasAlreadyLoggedIn() {
    return localStorage.getItem("googleId") !== null;
}

let refreshTimeout;

export function refreshTokenSetup(res) {

    //refresh has already been started
    if (refreshTimeout) {
        return;
    }

    let refreshTiming = ((res.tokenObj.expires_in || 3600) - 5 * 60) * 1000;

    refreshTimeout = setTimeout(() => {
        refreshToken(res).then(token => {
            refreshTiming = (token.expires_in || 3600 - 5 * 60) * 1000;
            refreshTimeout = setTimeout(refreshToken, refreshTiming);
        })
    }, refreshTiming);
}

export function refreshToken(obj): Promise<any> {
    return new Promise((resolve, reject) => {
        obj.reloadAuthResponse().then(refreshToken => {
            localStorage.setItem('googleId', refreshToken.id_token);
            resolve(refreshToken);
        });
    });
}

export function getGoogleAccountInfo(): GoogleProfileInfo {
    let result = {
        email: localStorage.getItem("googleEmail"),
        name: localStorage.getItem("googleName"),
        imageUrl: localStorage.getItem("googleImageUrl")
    } as GoogleProfileInfo

    if (result.email && result.name) {
        return result;
    }

    let googleId = localStorage.getItem('googleId');
    if (googleId) {
        let parts = googleId.split('.');
        if (parts.length > 2) {
            try {
                let obj = JSON.parse(Base64.atob(parts[1]));
                result.email = result.email || obj.email;
                result.name = result.name || obj.name;
                result.imageUrl = result.imageUrl || obj.picture;
            } catch {
                toast.error("Google token could not be parsed. Name and email could not be received.")
            }
        }
    }

    return result;
}

export const googlePlayPackageName = 'de.flou.hypixel.skyblock';