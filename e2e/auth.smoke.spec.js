const { test, expect } = require('@playwright/test');
const { TEST_USER } = require('./support/emulators');

test('authenticates through the Spanish login UI and reaches the menu', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await page.getByPlaceholder('Ingrese correo electrónico').fill(TEST_USER.email);
  await page.getByPlaceholder('Ingrese contraseña').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL(/\/menu$/);
  await expect(page.getByRole('heading', { name: 'Despieces Guardados' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Menú lateral' })).toContainText('Inicio');
  await expect(page.getByLabel('Menú de usuario')).toContainText('Usuario E2E');
});
