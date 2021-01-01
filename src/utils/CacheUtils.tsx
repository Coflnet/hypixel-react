import { get, set } from 'idb-keyval';



let cacheUtils: CacheUtils = {
    getFromCache: function (type: string, data: string) {
        return new Promise((resolve, reject) => {
            get(type + data).then(response => {
                if (response) {
                    let parsed = JSON.parse(response as string) as CacheEntry
                    if ( parsed.expireTimeStamp && (new Date()).getTime() < parsed.expireTimeStamp) {
                        console.log(parsed);
                        resolve(parsed.response)
                        return;
                    }
                }
                resolve(null);
            })
        })
    },
    setIntoCache: function (type: string, data: string, response: ServerCommandData,maxAge:number = 0): void {

        let entry : CacheEntry = {
            expireTimeStamp : (new Date()).getTime() + maxAge * 1000,
            response : response
        }
        console.log(entry);
        set(type + data, JSON.stringify(entry));
    }
}
export default cacheUtils

interface CacheEntry {
    expireTimeStamp:number;
    response:ServerCommandData;
}