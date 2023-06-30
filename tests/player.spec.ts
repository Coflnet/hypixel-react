import { Page } from '@playwright/test'
import { expect, sleep, test } from './fixture'

test('Player auction opens', async ({ page }) => {
    await page.goto('/player/b876ec32e396476ba1158438d83c67d4')
    await page.getByText('Highest Bid').first().click()
    await expect(page).toHaveURL(/.*\/auction\/73137bc47df84d31a9d8b010078ada0f/i)
})

test('Opens last bid', async ({ page }) => {
    await page.goto('/player/b876ec32e396476ba1158438d83c67d4')
    await switchToBids(page)
    await page.getByText('Highest Bid').first().click()
    await expect(page).toHaveURL(/.*\/auction\/c5ce8b40320b4b178e53cdfb746d8953/i)
})

test('Scroll down to older bid', async ({ page, isMobile, browserName }) => {
    test.skip(isMobile, 'Scrolling is not reliably on mobile')
    await page.goto('/player/b876ec32e396476ba1158438d83c67d4')
    await switchToBids(page)
    while (true) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        await page.waitForResponse(resp => resp.url().includes('/bids?page='))
        await sleep(500)
        var inView = await page
            .getByRole('link', { name: /.*Cheap Coffee Ended BIN Highest Bid: 6[,\.]000.* Highest Own: 6[,\.]000.* End of Auction: .*2021/ })
            .isVisible()
        if (inView) break
    }
    await page.getByRole('link', { name: /.*Cheap Coffee Ended BIN Highest Bid: 6[,\.]000.* Highest Own: 6[,\.]000.* End of Auction: .*2021/ }).isVisible()
})

async function switchToBids(page: Page) {
    while (true) {
        let bidsButtons = page.getByText('Bids', { exact: true })
        let classes = await bidsButtons.getAttribute('class')
        if (classes?.split(' ').includes('btn-primary')) {
            return
        }
        // forces click to ignore google login popup
        await bidsButtons.click({ force: true, position: { x: 10, y: 10 } })
        await sleep(500)
    }
}
