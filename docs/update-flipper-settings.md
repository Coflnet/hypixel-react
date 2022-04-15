This is what has to be changed/checked if a new settings for the flipper (the subFlip-command) is added

## ApiHelper.tsx
In the function  `subscribeFlips`, the setting has to be put into `requestData` and mapped to the according backend property.
This used, to set the initial settings for logged in users (which from that point on will have their settings saved on the server) or 
to set the settings for users that are not logged in.

## SettingsUtils.tsx
In the function `setSettingsChangedData`, the setting has to be mapped from the backend propertie to the UI property.
This is used when the UI has to update the settings because the backend sent a `settingsUpdate` event.

## FlipUtils.tsx
In the function `getFlipCustomizeSettings` the default values for the `flipCustomizeSettings` are set.

## Setting Implementation
The file where the user input for the setting is implemented (most likely `FlipCustomize.tsx` or `FlipperFilter.tsx`).
This implementation has to set the settings into the localStorage, update the filter in the current state and call `api.setFlipSetting(key, value)` with the backend property name as key.

## Info: Names
Because of historic reasons a lot of properties in the UI start with the prefix **hide**. In the backend theses properties start with **show**.
Therefore they are negated before (most likely in the event handler call in the `FlipCustomize.tsx` file).
Backend properties are prefixed like this:
- Visibility properties: **show** (eg. showProfit)
- Mod properties: **mod** (eg. modChat)