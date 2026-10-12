import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TablaPiezas, { getContrastingTextColor } from './TablaPiezas';

const rows = [
  { id: 'r1', cant: '1', largo: '10', ancho: '20', detalle: 'pieza D1-005' },
  { id: 'r2', cant: '1', largo: '11', ancho: '21', detalle: 'pieza D1-005' },
  { id: 'r3', cant: '1', largo: '12', ancho: '22', detalle: 'pieza D2-010' }
];

const renderTable = (overrides = {}) => render(
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
    showModuleColors={false}
    services={[]}
    moduleDetectionConfig={{ designPrefixes: ['D'], groupIdPosition: 'afterDesign' }}
    superGroups={[{ id: 'sg-1', label: 'Cocina', moduleKeys: ['D1-005', 'D2-010'] }]}
    onUngroupSuperGroup={jest.fn()}
    {...overrides}
  />
);

describe('TablaPiezas super-groups', () => {
  test('renders an accessible semantic header and keeps source rows out of a collapsed presentation', () => {
    renderTable();

    expect(screen.getByRole('row', { name: /supergrupo cocina/i })).toHaveTextContent('2 módulos · 3 filas');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(document.getElementById('detalle-0')).toBeInTheDocument();
    expect(document.getElementById('detalle-1')).toBeInTheDocument();
    expect(document.getElementById('detalle-2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /colapsar supergrupo cocina/i }));

    expect(document.getElementById('detalle-0')).not.toBeInTheDocument();
    expect(document.getElementById('detalle-1')).not.toBeInTheDocument();
    expect(document.getElementById('detalle-2')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /expandir supergrupo cocina/i })).toBeInTheDocument();
  });

  test('reports suffix-format module count separately from complete row count', () => {
    renderTable({
      despieces: [{
        id: 'tab-1',
        filas: [
          { id: 'suffix-013-a', cant: '5', detalle: '1041-Lat_der-013-D1' },
          { id: 'suffix-003', cant: '2', detalle: '1055-Lat_der-003-D1' },
          { id: 'suffix-013-b', cant: '1', detalle: '1059-Lat_der-013-D1' },
          { id: 'suffix-013-c', cant: '3', detalle: '1062-Lat_der-013-D1' }
        ]
      }],
      moduleDetectionConfig: { designPrefixes: ['D'], groupIdPosition: 'beforeDesign' },
      superGroups: [{
        id: 'suffix-group',
        label: 'D1-013 + D1-003',
        moduleKeys: ['D1-013', 'D1-003']
      }]
    });

    expect(screen.getByRole('row', { name: /supergrupo d1-013 \+ d1-003/i }))
      .toHaveTextContent('2 módulos · 4 filas');
  });

  test('ungroups without asking the table to reorder source rows', () => {
    const onUngroupSuperGroup = jest.fn();
    renderTable({ onUngroupSuperGroup });

    fireEvent.click(screen.getByRole('button', { name: /desagrupar supergrupo cocina/i }));

    expect(onUngroupSuperGroup).toHaveBeenCalledWith('sg-1');
  });

  test('hides grouped module labels while retaining labels for ungrouped modules', () => {
    renderTable({
      showModuleColors: true,
      superGroups: [{ id: 'sg-1', label: 'Cocina', moduleKeys: ['D1-005'] }]
    });

    const moduleLabels = Array.from(document.querySelectorAll('[class*="moduleLabelRow"]'));
    expect(moduleLabels).toHaveLength(1);
    expect(moduleLabels[0]).toHaveTextContent('D2-010');
  });

  test('chooses opposite readable foregrounds for representative light and dark colors', () => {
    expect(getContrastingTextColor('#fbbc04')).toBe('#000');
    expect(getContrastingTextColor('#795548')).toBe('#fff');
  });

  test('uses contrast for colored row numbers and keeps selected numbers white', () => {
    renderTable({
      despieces: [{
        id: 'tab-1',
        filas: [
          { id: 'light', cant: '1', detalle: 'pieza D1-008' },
          { id: 'dark', cant: '1', detalle: 'pieza D1-000' },
          { id: 'selected', cant: '1', detalle: 'pieza D1-008' }
        ]
      }],
      showModuleColors: true,
      superGroups: [],
      rowSelection: new Set([2])
    });

    const rowNumberCells = Array.from(document.querySelectorAll('[class*="moduleRow"]'))
      .map((row) => row.querySelector(':scope > [class*="celdaDespiece"]'));
    expect(rowNumberCells[0]).toHaveStyle({ color: getContrastingTextColor('#fbbc04') });
    expect(rowNumberCells[1]).toHaveStyle({ color: getContrastingTextColor('#795548') });
    expect(rowNumberCells[2]).toHaveStyle({ color: '#fff', backgroundColor: '#1a73e8' });
  });
});
