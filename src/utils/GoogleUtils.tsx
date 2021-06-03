export function wasAlreadyLoggedIn() {
    return localStorage.getItem("googleId") !== null;
}

let refreshTimeout;

export function refreshTokenSetup(res) {

    //refresh has already been started
    if(refreshTimeout){
        return;
    }

    let refreshTiming = ((res.tokenObj.expires_in || 3600) - 5 * 60) * 1000;

    const refreshToken = () => {
        res.reloadAuthResponse().then(refreshToken => {
            localStorage.setItem('googleId', refreshToken.id_token);
            refreshTiming = (refreshToken.expires_in || 3600 - 5 * 60) * 1000;
            refreshTimeout = setTimeout(refreshToken, refreshTiming);
        });
    };

    refreshTimeout = setTimeout(refreshToken, refreshTiming);
}

export const googlePlayPackageName = 'de.flou.hypixel.skyblock';