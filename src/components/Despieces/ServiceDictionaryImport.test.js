import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ServiceDictionaryImport from './ServiceDictionaryImport';

const dictionaryMetadata = {
  id: 'codigos-generales',
  name: 'Códigos generales',
  kind: 'service-dictionary',
  language: 'es',
  visibility: 'private',
  description: 'Servicios importados',
  autoload: false
};

const createDictionaryFile = (services) => new File([
  JSON.stringify({ schemaVersion: '1.0', dictionary: dictionaryMetadata, services })
], 'servicios.json', { type: 'application/json' });

const service = (overrides = {}) => ({
  code: 'COR',
  name: 'Corte',
  description: 'Corte de tablero',
  aliases: ['corte'],
  chargeType: 'unidad',
  measurementBasis: 'unit',
  active: true,
  requiresReview: false,
  ...overrides
});

describe('ServiceDictionaryImport', () => {
  const baseProps = {
    isOpen: true,
    currentServices: [],
    onCancel: jest.fn(),
    onConfirm: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('previews active and review-required services before replacing the catalog', async () => {
    render(<ServiceDictionaryImport {...baseProps} />);
    const fileInput = screen.getByLabelText(/archivo JSON del diccionario/i);

    fireEvent.change(fileInput, {
      target: { files: [createDictionaryFile([
        service(),
        service({
          code: 'REV',
          name: 'Revisar',
          aliases: [],
          active: false,
          requiresReview: true
        })
      ])] }
    });

    expect(await screen.findByRole('heading', { name: /vista previa del diccionario/i })).toBeInTheDocument();
    expect(screen.getByText(/2 servicios en el diccionario/i)).toBeInTheDocument();
    expect(screen.getByText(/Servicios activos \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Requieren revisión \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Corte/)).toBeInTheDocument();
    expect(screen.getByText(/Revisar/)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /confirmar y reemplazar catálogo/i });
    expect(confirmButton).toBeEnabled();
    expect(baseProps.onConfirm).not.toHaveBeenCalled();

    fireEvent.click(confirmButton);

    await waitFor(() => expect(baseProps.onConfirm).toHaveBeenCalledWith([
      expect.objectContaining({ nomenclatura: 'COR', nombreOriginal: 'Corte', activo: true }),
      expect.objectContaining({ nomenclatura: 'REV', nombreOriginal: 'Revisar', activo: false, requiresReview: true })
    ]));
    expect(baseProps.onCancel).not.toHaveBeenCalled();
  });

  test('shows actionable validation and collision errors and blocks confirmation', async () => {
    render(<ServiceDictionaryImport {...baseProps} />);
    const fileInput = screen.getByLabelText(/archivo JSON del diccionario/i);

    fireEvent.change(fileInput, {
      target: { files: [createDictionaryFile([
        service(),
        service({ code: 'COR', name: 'Otro corte', aliases: ['corte'] })
      ])] }
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(/corregí|duplicado|coincide/i);
    expect(screen.getByText(/services\.code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirmar y reemplazar catálogo/i })).toBeDisabled();
    expect(baseProps.onConfirm).not.toHaveBeenCalled();
  });

  test('cancels without confirming an application change', () => {
    render(<ServiceDictionaryImport {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /cancelar importación/i }));

    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
    expect(baseProps.onConfirm).not.toHaveBeenCalled();
  });

  test('keeps the dialog open and reports an actionable error when persistence fails', async () => {
    let rejectConfirmation;
    const onConfirm = jest.fn(() => new Promise((resolve, reject) => {
      rejectConfirmation = reject;
    }));

    render(<ServiceDictionaryImport {...baseProps} onConfirm={onConfirm} />);
    fireEvent.change(screen.getByLabelText(/archivo JSON del diccionario/i), {
      target: { files: [createDictionaryFile([service()])] }
    });

    const confirmButton = await screen.findByRole('button', { name: /confirmar y reemplazar catálogo/i });
    const cancelButton = screen.getByRole('button', { name: /cancelar importación/i });
    await waitFor(() => expect(confirmButton).toBeEnabled());
    fireEvent.click(confirmButton);

    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
    expect(screen.getByLabelText(/archivo JSON del diccionario/i)).toBeDisabled();

    rejectConfirmation(new Error('permission-denied'));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo guardar|intentá|reintentá/i);
    expect(screen.getByRole('heading', { name: /importar diccionario de servicios/i })).toBeInTheDocument();
    expect(confirmButton).toBeEnabled();
    expect(cancelButton).toBeEnabled();
  });

  test('makes the empty current catalog explicit', () => {
    render(<ServiceDictionaryImport {...baseProps} />);

    expect(screen.getByText(/el catálogo actual está vacío/i)).toBeInTheDocument();
  });
});
