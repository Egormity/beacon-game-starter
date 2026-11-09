import { expect, test } from '@playwright/test';

test('plays with real keyboard input, collects a cell, pauses, resumes and resets', async ({
  page,
}) => {
  // Software WebGL is much slower on very large canvases; gameplay is resolution-independent.
  await page.setViewportSize({ width: 800, height: 600 });
  const errors: string[] = [];
  const external: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4422')) external.push(request.url());
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('canvas')).toBeFocused();
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(1500);
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowUp');
  await expect(page.getByTestId('collected')).toHaveText('1', { timeout: 1500 });
  await page.keyboard.up('ArrowUp');
  await page.screenshot({ path: '.playwright/desktop-playing.png' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  const time = await page.locator('.timer').innerText();
  await page.waitForTimeout(1200);
  await expect(page.locator('.timer')).toHaveText(time);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('canvas')).toBeFocused();
  await page.keyboard.press('r');
  await expect(page.getByTestId('collected')).toHaveText('0');
  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Help' })).toBeFocused();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test('replaces levels and recovers from an actual WebGL context loss', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.getByRole('button', { name: /Choose island/ }).click();
  await page.getByRole('menuitemradio', { name: /Sky steps/ }).click();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.getByTestId('collected')).toHaveText('0');
  await page.screenshot({ path: '.playwright/sky-steps.png' });
  await page.locator('canvas').evaluate((canvas) => {
    const extension = (canvas as HTMLCanvasElement)
      .getContext('webgl2')!
      .getExtension('WEBGL_lose_context');
    if (!extension) throw new Error('Context-loss test requires the standard WebGL extension.');
    extension.loseContext();
  });
  await expect(page.getByText('The graphics context was lost.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Reload the island' }).click();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(page.locator('.game-frame')).toHaveAttribute('data-phase', 'playing');
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('pauses on window blur and honors persisted quality and reduced-motion preferences', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 960, height: 720 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:4422/');
  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('switch', { name: 'Reduce motion' })).toBeDisabled();
  await page.getByRole('switch', { name: 'Light graphics' }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.keyboard.down('ArrowRight');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('ArrowRight');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Help' }).click();
  await expect(page.getByRole('switch', { name: 'Light graphics' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  await expect
    .poll(() =>
      page.locator('canvas').evaluate((canvas) => {
        const element = canvas as HTMLCanvasElement;
        return element.width / element.getBoundingClientRect().width;
      }),
    )
    .toBeLessThanOrEqual(1);
  await context.close();
});

test('provides a readable failure state when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args: Parameters<typeof original>) {
      if (String(args[0]).startsWith('webgl')) return null;
      return original.apply(this, args);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'The island didn’t load.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload the island' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toHaveCount(0);
});

test('supports touch controls and cancellation without overflowing a phone', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4422/');
  await expect(page.getByRole('heading', { name: 'Light up the island.' })).toBeVisible();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  const pad = page.getByRole('group', { name: 'Drag to move' });
  await expect(pad).toBeVisible();
  await expect(page.getByRole('button', { name: 'Jump', exact: true })).toBeVisible();
  await pad.scrollIntoViewIfNeeded();
  const box = (await pad.boundingBox())!;
  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: box.x + 17, y: box.y + 37 }],
  });
  await expect(page.getByTestId('collected')).toHaveText('1', { timeout: 5000 });
  await session.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await expect
    .poll(() => pad.evaluate((element) => element.style.getPropertyValue('--stick-x')))
    .toBe('0px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.locator('.game-frame').scrollIntoViewIfNeeded();
  await page.screenshot({ path: '.playwright/mobile-playing.png' });
  await context.close();
});
