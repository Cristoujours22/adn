import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import FindReplaceModal from './FindReplaceModal';

const despiece = { id: 'active', filas: [{ id: 'r1', detalle: 'PERBIS' }] };

test('cancel and close discard preview without applying', () => {
  const onApply = jest.fn(); const onClose = jest.fn();
  render(<FindReplaceModal despiece={despiece} isOpen onClose={onClose} onApply={onApply} />);
  fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'PERBIS' } });
  fireEvent.change(screen.getByLabelText('Reemplazar'), { target: { value: 'CANTO' } });
  fireEvent.click(screen.getByText('Vista previa')); fireEvent.click(screen.getByText('Cancelar'));
  expect(onApply).not.toHaveBeenCalled(); expect(onClose).toHaveBeenCalledTimes(1);
});

test('Escape closes and Tab traverses and wraps within the dialog', () => {
  const onClose = jest.fn(); const { getByRole } = render(<FindReplaceModal despiece={despiece} isOpen onClose={onClose} />);
  const dialog = getByRole('dialog'); const search = screen.getByLabelText('Buscar'); const replacement = screen.getByLabelText('Reemplazar'); const cancel = screen.getByLabelText('Cancelar');
  search.focus(); fireEvent.keyDown(dialog, { key: 'Tab' }); expect(document.activeElement).toBe(replacement);
  cancel.focus(); fireEvent.keyDown(dialog, { key: 'Tab' }); expect(document.activeElement).toBe(search);
  search.focus(); fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true }); expect(document.activeElement).toBe(cancel); fireEvent.keyDown(dialog, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('close restores focus to the supplied opener', () => {
  const opener = document.createElement('button'); document.body.appendChild(opener); const onClose = jest.fn();
  render(<FindReplaceModal despiece={despiece} isOpen openerRef={{ current: opener }} onClose={onClose} />); fireEvent.click(screen.getByLabelText('Cancelar')); expect(document.activeElement).toBe(opener);
});

test('reports persistence failure without closing the reviewed dialog', async () => {
  const onApply = jest.fn().mockRejectedValue(new Error('Save failed. Try again.'));
  render(<FindReplaceModal despiece={despiece} isOpen onClose={jest.fn()} onApply={onApply} />);
  fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'PERBIS' } });
  fireEvent.click(screen.getByText('Vista previa'));
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Save failed. Try again.');
  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('exposes validation and status messages as live regions', () => {
  render(<FindReplaceModal despiece={despiece} isOpen onClose={jest.fn()} />);
  fireEvent.click(screen.getByText('Vista previa'));
  expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
  fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'PERBIS' } });
  fireEvent.click(screen.getByText('Vista previa'));
  expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
});

test.each([['Buscar', 'CANTO'], ['Reemplazar', 'BORDE'], ['Modo', 'regex']])('changing %s invalidates the reviewed preview', (label, value) => {
  render(<FindReplaceModal despiece={despiece} isOpen onClose={jest.fn()} />);
  fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'PERBIS' } });
  fireEvent.click(screen.getByText('Vista previa'));
  expect(screen.getByRole('button', { name: 'Aplicar' })).toBeEnabled();
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
  expect(screen.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
});

test('re-preview applies the currently visible values', async () => {
  const onApply = jest.fn();
  render(<FindReplaceModal despiece={despiece} isOpen onClose={jest.fn()} onApply={onApply} />);
  fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'PERBIS' } });
  fireEvent.change(screen.getByLabelText('Reemplazar'), { target: { value: 'OLD' } });
  fireEvent.click(screen.getByText('Vista previa'));
  fireEvent.change(screen.getByLabelText('Reemplazar'), { target: { value: 'NEW' } });
  fireEvent.click(screen.getByText('Vista previa'));
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar' }));
  expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ despiece: expect.objectContaining({ filas: [expect.objectContaining({ detalle: 'NEW' })] }) }));
});
