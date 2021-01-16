export function wasAlreadyLoggedIn(){
    return localStorage.getItem("googleId") !== null;
}