import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ModuleRenameModal from './ModuleRenameModal';

const despiece = { filas: [{ id: 'r1', moduleId: 'm1' }], modules: [{ moduleId: 'm1', displayName: 'Base' }, { moduleId: 'm2', displayName: 'Upper' }] };
test('opens labelled dialog, rejects blank or duplicate names, and applies valid rename', () => {
  const onApply = jest.fn();
  render(<ModuleRenameModal despiece={despiece} module={despiece.modules[0]} isOpen onApply={onApply} />);
  const input = screen.getByLabelText('Nombre'); fireEvent.change(input, { target: { value: ' ' } }); fireEvent.click(screen.getByText('Guardar')); expect(screen.getByRole('alert')).toHaveTextContent(/blank/i);
  fireEvent.change(input, { target: { value: 'Upper' } }); fireEvent.click(screen.getByText('Guardar')); expect(screen.getByRole('alert')).toHaveTextContent(/exists/i);
  fireEvent.change(input, { target: { value: 'Kitchen' } }); fireEvent.click(screen.getByText('Guardar')); expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ changedRows: ['r1'] }));
});
test('cancel and Escape close without applying', () => {
  const onClose = jest.fn(); const onApply = jest.fn(); const { getByRole } = render(<ModuleRenameModal despiece={despiece} module={despiece.modules[0]} isOpen onClose={onClose} onApply={onApply} />);
  fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' }); expect(onClose).toHaveBeenCalled(); expect(onApply).not.toHaveBeenCalled();
});

test('returns focus to opener and reports persistence failure', async () => {
  const opener = document.createElement('button'); document.body.appendChild(opener); opener.focus();
  const onApply = jest.fn(() => Promise.reject(new Error('save failed'))); const onClose = jest.fn();
  render(<ModuleRenameModal despiece={despiece} module={despiece.modules[0]} isOpen openerRef={{ current: opener }} onClose={onClose} onApply={onApply} />);
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Kitchen' } }); fireEvent.click(screen.getByText('Guardar'));
  await screen.findByRole('alert'); expect(screen.getByRole('alert')).toHaveTextContent(/save failed/i); expect(onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Cancelar')); expect(document.activeElement).toBe(opener);
});

test('Tab and Shift+Tab traverse and wrap between rename controls', () => {
  const { getByRole } = render(<ModuleRenameModal despiece={despiece} module={despiece.modules[0]} isOpen />); const dialog = getByRole('dialog'); const input = screen.getByLabelText('Nombre'); const save = screen.getByText('Guardar'); const cancel = screen.getByLabelText('Cancelar');
  input.focus(); fireEvent.keyDown(dialog, { key: 'Tab' }); expect(document.activeElement).toBe(save); save.focus(); fireEvent.keyDown(dialog, { key: 'Tab' }); expect(document.activeElement).toBe(cancel); cancel.focus(); fireEvent.keyDown(dialog, { key: 'Tab' }); expect(document.activeElement).toBe(input); input.focus(); fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true }); expect(document.activeElement).toBe(cancel);
});

test('exposes rename validation as an assertive live region', () => {
  render(<ModuleRenameModal despiece={despiece} module={despiece.modules[0]} isOpen />);
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: ' ' } });
  fireEvent.click(screen.getByText('Guardar'));
  expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
});
