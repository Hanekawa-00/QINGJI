import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('app-locale', 'en')
  })

  await page.route('https://api.frankfurter.dev/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        base: 'USD',
        date: '2024-01-01',
        rates: {
          USD: 1,
          EUR: 0.92,
          CNY: 7.24,
          JPY: 149.5,
        },
      }),
    })
  })
})

test.describe('desktop web smoke', () => {
  test('navigates the desktop shell and opens entry', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-web', 'desktop-only scenario')

    await page.goto('/')

    await expect(page).toHaveURL(/\/desktop$/)
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByText('Current Balance').first()).toBeVisible()

    await page.getByText('Reports').click()
    await expect(page).toHaveURL(/\/desktop\/reports$/)
    await expect(page.getByRole('heading', { name: 'Statistical Report' })).toBeVisible()

    await page.getByText('New Entry').click()
    await expect(page).toHaveURL(/\/desktop\/entry$/)
    await expect(page.getByRole('heading', { name: 'New Entry' })).toBeVisible()
    await expect(page.getByText('Manage Categories')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Save' })).toBeVisible()

    const screenshot = await page.screenshot({
      path: testInfo.outputPath('desktop-entry.png'),
      fullPage: true,
    })
    await testInfo.attach('desktop-entry', { body: screenshot, contentType: 'image/png' })
  })
})

test.describe('mobile web smoke', () => {
  test('navigates the mobile shell and opens entry', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-web', 'mobile-only scenario')

    await page.goto('/')

    await expect(page).toHaveURL(/\/mobile$/)
    await expect(page.getByText('Current Balance')).toBeVisible()
    await expect(page.getByText('Monthly Spending')).toBeVisible()

    await page.locator('.header-right .nav-btn').last().click()
    await expect(page).toHaveURL(/\/mobile\/calendar$/)
    await expect(page.locator('.calendar-grid .week-day')).toHaveCount(7)
    await expect(page.locator('.calendar-grid .day-cell')).toHaveCount(42)
    await expect(page.getByText('Income')).toBeVisible()
    await expect(page.getByText('Expense')).toBeVisible()
    await expect(page.locator('.fab-button')).toBeVisible()

    await page.goto('/mobile')
    await page.locator('.fab-button').click()
    await expect(page).toHaveURL(/\/mobile\/entry/)
    await expect(page.getByText('Expense')).toBeVisible()
    await expect(page.getByText('Income')).toBeVisible()
    await expect(page.getByPlaceholder('Add note...')).toBeVisible()
    await expect(page.locator('.m-cat-item').first()).toBeVisible()

    const screenshot = await page.screenshot({
      path: testInfo.outputPath('mobile-entry.png'),
      fullPage: true,
    })
    await testInfo.attach('mobile-entry', { body: screenshot, contentType: 'image/png' })
  })
})
