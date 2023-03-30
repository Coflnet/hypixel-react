import { test, expect } from './fixture'

test('search player technoblade with special player search query', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Search player/item').click()
    await page.getByPlaceholder('Search player/item').fill('playertechnoblade')
    await page.getByPlaceholder('Search player/item').press('Enter')
    await expect(page).toHaveURL('/player/b876ec32e396476ba1158438d83c67d4')
})

test('search for grappling hook and open reference', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Search player/item').fill('Grappling Hook')
    await page.getByPlaceholder('Search player/item').press('Enter')
    await expect(page).toHaveURL(/.*\/item\/.*/i)
    await page.locator('text=/ended.*ago/i').first().click({ force: true })
    // loaded auction page
    await expect(page).toHaveURL(/.*\/auction\/.*/i)
    // loaded item page
    await page.getByText('Enchantments:None').isVisible()
    await page.getByRole('button').filter({ hasText: 'Compare to ended auctions' }).click({ force: true })
    await expect(page.locator('.modal-title')).toHaveText('Similar auctions from the past')
})

test('search aspect of the dragon from auction page', async ({ page }) => {
    await page.goto('/auction/06f2c2033f4749708fbf921abfdddbf5')
    await page.getByPlaceholder('Search player/item').focus()
    await page.getByPlaceholder('Search player/item').fill('aspect of the d')
    await page.getByPlaceholder('Search player/item').press('Enter')
    await expect(page).toHaveURL(/.*\/item\/.*/i)
})
