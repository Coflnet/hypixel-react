export function wasAlreadyLoggedIn(){
    return localStorage.getItem("googleId") !== null;
}

export function getPackageName () {
    return 'de.flou.hypixel.skyblock';
} 