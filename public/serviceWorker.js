/* eslint-disable no-useless-escape */
/* eslint-disable no-undef */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.0.0/workbox-sw.js');
importScripts("https://arc.io/arc-sw-core.js");

workbox.setConfig({ debug: false });

// 
// https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.routing#registerRoute
workbox.routing.registerRoute(
    new RegExp('.*\.html/'),
    // https://developers.google.com/web/tools/workbox/reference-docs/latest/workbox.strategies
    workbox.strategies.cacheFirst({
        cacheName: 'workbox:html',
    })
);

// cache js files
workbox.routing.registerRoute(
    new RegExp('.*\.js'),
    workbox.strategies.cacheFirst({
        cacheName: 'workbox:js',
    })
);

// cache css files
workbox.routing.registerRoute(
    // Cache CSS files
    new RegExp('.*\.css'),
    // Use cache but update in the background ASAP
    workbox.strategies.cacheFirst({
        // Use a custom cache name
        cacheName: 'workbox:css',
    })
);

// cache generall images
workbox.routing.registerRoute(
    new RegExp('.*\.(?:png|jpg|jpeg|svg|gif)'),
    workbox.strategies.staleWhileRevalidate({
        // Use a custom cache name
        cacheName: 'workbox:image',
    })
);

// cache .ico files
workbox.routing.registerRoute(
    new RegExp('.*\.ico'),
    workbox.strategies.staleWhileRevalidate({
        // Use a custom cache name
        cacheName: 'workbox:image',
    })
);

// cache images from sky.lea.moe and craftatar
workbox.routing.registerRoute(
    // Cache image files
    new RegExp('(.*sky.lea.moe.*|.*crafatar.com\/avatars.*)'),
    // Use the cache if it's available
    workbox.strategies.staleWhileRevalidate({
        // Use a custom cache name
        cacheName: 'workbox:image',
    })
);