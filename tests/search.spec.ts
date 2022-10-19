import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Search player/item').click();
  await page.getByPlaceholder('Search player/item').fill('technoblade');
  await page.getByPlaceholder('Search player/item').press('Enter');
  await expect(page).toHaveURL('/player/b876ec32e396476ba1158438d83c67d4');
  await page.getByRole('heading', { name: 'TechnobladeYou? Claim account. Check tracked flips' }).getByText('Technoblade').click();
});