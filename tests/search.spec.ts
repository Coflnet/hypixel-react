import { test, expect } from './fixture'

test('search player technoblade with special player search query', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Search player/item').click()
    await page.getByPlaceholder('Search player/item').fill('player technoblade')
    await page.getByPlaceholder('Search player/item').press('Enter')
    await expect(page).toHaveURL('/player/b876ec32e396476ba1158438d83c67d4')
    let playerText = page.getByText('Technoblade')
    expect(playerText !== undefined).toBeTruthy()
})

test('search item sheep pet', async ({ page }) => {
    await page.goto('/')
    await page.getByPlaceholder('Search player/item').click()
    await page.getByPlaceholder('Search player/item').fill('sheep pet')
    await page.getByPlaceholder('Search player/item').press('Enter')
    await expect(page).toHaveURL(/\/item\/PET_SHEEP(\?.*)?$/)
    let sheepText = await page.getByText('Sheep')
    expect(sheepText !== undefined).toBeTruthy()
})

test('search for grappling hook and open reference', async ({ page }) => {
    await page.goto('/item/GRAPPLING_HOOK')
    await page.locator('text=/ended.*ago/i').first().click()
    // loaded auction page
    await expect(page).toHaveURL(/.*\/auction\/.*/i)
    // loaded item page
    await page.getByText('Enchantments:None').isVisible()
    await page.getByRole('button').filter({ hasText: 'Compare to ended auctions' }).click()
    await expect(page.locator('.modal-title')).toHaveText('Similar auctions from the past')
})

test('search aspect of the dragon from auction page', async ({ page }) => {
    await page.goto('/auction/06f2c2033f4749708fbf921abfdddbf5')
    await page.getByPlaceholder('Search player/item').focus()
    await page.getByPlaceholder('Search player/item').fill('aspect of the d')
    await page.getByPlaceholder('Search player/item').press('Enter')
    await expect(page).toHaveURL(/.*\/item\/.*/i)
})
