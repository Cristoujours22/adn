const { test: base, expect } = require('@playwright/test');
const { TEST_USER, seedEmulatorData } = require('./emulators');

const test = base.extend({
  adnProject: [async ({}, use) => {
    const seededAccount = await seedEmulatorData();
    await use(seededAccount);
  }, { auto: true }],

  authenticatedPage: async ({ page, adnProject }, use) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    await page.getByPlaceholder('Ingrese correo electrónico').fill(TEST_USER.email);
    await page.getByPlaceholder('Ingrese contraseña').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/menu$/);

    await page.goto(`/modelo-despiece/${adnProject.projectId}`);
    await expect(page.getByRole('heading', { name: 'Crear Nuevo Despiece' })).toBeVisible();
    await expect(page.locator('#detalle-0')).toHaveValue(/D1-005/);
    await use(page);
  }
});

module.exports = { test, expect };
