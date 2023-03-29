import { test, expect } from './fixture';

test('auction contains relevant information', async ({ page }) => {
  await page.goto('/auction/73137bc47df84d31a9d8b010078ada0f');
  await page.getByText('Category: Misc').click();
  await page.getByText('Reforge:None').click();
  await page.getByText(/Auction Created:2.26.2022 .*/i).click();
  await page.getByText(/Item Created:2.2..2022 .*28.*/i).click();
  await page.getByText('None').nth(1).click();
  await page.locator('span').filter({ hasText: 'Captured Player:' }).first().click();
  await page.getByText('§d[MAYOR] Technoblade§f').click();
  await page.getByText('4819c569b116').click();
  await page.getByRole('paragraph').filter({ hasText: 'Soul Durability:11' }).locator('div').click();
  await page.getByText('§7Whitelisted§7').click();
  await page.getByRole('heading', { name: 'Starting bid: 10 Coins' }).click();
  await page.getByRole('button', { name: /bidder minecraft icon 400.000.000 Coins .* ago/ }).click();
  await expect(page).toHaveURL(/.*\/player\/0ae0f0282ee846fea7b1606a9fdf5128/i);
});
