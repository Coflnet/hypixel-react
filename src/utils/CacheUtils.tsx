import React from 'react';
import { Spinner } from "react-bootstrap";
import { get, set, keys } from 'idb-keyval';
import { Base64 } from 'js-base64';



let cacheUtils: CacheUtils = {
    getFromCache: function (type: string, data: string) {
        return new Promise((resolve, reject) => {
            get(type + data).then(response => {
                if (response)
                    resolve(JSON.parse(response as string))
                else
                    resolve(null);
            })
        })
    },
    setIntoCache: function (type: string, data: string, response: any): void {
        set(type + data, JSON.stringify(response));
    }
}
export default cacheUtils