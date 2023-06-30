import { test, expect } from './fixture'

test('open item with sharpness 5', async ({ page, isMobile }) => {
    // Skip for mobile as scrolling is weird there
    test.skip(isMobile, 'Scrolling does not reliably work on mobile')
    await page.goto('/item/ASPECT_OF_THE_DRAGON')
    await page.getByRole('link', { name: 'Add Filter' }).click()
    await page.getByPlaceholder('Add filter').fill('shar')
    await page.getByRole('option', { name: 'Sharpness' }).click()
    await page.locator('form').filter({ hasText: 'SharpnessPlease fill the filter or remove it' }).getByRole('textbox').focus()
    await page.locator('form').filter({ hasText: 'SharpnessPlease fill the filter or remove it' }).getByRole('textbox').fill('5')
    let locator = page.locator('text=/ended.*ago/i').first()
    await locator.waitFor({ state: 'attached', timeout: 10000 })
    await locator.click()
    await expect(page).toHaveURL(/.*\/auction\/.*/i)
    // really has sharpness 5
    await page.getByText('Sharpness 5').isVisible()
})
