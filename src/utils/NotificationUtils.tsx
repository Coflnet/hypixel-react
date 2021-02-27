import { toast } from "react-toastify";
import cacheUtils from "./CacheUtils";

export default function registerCallback(history)  {
    var interval = setInterval(function() {
        // wait until messaging is definded
        let messaging = (window as any).messaging;
        if (typeof messaging == 'undefined') return;
        clearInterval(interval);
    
        messaging.onMessage(function (payload) {
            console.log("on Message", payload);
            let notification = payload.notification;
            if(payload.data.type == "auction")
            {
                savePayloadIntoCache(payload);
            }
            displayNotification(notification);
        });
    }, 10);

    function displayNotification(notification: any) {
        toast.info(notification.title + "\n" + notification.body, {
            onClick: () => {
                history.push(
                    '/' + notification.click_action.match(/\/\/[^\/]+\/([^\.]+)/)[1]
                );
            },
            autoClose: 20000
        });
    }

    function savePayloadIntoCache(payload: any) {
        var auction = JSON.parse(payload.data.auction);
        cacheUtils.setIntoCache("auctionDetails", JSON.stringify(auction.uuid), auction, 60);
    }
}