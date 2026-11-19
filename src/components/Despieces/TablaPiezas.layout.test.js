import React from 'react';
import { render } from '@testing-library/react';
import TablaPiezas from './TablaPiezas';

const rows = [
  { id: 'r1', cant: '1', largo: '800', ancho: '300', detalle: 'pieza D1-005' },
  { id: 'r2', cant: '1', largo: '700', ancho: '300', detalle: 'pieza D1-005' }
];

const renderTable = () => render(
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
  />
);

test('keeps header, module labels, and piece rows on an eleven-cell grid', () => {
  const { container } = renderTable();
  const table = container.querySelector('[class*="tablaDespieceViewport"] > [class*="tablaDespiece"]');
  const tableRows = table.querySelectorAll(':scope > [class*="filaDespiece"]');
  const header = tableRows[0];
  const moduleLabel = tableRows[1];
  const pieceRow = tableRows[2];

  expect(Array.from(header.children).map((cell) => cell.textContent.trim())).toEqual([
    '#', 'CANT', 'LARGO', 'ANCHO', 'DETALLE', 'ROTAR', 'L1', 'L2', 'A1', 'A2', 'ACCIONES'
  ]);
  expect(moduleLabel.children).toHaveLength(11);
  expect(pieceRow.children).toHaveLength(11);
  expect(pieceRow.children[0]).not.toHaveStyle({ display: 'flex' });
});
