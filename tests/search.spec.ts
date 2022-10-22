import { test, expect } from '@playwright/test';

test('search player technoblade with special player search query', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Search player/item').click();
  await page.getByPlaceholder('Search player/item').fill('playertechnoblade');
  await page.getByPlaceholder('Search player/item').press('Enter');
  await expect(page).toHaveURL('/player/b876ec32e396476ba1158438d83c67d4');
});