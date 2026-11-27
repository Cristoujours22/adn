import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ModuleDetectionSettingsModal from './ModuleDetectionSettingsModal';

describe('ModuleDetectionSettingsModal', () => {
  const baseProps = {
    isOpen: true,
    initialConfig: { designPrefixes: ['D'], groupIdPosition: 'afterDesign' },
    details: ['pieza D1-005', 'pieza D2-010'],
    onClose: jest.fn(),
    onSave: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows the configured example and recognized module key', () => {
    render(<ModuleDetectionSettingsModal {...baseProps} />);

    expect(screen.getByRole('dialog', { name: /configuración de detección de módulos/i })).toBeInTheDocument();
    expect(screen.getByText('D1-005')).toBeInTheDocument();
  });

  test('requires explicit confirmation before saving a configuration that loses keys', async () => {
    render(<ModuleDetectionSettingsModal {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/prefijos de diseño/i), { target: { value: 'T' } });
    fireEvent.click(screen.getByRole('button', { name: /guardar configuración/i }));

    expect(baseProps.onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('D1-005');

    fireEvent.click(screen.getByRole('button', { name: /confirmar y guardar/i }));
    await waitFor(() => expect(baseProps.onSave).toHaveBeenCalledWith(
      { designPrefixes: ['T'], groupIdPosition: 'afterDesign' },
      { saveAsDefault: false }
    ));
  });

  test('passes the opt-in to save the project value as the future default', async () => {
    render(<ModuleDetectionSettingsModal {...baseProps} />);

    fireEvent.click(screen.getByLabelText(/usar también para futuros proyectos/i));
    fireEvent.click(screen.getByRole('button', { name: /guardar configuración/i }));

    await waitFor(() => expect(baseProps.onSave).toHaveBeenCalledWith(
      { designPrefixes: ['D'], groupIdPosition: 'afterDesign' },
      { saveAsDefault: true }
    ));
  });
});
