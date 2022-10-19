import { test, expect } from '@playwright/test';
const basUrl = "http://localhost:3000";
test('test', async ({ page }) => {
  await page.goto(basUrl);
  await page.getByPlaceholder('Search player/item').click();
  await page.getByPlaceholder('Search player/item').fill('technoblade');
  await page.getByPlaceholder('Search player/item').press('Enter');
  await expect(page).toHaveURL(basUrl+'/player/b876ec32e396476ba1158438d83c67d4');
  await page.getByRole('heading', { name: 'TechnobladeYou? Claim account. Check tracked flips' }).getByText('Technoblade').click();
});