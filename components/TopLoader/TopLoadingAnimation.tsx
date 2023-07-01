'use client'
import * as NProgress from 'nprogress'
import { useEffect } from 'react'
export default function TopLoadingAnimation() {
    const color = '#29d'
    const height = 3

    const styles = (
        <style>
            {`#nprogress{pointer-events:none}#nprogress .bar{background:${color};position:fixed;z-index:1031;top:0;left:0;width:100%;height:${height}px}#nprogress .peg{display:block;position:absolute;right:0;width:100px;height:100%;opacity:1;-webkit-transform:rotate(3deg) translate(0px,-4px);-ms-transform:rotate(3deg) translate(0px,-4px);transform:rotate(3deg) translate(0px,-4px)}#nprogress .spinner{display:block;position:fixed;z-index:1031;top:15px;right:15px}#nprogress .spinner-icon{width:18px;height:18px;box-sizing:border-box;border:2px solid transparent;border-top-color:${color};border-left-color:${color};border-radius:50%;-webkit-animation:nprogress-spinner 400ms linear infinite;animation:nprogress-spinner 400ms linear infinite}.nprogress-custom-parent{overflow:hidden;position:relative}.nprogress-custom-parent #nprogress .bar,.nprogress-custom-parent #nprogress .spinner{position:absolute}@-webkit-keyframes nprogress-spinner{0%{-webkit-transform:rotate(0deg)}100%{-webkit-transform:rotate(360deg)}}@keyframes nprogress-spinner{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}
        </style>
    )

    useEffect(() => {
        NProgress.configure({
            showSpinner: true,
            trickle: true,
            trickleSpeed: 200,
            minimum: 0.08,
            easing: 'ease',
            speed: 200
        })

        function isNoSufficientNavigation(currentUrl: string, newUrl: string) {
            const currentUrlObj = new URL(currentUrl)
            const newUrlObj = new URL(newUrl)
            // Compare hostname, pathname, and search parameters
            return currentUrlObj.hostname === newUrlObj.hostname && currentUrlObj.pathname === newUrlObj.pathname
        }

        // eslint-disable-next-line no-var
        var npgclass = document.querySelectorAll('html')
        function findClosestAnchor(element: HTMLElement | null): HTMLAnchorElement | null {
            while (element && element.tagName.toLowerCase() !== 'a') {
                element = element.parentElement
            }
            return element as HTMLAnchorElement
        }
        function handleClick(event: MouseEvent) {
            try {
                const target = event.target as HTMLElement
                const anchor = findClosestAnchor(target)
                if (anchor) {
                    const currentUrl = window.location.href
                    const newUrl = (anchor as HTMLAnchorElement).href
                    const isExternalLink = (anchor as HTMLAnchorElement).target === '_blank'
                    const isAnchor = isNoSufficientNavigation(currentUrl, newUrl)
                    if (newUrl === currentUrl || isAnchor || isExternalLink) {
                        NProgress.start()
                        NProgress.done()
                        ;[].forEach.call(npgclass, function (el: Element) {
                            el.classList.remove('nprogress-busy')
                        })
                    } else {
                        NProgress.start()
                        ;(function (history) {
                            const pushState = history.pushState
                            history.pushState = function () {
                                NProgress.done()
                                ;[].forEach.call(npgclass, function (el: Element) {
                                    el.classList.remove('nprogress-busy')
                                })
                                // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-explicit-any
                                return pushState.apply(history, arguments as any)
                            }
                        })(window.history)
                    }
                }
            } catch (err) {
                // Log the error in development only!
                // console.log('NextTopLoader error: ', err);
                NProgress.start()
                NProgress.done()
            }
        }

        // Add the global click event listener
        document.addEventListener('click', handleClick)

        // Clean up the global click event listener when the component is unmounted
        return () => {
            document.removeEventListener('click', handleClick)
        }
    }, [])

    return styles
}
