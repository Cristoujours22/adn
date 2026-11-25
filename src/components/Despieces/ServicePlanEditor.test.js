import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ServicePlanEditor from './ServicePlanEditor';

const plan = {
  version: 1,
  rowId: 'row_7',
  piece: {
    quantity: 4,
    lengthMm: 600,
    widthMm: 600,
    edges: { l1: '1', l2: '1', a1: '1', a2: '1' }
  },
  groups: [
    {
      id: 'group-1',
      unitIndexes: [1, 2, 3, 4],
      operations: [
        {
          id: 'operation-1',
          serviceId: 'GEN_CURVE',
          detectedQuantity: 1,
          geometryId: null,
          parameters: {},
          planProfile: {
            scope: 'outer-contour',
            mode: 'selectable',
            geometries: [
              {
                id: 'rounded-corners',
                label: 'Esquinas redondeadas',
                primitive: 'rounded-corners',
                parameters: [
                  { id: 'radius', label: 'Radio', kind: 'radius', unit: 'mm', required: true }
                ]
              },
              {
                id: 'full-circle',
                label: 'Círculo completo',
                primitive: 'circle',
                parameters: []
              }
            ]
          }
        }
      ]
    }
  ]
};

describe('ServicePlanEditor', () => {
  test('renders a contextual CAD drawer and applies declarative geometry values', () => {
    const onApply = jest.fn();
    render(
      <ServicePlanEditor
        isOpen
        plan={plan}
        row={{ detalle: 'Divisor curva' }}
        onApply={onApply}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByRole('dialog', { name: /plano de servicios/i })).toBeInTheDocument();
    expect(screen.getByText(/600 × 600 mm/i)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Geometría' }), { target: { value: 'rounded-corners' } });
    fireEvent.change(screen.getByLabelText('Radio (mm)'), { target: { value: '80' } });
    fireEvent.click(screen.getByRole('button', { name: /aplicar plano/i }));

    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({
      groups: [expect.objectContaining({
        operations: [expect.objectContaining({
          geometryId: 'rounded-corners',
          parameters: { radius: 80 }
        })]
      })]
    }));
  });

  test('blocks apply until every required geometry parameter has a value', () => {
    const onApply = jest.fn();
    render(
      <ServicePlanEditor
        isOpen
        plan={plan}
        row={{ detalle: 'Divisor curva' }}
        onApply={onApply}
        onClose={jest.fn()}
      />
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Geometría' }), { target: { value: 'rounded-corners' } });
    const applyButton = screen.getByRole('button', { name: /aplicar plano/i });

    expect(applyButton).toBeDisabled();
    fireEvent.click(applyButton);
    expect(onApply).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Radio (mm)'), { target: { value: '80' } });
    expect(applyButton).toBeEnabled();
  });

  test('splits selected physical units while retaining the shared group', () => {
    const onApply = jest.fn();
    render(
      <ServicePlanEditor
        isOpen
        plan={plan}
        row={{ detalle: 'Divisor curva' }}
        onApply={onApply}
        onClose={jest.fn()}
      />
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Geometría' }), { target: { value: 'rounded-corners' } });
    fireEvent.change(screen.getByLabelText('Radio (mm)'), { target: { value: '80' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pieza 4' }));
    fireEvent.click(screen.getByRole('button', { name: /separar seleccionadas/i }));

    expect(screen.getByRole('button', { name: /piezas 1–3/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pieza 4/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /aplicar plano/i }));
    expect(onApply.mock.calls[0][0].groups.map((group) => group.unitIndexes)).toEqual([
      [1, 2, 3],
      [4]
    ]);
  });

  test('keeps services without a geometry profile explicit and safe', () => {
    const pendingPlan = JSON.parse(JSON.stringify(plan));
    pendingPlan.groups[0].operations[0].planProfile = null;

    render(
      <ServicePlanEditor
        isOpen
        plan={pendingPlan}
        row={{ detalle: 'Divisor servicio pendiente' }}
        onApply={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(/no tiene geometrías declaradas/i);
    expect(screen.getByRole('button', { name: /aplicar plano/i })).toBeDisabled();
  });
});
