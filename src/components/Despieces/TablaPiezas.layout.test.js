import fs from 'fs';
import path from 'path';
import React from 'react';
import { render } from '@testing-library/react';
import TablaPiezas from './TablaPiezas';

const tableStyles = fs.readFileSync(path.resolve(__dirname, '../../App.module.css'), 'utf8');

const rows = [
  { id: 'r1', cant: '1', largo: '800', ancho: '300', detalle: 'pieza D1-005' },
  { id: 'r2', cant: '1', largo: '700', ancho: '300', detalle: 'pieza D1-005' }
];

const renderTable = ({ superGroups = [] } = {}) => render(
  <TablaPiezas
    despieces={[{ id: 'tab-1', filas: rows }]}
    activeDespieceId="tab-1"
    pieceSearchTerm=""
    pieceSearchLargo=""
    pieceSearchAncho=""
    pieceSearchType="detalle"
    handleInputChange={jest.fn()}
    handleKeyDown={jest.fn()}
    handleRemoveRow={jest.fn()}
    handleRowClick={jest.fn()}
    rowSelection={new Set()}
    handleOpenCobroModal={jest.fn()}
    darkMode={false}
    activeCell={null}
    setActiveCell={jest.fn()}
    isEditing={false}
    setIsEditing={jest.fn()}
    dragSelection={null}
    setDragSelection={jest.fn()}
    handleCellClick={jest.fn()}
    handleCellDoubleClick={jest.fn()}
    handleDragFill={jest.fn()}
    selection={null}
    showModuleColors
    services={[]}
    moduleDetectionConfig={{ designPrefixes: ['D'], groupIdPosition: 'afterDesign' }}
    superGroups={superGroups}
  />
);

test('keeps header and piece rows on an eleven-cell grid with a full-width module label', () => {
  const { container } = renderTable();
  const table = container.querySelector('[class*="tablaDespieceViewport"] > [class*="tablaDespiece"]');
  const tableRows = table.querySelectorAll(':scope > [class*="filaDespiece"]');
  const header = tableRows[0];
  const moduleLabel = tableRows[1];
  const pieceRow = tableRows[2];

  expect(Array.from(header.children).map((cell) => cell.textContent.trim())).toEqual([
    '#', 'CANT', 'LARGO', 'ANCHO', 'DETALLE', 'ROTAR', 'L1', 'L2', 'A1', 'A2', 'ACCIONES'
  ]);
  expect(header).not.toHaveStyle({ position: 'sticky' });
  expect(header).not.toHaveStyle({ top: '49px' });
  expect(moduleLabel.children).toHaveLength(1);
  expect(moduleLabel.className).toContain('moduleLabelRow');
  expect(pieceRow.children).toHaveLength(11);
  expect(pieceRow.children[0]).not.toHaveStyle({ display: 'flex' });
});

test('removes the obsolete table band and gives grouped rows the full grid width', () => {
  expect(tableStyles).not.toMatch(/\.tablaDespiece\s*\{[^}]*padding-top\s*:\s*50px/);
  expect(tableStyles).toMatch(/\.superGroupHeaderCell\s*\{[^}]*grid-column\s*:\s*1\s*\/\s*-1/);
  expect(tableStyles).toMatch(/\.superGroupHeaderCell h4\s*\{[^}]*white-space\s*:\s*nowrap/);

  const { container } = renderTable({
    superGroups: [{
      id: 'sg-1',
      label: 'D1-005 + D2-010',
      moduleKeys: ['D1-005']
    }]
  });
  const superGroupCell = container.querySelector('[class*="superGroupHeaderCell"]');
  const moduleLabel = container.querySelector('[class*="moduleLabelRow"]');

  expect(superGroupCell).toHaveAttribute('aria-colspan', '11');
  expect(moduleLabel.children).toHaveLength(1);
});
