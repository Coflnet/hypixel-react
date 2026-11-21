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
            const newUrlObj = new URL(newUrl, currentUrl)
            // Compare hostname, pathname, and search parameters
            return currentUrlObj.hostname === newUrlObj.hostname && currentUrlObj.pathname === newUrlObj.pathname
        }

        let restoreHistory: (() => void) | undefined

        function findClosestAnchor(element: HTMLElement | null): HTMLAnchorElement | null {
            while (element && element.tagName.toLowerCase() !== 'a') {
                element = element.parentElement
            }
            return element as HTMLAnchorElement
        }
        function finishProgress() {
            restoreHistory?.()
            NProgress.done()
            document.documentElement.classList.remove('nprogress-busy')
        }
        function watchHistory() {
            if (restoreHistory) return
            const { history } = window
            const { pushState, replaceState } = history
            const finishWith = (method: History['pushState']) => (...args: Parameters<History['pushState']>) => {
                finishProgress()
                return method.apply(history, args)
            }
            const push = finishWith(pushState)
            const replace = finishWith(replaceState)
            history.pushState = push
            history.replaceState = replace
            restoreHistory = () => {
                if (history.pushState === push) history.pushState = pushState
                if (history.replaceState === replace) history.replaceState = replaceState
                restoreHistory = undefined
            }
        }
        function loadUrl(newUrl: string, isExternalLink = false) {
            const currentUrl = window.location.href
            const isAnchor = isNoSufficientNavigation(currentUrl, newUrl)
            NProgress.start()
            if (newUrl === currentUrl || isAnchor || isExternalLink) {
                finishProgress()
                return
            }
            watchHistory()
        }
        function handleClick(event: MouseEvent) {
            if (event.defaultPrevented) return
            try {
                const anchor = findClosestAnchor(event.target as HTMLElement)
                if (!anchor || (anchor.protocol !== 'http:' && anchor.protocol !== 'https:')) return
                loadUrl(anchor.href, anchor.target === '_blank')
            } catch {
                finishProgress()
            }
        }
        function handleRouteStart(event: Event) {
            loadUrl((event as CustomEvent<string>).detail)
        }

        // Add the global click event listener
        document.addEventListener('click', handleClick)
        window.addEventListener('next-route-start', handleRouteStart)

        // Clean up the global click event listener when the component is unmounted
        return () => {
            document.removeEventListener('click', handleClick)
            window.removeEventListener('next-route-start', handleRouteStart)
            restoreHistory?.()
        }
    }, [])

    return styles
}
