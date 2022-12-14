import { test, expect, Page } from '@playwright/test';

test('Player auction opens', async ({ page }) => {
  await page.goto('https://sky.coflnet.com/player/b876ec32e396476ba1158438d83c67d4');
  await page.getByRole('link', { name: /.*\[MAYOR\] Technoblade Ended Highest Bid: 400[,\.]000[,\.]000.* Starting Bid: 10.* End of Auction: .*/i }).click();
  await expect(page).toHaveURL(/.*\/auction\/73137bc47df84d31a9d8b010078ada0f/i);
});

test('Opens last bid', async ({ page }) => {
  await page.goto('https://sky.coflnet.com/player/b876ec32e396476ba1158438d83c67d4');
  await switchToBids(page);
  await page.getByRole('link', { name: /.*Jingle Bells Ended BIN Highest Bid: 620[,\.]000.* Highest Own: 0.* End of Auction: .*/i }).click();
  await expect(page).toHaveURL(/.*\/auction\/c5ce8b40320b4b178e53cdfb746d8953/i);
});

test('Scroll down to older bid', async ({ page }) => {
  await page.goto('https://sky.coflnet.com/player/b876ec32e396476ba1158438d83c67d4');
  await switchToBids(page);
  for (let i = 0; i < 500; i++) {
    await page.mouse.wheel(0, 5000);
    var inView = await page.getByRole('link', { name: /.*Cheap Coffee Ended BIN Highest Bid: 6[,\.]000.* Highest Own: 0.* End of Auction: .*2021/ }).isVisible();
    if (inView)
      break;
    await page.waitForTimeout(50);
  }
  await page.getByRole('link', { name: /.*Cheap Coffee Ended BIN Highest Bid: 6[,\.]000.* Highest Own: 0.* End of Auction: .*2021/ }).click();
});

async function switchToBids(page: Page) {
  // forces click to ignore google login popup
  await page.getByRole('group').getByText('Bids').click({ force: true, position: { x: 0, y: 0 } });
}
