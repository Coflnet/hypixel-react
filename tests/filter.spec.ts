import { test, expect } from './fixture'

test('test', async ({ page, browserName, isMobile }) => {
    // Mobile Safari cant open the page for some reason
    test.skip(browserName === 'webkit' && isMobile, 'Scrolling is not supported on mobile safari')
    await page.goto('/item/ASPECT_OF_THE_DRAGON')
    await page.getByRole('link', { name: 'Add Filter' }).click()
    await page.getByPlaceholder('Add filter').fill('shar')
    await page.getByRole('option', { name: 'sharpness' }).click()
    await page.locator('form').filter({ hasText: 'sharpness01234567' }).getByRole('textbox').click()
    await page.locator('form').filter({ hasText: 'sharpness01234567' }).getByRole('textbox').fill('5')
    await page.locator('text=/ended.*ago/i').first().click({ force: true })
    await expect(page).toHaveURL(/.*\/auction\/.*/i)
    // realy has sharpness 5
    await page.getByText('Sharpness 5').click()
})
