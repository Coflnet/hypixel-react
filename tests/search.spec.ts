import { test, expect } from '@playwright/test'

test('search player technoblade with special player search query', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Search player/item').click()
    await page.getByPlaceholder('Search player/item').fill('playertechnoblade')
    await page.getByPlaceholder('Search player/item').press('Enter')
    await expect(page).toHaveURL('/player/b876ec32e396476ba1158438d83c67d4')
})

test('search for grappling hook and open reference', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Search player/item').fill('grapp')
    await page.getByPlaceholder('Search player/item').press('Enter')
    await page.locator('text=/ended.*ago/i').nth(3).click()
    // loaded auction page
    await expect(page).toHaveURL(/.*\/auction\/.*/i)
    // loaded item page
    await page.getByText('Enchantments:None').click()
    await page.getByRole('button').filter({ hasText: 'Compare to ended auctions' }).click()
    await expect(page.locator('.modal-title')).toHaveText('Similar auctions from the past')
})

test('search aspect of the dragon from auction page', async ({ page }) => {
    await page.goto('/auction/06f2c2033f4749708fbf921abfdddbf5')
    await page.getByPlaceholder('Search player/item').click()
    await page.getByPlaceholder('Search player/item').fill('aspect of the d')
    await page.getByPlaceholder('Search player/item').press('Enter')
})
