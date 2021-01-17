export default async function askForNotificationPermissons() {

    // Retrieve an instance of Firebase Messaging so that it can handle background
    // messages.
    // @ts-ignore
    let token = await window.messaging.getToken({
        vapidKey: "BESZjJEHTRUVz5_8NW-jjOToWiSJFZHDzK9AYZP6No8cqGHkP7UQ_1XnEPqShuQtGj8lvtjBlkfoV86m_PadW30"
    });
    localStorage.fcmToken = token;

}