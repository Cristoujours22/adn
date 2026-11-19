import React from 'react';
import { render, screen } from '@testing-library/react';
import TablaPiezas from './TablaPiezas';

const services = [
  {
    nomenclatura: 'SENCHAMANUAL',
    nombreOriginal: 'ENCHAPE MANUAL',
    aliases: ['senchamanual', 'enchape manual', 'manigaveta', 'manichaflan'],
    tipoCobro: 'ml_largo_ancho'
  },
  {
    nomenclatura: 'MANIGAVETA',
    nombreOriginal: 'MANIGAVETA',
    tipoCobro: 'unidad'
  },
  {
    nomenclatura: 'MANICHAFLAN',
    nombreOriginal: 'MANICHAFLAN',
    tipoCobro: 'unidad'
  },
  {
    nomenclatura: 'SRNAR000',
    nombreOriginal: 'NARIZ',
    aliases: ['nariz', 'nar'],
    tipoCobro: 'ml_largo_ancho'
  },
  {
    nomenclatura: 'ENGNA',
    nombreOriginal: 'Engorde Nariz',
    aliases: ['engna', 'engorde', 'engorde nariz'],
    tipoCobro: 'ml_largo_ancho'
  },
  {
    nomenclatura: 'CSCIRCULO',
    nombreOriginal: 'CIRCULOS',
    aliases: ['circulo'],
    tipoCobro: 'ml_largo_ancho'
  }
];

const renderTable = (detalle) => render(
  <TablaPiezas
    despieces={[{ id: 'tab-1', filas: [{ id: 'r1', cant: '1', largo: '600', ancho: '400', detalle }] }]}
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
    services={services}
    moduleDetectionConfig={{ designPrefixes: ['D'], groupIdPosition: 'afterDesign' }}
  />
);

describe('TablaPiezas service actions', () => {
  test('shows only EngNA for an Engorde Nariz owned span', () => {
    renderTable('engorde nariz');

    expect(screen.getByTitle('Cobrar EngNA')).toBeInTheDocument();
    expect(screen.queryByTitle('Cobrar Nariz')).not.toBeInTheDocument();
  });

  test('does not route canonical Manigaveta to Enchape', () => {
    renderTable('manigaveta');

    expect(screen.queryByTitle('Cobrar Enchape')).not.toBeInTheDocument();
  });

  test('uses singular Circulo ownership to suppress Enchape action', () => {
    renderTable('enchape manual circulo');

    expect(screen.queryByTitle('Cobrar Enchape')).not.toBeInTheDocument();
  });

  test('uses matcher ownership for Enchape and Nariz actions', () => {
    const { unmount } = renderTable('enchape manual');
    expect(screen.getByTitle('Cobrar Enchape')).toBeInTheDocument();
    expect(screen.queryByTitle('Cobrar Nariz')).not.toBeInTheDocument();

    unmount();
    renderTable('nariz');
    expect(screen.getByTitle('Cobrar Nariz')).toBeInTheDocument();
    expect(screen.queryByTitle('Cobrar EngNA')).not.toBeInTheDocument();
  });
});
