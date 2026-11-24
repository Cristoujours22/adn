import React from 'react';
import { render, screen } from '@testing-library/react';
import ServicePlanCanvas from './ServicePlanCanvas';

describe('ServicePlanCanvas', () => {
  test('renders an accessible, fitted CAD piece with external millimetre dimensions', () => {
    render(
      <ServicePlanCanvas
        piece={{ lengthMm: 1200, widthMm: 800 }}
        operation={{
          primitive: 'circle',
          serviceName: 'A company-specific service name',
          parameters: { diameter: 240 }
        }}
      />
    );

    const canvas = screen.getByRole('img', { name: /plano cad de pieza/i });

    expect(canvas).toHaveAttribute('viewBox', '0 0 520 400');
    expect(canvas).toHaveTextContent('1200 mm');
    expect(canvas).toHaveTextContent('800 mm');
    expect(screen.getByTestId('service-plan-geometry-circle')).toBeInTheDocument();
    expect(canvas).not.toHaveTextContent('A company-specific service name');
  });

  test.each(['circle', 'rounded-corners', 'chamfer'])(
    'renders the neutral %s primitive without service-name rules',
    (primitive) => {
      render(
        <ServicePlanCanvas
          piece={{ lengthMm: 600, widthMm: 600 }}
          operation={{ primitive, serviceName: 'Curva', parameters: { radius: 80 } }}
        />
      );

      expect(screen.getByTestId(`service-plan-geometry-${primitive}`)).toBeInTheDocument();
    }
  );

  test('renders a full circle as the exterior contour when declared by the profile scope', () => {
    render(
      <ServicePlanCanvas
        piece={{ lengthMm: 600, widthMm: 600 }}
        operation={{
          geometryId: 'full-circle',
          parameters: {},
          planProfile: {
            scope: 'outer-contour',
            geometries: [{ id: 'full-circle', primitive: 'circle' }]
          }
        }}
      />
    );

    expect(screen.getByTestId('service-plan-geometry-outer-circle')).toHaveAttribute('data-diameter-mm', '600');
    expect(screen.queryByTestId('service-plan-geometry-circle')).not.toBeInTheDocument();
  });

  test('rejects a circular exterior contour when piece dimensions are not square', () => {
    render(
      <ServicePlanCanvas
        piece={{ lengthMm: 600, widthMm: 450 }}
        operation={{
          geometryId: 'full-circle',
          parameters: {},
          planProfile: {
            scope: 'outer-contour',
            geometries: [{ id: 'full-circle', primitive: 'circle' }]
          }
        }}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent(/círculo exterior.*largo y ancho iguales/i);
  });

  test('resolves a selected primitive from a declarative plan profile', () => {
    render(
      <ServicePlanCanvas
        plan={{
          piece: { lengthMm: 600, widthMm: 450 },
          groups: [{
            operations: [{
              geometryId: 'corner-cut',
              parameters: { size: 40 },
              planProfile: {
                geometries: [{ id: 'corner-cut', primitive: 'chamfer' }]
              }
            }]
          }]
        }}
      />
    );

    expect(screen.getByRole('img', { name: /plano cad de pieza/i })).toHaveTextContent('600 mm');
    expect(screen.getByTestId('service-plan-geometry-chamfer')).toBeInTheDocument();
  });

  test('keeps empty, invalid, and unsupported inputs safe and understandable', () => {
    const { rerender } = render(<ServicePlanCanvas />);

    expect(screen.getByRole('status')).toHaveTextContent(/no hay dimensiones/i);

    rerender(<ServicePlanCanvas piece={{ lengthMm: -10, widthMm: 0 }} />);
    expect(screen.getByRole('status')).toHaveTextContent(/dimensiones.*mayores que cero/i);

    rerender(
      <ServicePlanCanvas
        piece={{ lengthMm: 400, widthMm: 300 }}
        operation={{ primitive: 'unsupported' }}
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent(/geometría no soportada/i);
  });
});
