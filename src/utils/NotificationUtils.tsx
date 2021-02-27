import { toast } from "react-toastify";

export default function registerCallback(history)  {
    setTimeout(() => {
        (window as any).messaging.onMessage(function (payload) {
            // TODO: show the notification on the site
            console.log("on Message", payload);
            let notification = payload.notification;
            console.log(notification.click_action.match(/\/\/[^\/]+\/([^\.]+)/)[1])
            toast.info(notification.title + "\n" + notification.body, {
                onClick: () => {
                    history.push({
                        pathname: '/' + notification.click_action.match(/\/\/[^\/]+\/([^\.]+)/)[1]
                    })
                },
                autoClose: 20000
            })
        });
    },500);
}