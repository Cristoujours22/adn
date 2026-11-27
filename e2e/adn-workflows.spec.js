const { test, expect } = require('./support/fixtures');
const {
  POSITIVE_SERVICE_NOMENCLATURES
} = require('./fixtures/adn-project');

const getRowNumberCell = (page, index) => page
  .locator(`#cant-${index}`)
  .locator('xpath=../../..')
  .locator(':scope > [class*="celdaDespiece"]')
  .first();

const getDetails = (page) => page
  .locator('input[id^="detalle-"]')
  .evaluateAll((inputs) => inputs.map((input) => input.value));

const getTotalPieces = async (page) => {
  const totalCard = page.getByText('Piezas Totales', { exact: true }).locator('..');
  return Number((await totalCard.locator('p').textContent()).trim());
};

const waitForProject = async (page) => {
  await expect(page.getByRole('heading', { name: 'Crear Nuevo Despiece' })).toBeVisible();
  await expect(page.locator('#detalle-0')).toHaveValue(/D1-005/);
};

const saveProject = async (page) => {
  await page.getByRole('button', { name: /Mas opciones/ }).click();
  const alertPromise = page.waitForEvent('dialog');
  const clickPromise = page.getByRole('button', { name: /Guardar Despiece/ }).click();
  const alert = await alertPromise;
  expect(alert.type()).toBe('alert');
  expect(alert.message()).toMatch(/actualizado|guardado/i);
  await alert.accept();
  await clickPromise;
};

const openServiceEditor = async (page) => {
  await page.getByRole('button', { name: 'Menu hamburguesa' }).click();
  const navigation = page.getByRole('navigation', { name: 'Menú lateral' });
  await navigation.getByText(/Nomenclaturas \/ Servicios/).click();
  const heading = page.getByRole('heading', { name: 'Gestión de Nomenclaturas (Servicios)' });
  const modal = heading.locator('..');
  await expect(modal).toBeVisible();
  return modal;
};

const closeServiceEditor = async (modal) => {
  await modal.locator('button').first().click();
  await expect(modal).toBeHidden();
};

const assertGroupedOrder = async (page) => {
  const details = await getDetails(page);
  expect(details[0]).toContain('D1-005');
  expect(details[1]).toContain('D1-005');
  expect(details[2]).toContain('D1-005');
  expect(details[3]).toContain('D2-010');
  expect(details[4]).toContain('D2-010');
  expect(details[5]).toContain('D2-010');
  expect(details[6]).toContain('pieza libre');
};

const getTableRow = (page, inputId) => page
  .locator(`#${inputId}`)
  .locator('xpath=ancestor::div[contains(@class,"filaDespiece")][1]');

const getExpectedContrastColor = (hexColor) => {
  const [red, green, blue] = hexColor.slice(1).match(/../g).map((channel) => parseInt(channel, 16) / 255);
  const toLinear = (channel) => channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
  const luminance = (0.2126 * toLinear(red)) + (0.7152 * toLinear(green)) + (0.0722 * toLinear(blue));
  return 1.05 / (luminance + 0.05) > (luminance + 0.05) / 0.05
    ? 'rgb(255, 255, 255)'
    : 'rgb(0, 0, 0)';
};

const getCellGeometry = (row, cellSelector) => row.locator(cellSelector).evaluateAll((cells) => cells.map((cell) => {
  const box = cell.getBoundingClientRect();
  return {
    text: cell.textContent.trim(),
    x: box.x,
    width: box.width,
    right: box.right
  };
}));

const assertPieceTableGeometry = async (page) => {
  const expectedHeaders = ['#', 'CANT', 'LARGO', 'ANCHO', 'DETALLE', 'ROTAR', 'L1', 'L2', 'A1', 'A2', 'ACCIONES'];
  const table = page.locator('[class*="tablaDespieceViewport"] > [class*="tablaDespiece"]');
  const header = table.locator(':scope > [class*="filaDespiece"]').first();
  const headerCells = header.locator(':scope > [class*="celdaTitulo"]');

  await expect(headerCells).toHaveCount(expectedHeaders.length);
  await expect.poll(() => headerCells.allTextContents()).toEqual(expectedHeaders);

  const headerGeometry = await getCellGeometry(header, ':scope > [class*="celdaTitulo"]');
  const ancho = headerGeometry[3];
  const detalle = headerGeometry[4];
  const acciones = headerGeometry[10];
  expect(detalle.width).toBeGreaterThan(ancho.width * 1.5);
  expect(acciones.width).toBeGreaterThanOrEqual(80);
  const tableBox = await table.boundingBox();
  const tableLayout = await table.evaluate((element) => {
    const style = getComputedStyle(element);
    const headerBox = element.querySelector(':scope > [class*="filaDespiece"]').getBoundingClientRect();
    const tableRect = element.getBoundingClientRect();
    return {
      paddingTop: style.paddingTop,
      tableTop: tableRect.top,
      headerTop: headerBox.top
    };
  });
  expect(tableLayout.paddingTop).toBe('0px');
  expect(Math.abs(tableLayout.headerTop - tableLayout.tableTop)).toBeLessThanOrEqual(1);
  const tableContentRight = Math.max(tableBox.x + tableBox.width, headerGeometry.at(-1).right);
  expect(acciones.right).toBeLessThanOrEqual(tableContentRight + 1);
  for (let index = 1; index < headerGeometry.length; index += 1) {
    expect(headerGeometry[index].x).toBeGreaterThanOrEqual(headerGeometry[index - 1].x);
  }

  const dataRow = getTableRow(page, 'cant-0');
  const dataCells = dataRow.locator(':scope > [class*="celdaDespiece"]');
  await expect(dataCells).toHaveCount(expectedHeaders.length);
  const dataGeometry = await getCellGeometry(dataRow, ':scope > [class*="celdaDespiece"]');
  expect(Math.abs(dataGeometry[4].width - detalle.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(dataGeometry[3].width - ancho.width)).toBeLessThanOrEqual(2);
  for (let index = 0; index < expectedHeaders.length; index += 1) {
    expect(Math.abs(dataGeometry[index].x - headerGeometry[index].x)).toBeLessThanOrEqual(2);
  }

  await page.getByTitle('Activar colores de módulos').click();
  const moduleRow = page.getByText('D1-005', { exact: true })
    .locator('xpath=ancestor::div[contains(@class,"moduleLabelRow")][1]');
  const moduleCell = moduleRow.locator(':scope > [class*="moduleLabelCell"]');
  await expect(moduleCell).toHaveCount(1);
  const moduleGeometry = await getCellGeometry(moduleRow, ':scope > [class*="moduleLabelCell"]');
  const moduleBox = await moduleRow.boundingBox();
  const headerBox = await header.boundingBox();
  expect(Math.abs(moduleGeometry[0].x - headerGeometry[0].x)).toBeLessThanOrEqual(2);
  expect(Math.abs(moduleGeometry[0].right - headerGeometry.at(-1).right)).toBeLessThanOrEqual(2);
  expect(moduleBox.y).toBeGreaterThanOrEqual(headerBox.y + headerBox.height - 1);
};

test.describe('ADN browser workflows', () => {
  test('keeps the piece-table columns aligned at desktop and mobile widths', async ({ authenticatedPage: page }) => {
    await assertPieceTableGeometry(page);
  });

  test('configures module detection with preview, conflict cancellation, and persistence', async ({ authenticatedPage: page }) => {
    const openSettings = async () => {
      await page.getByRole('button', { name: /Configurar módulos/ }).click();
      const dialog = page.getByRole('dialog', { name: 'Configuración de detección de módulos' });
      await expect(dialog).toBeVisible();
      return dialog;
    };

    let dialog = await openSettings();
    await expect(dialog.getByLabel('Prefijos de diseño')).toHaveValue('D');
    await expect(dialog.getByLabel('Posición del identificador de grupo')).toHaveValue('afterDesign');
    await expect(dialog.getByText(/Módulo reconocido:\s*D1-005/)).toBeVisible();

    await dialog.getByLabel('Prefijos de diseño').fill('X');
    await dialog.getByLabel('Posición del identificador de grupo').selectOption('beforeDesign');
    const conflict = dialog.getByRole('alert').filter({ hasText: 'Esta configuración dejará de reconocer módulos existentes' });
    await expect(conflict).toContainText('D1-005');
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();

    dialog = await openSettings();
    await dialog.getByLabel('Prefijos de diseño').fill('D');
    await dialog.getByLabel('Posición del identificador de grupo').selectOption('either');
    await expect(dialog.getByText(/Módulo reconocido:\s*D1-005/)).toBeVisible();
    await dialog.getByRole('button', { name: 'Guardar configuración' }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await waitForProject(page);
    dialog = await openSettings();
    await expect(dialog.getByLabel('Prefijos de diseño')).toHaveValue('D');
    await expect(dialog.getByLabel('Posición del identificador de grupo')).toHaveValue('either');
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
  });

  test('creates, collapses, reloads, and ungroups complete super-groups', async ({ authenticatedPage: page }) => {
    const totalBefore = await getTotalPieces(page);
    expect(totalBefore).toBe(7);

    await getRowNumberCell(page, 0).click();
    await getRowNumberCell(page, 4).click({ modifiers: ['Control'] });
    const groupButton = page.getByRole('button', { name: 'Agrupar módulos', exact: true });
    await expect(groupButton).toBeEnabled();
    await groupButton.click();

    const dialog = page.getByRole('dialog', { name: 'Agrupar módulos' });
    await expect(dialog).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('super-group-dialog');
    const preview = dialog.getByRole('list', { name: 'Módulos seleccionados' });
    await expect(preview.getByRole('listitem')).toHaveCount(2);
    await expect(preview.getByRole('listitem').nth(0)).toContainText('D1-005');
    await expect(preview.getByRole('listitem').nth(0)).toContainText('3 piezas');
    await expect(preview.getByRole('listitem').nth(1)).toContainText('D2-010');
    await expect(preview.getByRole('listitem').nth(1)).toContainText('3 piezas');

    await dialog.getByRole('button', { name: 'Confirmar agrupación' }).click();
    await expect(dialog).toBeHidden();
    const header = page.getByRole('row', { name: 'Supergrupo D1-005 + D2-010' });
    await expect(header).toBeVisible();
    await expect(header).toContainText('2 módulos · 6 filas');
    const superGroupCell = header.locator('[class*="superGroupHeaderCell"]');
    await expect(superGroupCell).toHaveCount(1);
    const superGroupCellBox = await superGroupCell.boundingBox();
    const tableBox = await page.locator('[class*="tablaDespieceViewport"] > [class*="tablaDespiece"]').boundingBox();
    expect(Math.abs(superGroupCellBox.x - tableBox.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(superGroupCellBox.width - tableBox.width)).toBeLessThanOrEqual(2);
    await expect(header.locator('h4')).toHaveCSS('white-space', 'nowrap');
    await page.getByTitle('Activar colores de módulos').click();
    await expect(page.locator('[class*="moduleLabelRow"]')).toHaveCount(0);

    await getRowNumberCell(page, 0).click();
    const rowNumberStyles = await page.locator('[class*="moduleRow"]').evaluateAll((rows) => rows.map((row) => {
      const numberCell = row.querySelector(':scope > [class*="celdaDespiece"]');
      return {
        moduleColor: row.style.getPropertyValue('--module-color').trim(),
        color: getComputedStyle(numberCell).color,
        backgroundColor: getComputedStyle(numberCell).backgroundColor
      };
    }));
    const selectedRowBackground = 'rgb(26, 115, 232)';
    const coloredRowNumbers = rowNumberStyles.filter(({ moduleColor, backgroundColor }) => (
      moduleColor !== 'transparent' && backgroundColor !== selectedRowBackground
    ));
    expect(coloredRowNumbers).toHaveLength(5);
    for (const rowNumber of coloredRowNumbers) {
      expect(rowNumber.color).toBe(getExpectedContrastColor(rowNumber.moduleColor));
    }
    const selectedRowNumbers = rowNumberStyles.filter(({ backgroundColor }) => backgroundColor === selectedRowBackground);
    expect(selectedRowNumbers).toHaveLength(1);
    expect(selectedRowNumbers[0].color).toBe('rgb(255, 255, 255)');

    await assertGroupedOrder(page);
    expect(await getTotalPieces(page)).toBe(totalBefore);

    const collapseButton = page.getByRole('button', { name: 'Colapsar supergrupo D1-005 + D2-010' });
    await collapseButton.focus();
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('Colapsar supergrupo D1-005 + D2-010');
    await page.keyboard.press('Enter');
    const expandButton = page.getByRole('button', { name: 'Expandir supergrupo D1-005 + D2-010' });
    await expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#detalle-0')).toHaveCount(0);
    expect(await getTotalPieces(page)).toBe(totalBefore);

    await saveProject(page);
    await page.reload();
    await waitForProject(page);
    const reloadedHeader = page.getByRole('row', { name: 'Supergrupo D1-005 + D2-010' });
    await expect(reloadedHeader).toBeVisible();
    await expect(page.getByRole('button', { name: 'Colapsar supergrupo D1-005 + D2-010' })).toHaveAttribute('aria-expanded', 'true');
    await assertGroupedOrder(page);
    expect(await getTotalPieces(page)).toBe(totalBefore);

    await page.getByRole('button', { name: 'Desagrupar supergrupo D1-005 + D2-010' }).click();
    await expect(page.getByRole('row', { name: 'Supergrupo D1-005 + D2-010' })).toHaveCount(0);
    await assertGroupedOrder(page);
    expect(await getTotalPieces(page)).toBe(totalBefore);

    await saveProject(page);
    await page.reload();
    await waitForProject(page);
    await expect(page.getByRole('row', { name: /Supergrupo/ })).toHaveCount(0);
    await assertGroupedOrder(page);
    expect(await getTotalPieces(page)).toBe(totalBefore);
  });

  test('persists service aliases and counts non-overlapping details in an accessible summary', async ({ authenticatedPage: page }, testInfo) => {
    const modal = await openServiceEditor(page);
    const aliasInput = modal.getByLabel('Alias del servicio');
    await modal.getByPlaceholder('Nombre Original (ej: Calado)').fill('Servicio en conflicto');
    await modal.getByPlaceholder('Nomenclatura (ej: CAL)').fill('E2ECONFLICT');
    await aliasInput.fill('sencha curva');

    const collisionDialogPromise = page.waitForEvent('dialog');
    const addConflictPromise = modal.getByRole('button', { name: 'Agregar', exact: true }).click();
    const collisionDialog = await collisionDialogPromise;
    expect(collisionDialog.type()).toBe('alert');
    expect(collisionDialog.message()).toMatch(/alias|servicios/i);
    expect(collisionDialog.message()).toContain('sencha curva');
    await collisionDialog.dismiss();
    await addConflictPromise;

    await modal.getByPlaceholder('Nombre Original (ej: Calado)').fill('Servicio persistido');
    await modal.getByPlaceholder('Nomenclatura (ej: CAL)').fill('E2EPERSIST');
    await aliasInput.fill('persistido');
    await modal.getByRole('button', { name: 'Agregar', exact: true }).click();
    await expect(modal).toContainText('E2EPERSIST');
    await expect(modal).toContainText('persistido');
    await closeServiceEditor(modal);

    await saveProject(page);
    await page.reload();
    await waitForProject(page);
    const reloadedModal = await openServiceEditor(page);
    await expect(reloadedModal).toContainText('E2EPERSIST');
    await expect(reloadedModal).toContainText('persistido');
    await closeServiceEditor(reloadedModal);

    await expect(page.locator('#detalle-0')).toHaveValue('base D1-005 pieza sencha curva + curva');
    await expect(page.locator('#detalle-1')).toHaveValue('entrepaño D1-005 curvado naranja');
    await expect(page.locator('#detalle-4')).toHaveValue(/2Lcurva/);

    const summary = page.getByRole('region', { name: 'Conteo de Servicios' });
    await expect(summary).toBeVisible();
    await expect(summary.getByRole('listitem')).toHaveCount(POSITIVE_SERVICE_NOMENCLATURES.length);
    await expect(summary.getByRole('listitem').filter({ hasText: '(SENCHACURVA)' })).toContainText('1');
    await expect(summary.getByRole('listitem').filter({ hasText: '(CSCURVA1)' })).toContainText('4');
    await expect(summary.getByRole('listitem').filter({ hasText: '(SRNAR000)' })).toHaveCount(0);

    for (const nomenclature of POSITIVE_SERVICE_NOMENCLATURES) {
      const item = summary.getByRole('listitem').filter({ hasText: `(${nomenclature})` });
      await expect(item).toHaveCount(1);
      await item.scrollIntoViewIfNeeded();
      await expect(item).toBeVisible();
    }

    await summary.focus();
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-labelledby'))).toBe('service-summary-heading');
    await summary.press('Home');
    await expect.poll(() => summary.evaluate((element) => element.scrollTop)).toBe(0);
    const beforeScroll = await summary.evaluate((element) => ({
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight
    }));
    expect(beforeScroll.scrollHeight).toBeGreaterThan(beforeScroll.clientHeight);
    await summary.press('PageDown');
    await expect.poll(() => summary.evaluate((element) => element.scrollTop)).toBeGreaterThan(beforeScroll.scrollTop);

    const summaryPanel = page.getByRole('heading', { name: 'Resumen del Despiece' }).locator('..');
    const summaryPosition = await summaryPanel.evaluate((element) => getComputedStyle(element).position);
    expect(summaryPosition).toBe(testInfo.project.name === 'chromium-mobile' ? 'static' : 'sticky');
    if (testInfo.project.name === 'chromium-mobile') {
      const projectInfo = page.locator('#cliente').locator('xpath=ancestor::div[contains(@class,"projectInfo")]');
      await expect.poll(() => projectInfo.evaluate((element) => getComputedStyle(element).flexWrap)).toBe('wrap');
    }
  });
});
