import { test as base } from '@playwright/test'

export const test = base.extend({
    page: async ({ page }, use) => {
        // timeout to stretch out the tests for api limit
        await sleep(10000)
        await page.route('**/*.{png,jpg,jpeg}', route => route.abort())
        await page.route('**/_next/image**', route => route.abort())
        await use(page)
    }
})

export async function sleep(n: number) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(null)
        }, n)
    })
}

export { expect } from '@playwright/test'
