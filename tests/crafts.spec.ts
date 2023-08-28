import { test, expect } from '@playwright/test'
import { sleep } from './fixture'

test('Profitable craft page works', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Still working on it')
    await page.goto('/crafts')
    let element = page.getByText('The top 3 crafts can only be seen with starter premium or betterYou Cheated the ').first()
    await element.waitFor({ state: 'visible' })
    await page
        .getByRole('button', { name: /.*Crafting Cost: .*/ })
        .first()
        .click()
    await page.getByRole('heading', { name: 'Recipe' }).isVisible()
    await page
        .getByText(/\)[\.,\d]* Coins.*/)
        .first()
        .isVisible()
})
