import { test as base } from '@playwright/test'

export const test = base.extend({
    page: async ({ page }, use) => {
        await page.route('**/*.{png,jpg,jpeg}', route => route.abort())
        await page.route('**/icon/**', route => route.abort())
        await use(page)
    }
})
export { expect } from '@playwright/test'
