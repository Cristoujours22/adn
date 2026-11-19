import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import TablaPiezas from './TablaPiezas';

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

    expect(screen.getByRole('row', { name: /supergrupo cocina/i })).toHaveTextContent('3 piezas');
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

  test('ungroups without asking the table to reorder source rows', () => {
    const onUngroupSuperGroup = jest.fn();
    renderTable({ onUngroupSuperGroup });

    fireEvent.click(screen.getByRole('button', { name: /desagrupar supergrupo cocina/i }));

    expect(onUngroupSuperGroup).toHaveBeenCalledWith('sg-1');
  });
});
