import { test, expect } from '@playwright/test';

test('Profitable craft page works', async ({ page, browserName }) => {
  test.skip(browserName === 'firefox', 'Still working on it');
  await page.goto('/');
  await page.getByTestId('MenuIcon').click();
  await page.getByRole('link', { name: 'Profitable crafts' }).click();
  await page.getByText('The top 3 crafts can only be seen with starter premium or betterYou Cheated the ').first().click();
  await page.getByRole('button', { name: /.*Crafting-Cost: .*/ }).first().click();
  await page.getByRole('heading', { name: 'Recipe' }).click();
  const [page1] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByText(/.*\)[\.,\d]* Coins.*/).first().click()
  ]);
  await expect(page1).toHaveURL(/.*\/item\/.*/i);
});