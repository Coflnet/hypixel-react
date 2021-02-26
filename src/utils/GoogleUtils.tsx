export function wasAlreadyLoggedIn(){
    return localStorage.getItem("googleId") !== null;
}

export const googlePlayPackageName = 'de.flou.hypixel.skyblock';