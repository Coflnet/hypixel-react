export default function askForNotificationPermissons(): Promise<string> {
    return new Promise((resolve, reject) => {
        let token = localStorage.getItem('fcmToken');
        if (token) {
            resolve(token as string);
        }
        // Retrieve an instance of Firebase Messaging so that it can handle background
        // messages.
        // @ts-ignore
        waitTilSet();
        function waitTilSet() {
            if (!(window as any).messaging) {
                setTimeout(waitTilSet, 50);//wait 50 millisecnds then recheck
                return;
            }
            (window as any).messaging.getToken({
                vapidKey: "BESZjJEHTRUVz5_8NW-jjOToWiSJFZHDzK9AYZP6No8cqGHkP7UQ_1XnEPqShuQtGj8lvtjBlkfoV86m_PadW30"
            }).then((token: string) => {
                localStorage.fcmToken = token;
                resolve(token);
            })
        };
    });

}