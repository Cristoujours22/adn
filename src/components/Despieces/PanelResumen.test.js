import React from 'react';
import { render, screen, within } from '@testing-library/react';
import PanelResumen from './PanelResumen';

const services = [
  {
    nomenclatura: 'ENCHAPE',
    nombreOriginal: 'Enchape manual',
    tipoCobro: 'unidad',
    activo: true
  },
  {
    nomenclatura: 'NARIZ',
    nombreOriginal: 'Nariz',
    tipoCobro: 'ml_largo_ancho',
    activo: true
  },
  {
    nomenclatura: 'INACTIVO',
    nombreOriginal: 'Servicio inactivo',
    tipoCobro: 'unidad',
    activo: false
  },
  {
    nomenclatura: 'SIN_CONTEO',
    nombreOriginal: 'Servicio sin conteo',
    tipoCobro: 'unidad',
    activo: true
  }
];

const serviceCounts = {
  ENCHAPE: 2,
  NARIZ: 1,
  INACTIVO: 4,
  SIN_CONTEO: 0
};

describe('PanelResumen', () => {
  test('exposes positive active services in a labelled, keyboard-focusable list region', () => {
    render(
      <PanelResumen
        darkMode={false}
        totalPieces={12}
        services={services}
        serviceCounts={serviceCounts}
      />
    );

    const region = screen.getByRole('region', { name: /conteo de servicios/i });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toHaveAttribute('aria-labelledby', 'service-summary-heading');

    const list = within(region).getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByText('Enchape manual')).toBeInTheDocument();
    expect(within(list).getByText('Nariz')).toBeInTheDocument();
    expect(within(list).queryByText('Servicio inactivo')).not.toBeInTheDocument();
    expect(within(list).queryByText('Servicio sin conteo')).not.toBeInTheDocument();

    region.focus();
    expect(document.activeElement).toBe(region);
  });

  test('keeps the unchanged empty-state copy inside the labelled service area', () => {
    render(
      <PanelResumen
        darkMode
        totalPieces={0}
        services={[]}
        serviceCounts={{}}
      />
    );

    const region = screen.getByRole('region', { name: /conteo de servicios/i });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region).toHaveTextContent('No hay nomenclaturas configuradas. Abre el menú lateral para agregarlas.');
  });
});
