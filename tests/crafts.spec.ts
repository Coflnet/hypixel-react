import { test, expect } from '@playwright/test';

test('Profitable craft page works', async ({ page, browserName }) => {
  test.skip(browserName === 'firefox', 'Still working on it');
  await page.goto('/crafts');
  await page.getByText('The top 3 crafts can only be seen with starter premium or betterYou Cheated the ').first().isVisible();
  await page.getByRole('button', { name: /.*Crafting Cost: .*/ }).first().click();
  await page.getByRole('heading', { name: 'Recipe' }).isVisible();
  await page.getByText(/\)[\.,\d]* Coins.*/).first().isVisible()
});