import { get, set, clear } from 'idb-keyval';
import api from '../api/ApiHelper';



let cacheUtils: CacheUtils = {
    getFromCache: function (type: string, data: string) {
        return new Promise((resolve, reject) => {
            try {
                get(type + data).then(response => {
                    if (response) {
                        let parsed = JSON.parse(response as string) as CacheEntry
                        if (parsed.expireTimeStamp && (new Date()).getTime() < parsed.expireTimeStamp) {
                            resolve(parsed.response)
                            return;
                        }
                    }
                    resolve(null);
                }).catch(() => {
                    resolve(null);
                })
            } catch (error) {
                resolve(null);
            }
        })
    },
    setIntoCache: function (type: string, data: string, response: ApiResponse, maxAge: number = 0): void {

        try {
            let entry: CacheEntry = {
                expireTimeStamp: (new Date()).getTime() + maxAge * 1000,
                response: response
            }
            set(type + data, JSON.stringify(entry));
        } catch (error) {
            console.error(error);
        }
    },
    checkForCacheClear: function () {
        try {
            api.getVersion().then(version => {
                let localVersion = window.localStorage.getItem("version");
                if (window.caches !== undefined && localVersion !== version) {
                    // clear workbox caches
                    caches.keys().then(keys => {
                        keys.forEach(key => {
                            caches.delete(key);
                        })
                    });
                    // clear index db
                    clear();
                };
                window.localStorage.setItem("version", version);
            })
        } catch (error) {
            console.error(error);
        }
    }
}
export default cacheUtils

interface CacheEntry {
    expireTimeStamp: number;
    response: ApiResponse;
}