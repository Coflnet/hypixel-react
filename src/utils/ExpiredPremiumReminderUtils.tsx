import { toast } from "react-toastify";
import api from "../api/ApiHelper";
import { wasAlreadyLoggedIn } from "./GoogleUtils";
import { getSetting, PREMIUM_EXPIRATION_NOFIFY_DATE_KEY, setSetting } from "./SettingsUtils";

export function checkForExpiredPremium() {

    let wasAlreadyLoggedInGoogle = wasAlreadyLoggedIn();
    let googleId = localStorage.getItem("googleId");

    if (!wasAlreadyLoggedInGoogle || !googleId) {
        return;
    }

    api.hasPremium(googleId).then(premiumExpirationDate => {
        let currentDate = new Date().getTime();
        if (premiumExpirationDate && premiumExpirationDate.getTime() < currentDate) {
            let lastNotifyString = getSetting(PREMIUM_EXPIRATION_NOFIFY_DATE_KEY)
            if (lastNotifyString === premiumExpirationDate.getTime().toString()) {
                return;
            }
            setSetting(PREMIUM_EXPIRATION_NOFIFY_DATE_KEY, premiumExpirationDate.getTime().toString())
            toast.warn("Your premium expired. Click here to renew it now.", {
                autoClose: 20000
            })
        }
    })
}

export const googlePlayPackageName = 'de.flou.hypixel.skyblock';