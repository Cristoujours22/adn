import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SuperGroupDialog from './SuperGroupDialog';

const preview = {
  groupId: 'sg-1',
  label: 'D1-005 + T2-010',
  modules: [
    { moduleKey: 'D1-005', label: 'D1-005', pieceCount: 3 },
    { moduleKey: 'T2-010', label: 'T2-010', pieceCount: 2 }
  ],
  validationErrors: [],
  canApply: true
};

describe('SuperGroupDialog', () => {
  test('lists every complete module and requires explicit confirmation', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <SuperGroupDialog
        isOpen
        preview={preview}
        darkMode={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole('dialog', { name: /agrupar módulos/i })).toBeInTheDocument();
    expect(screen.getByText('D1-005')).toBeInTheDocument();
    expect(screen.getByText(/3 piezas/i)).toBeInTheDocument();
    expect(screen.getByText('T2-010')).toBeInTheDocument();
    expect(screen.getByText(/2 piezas/i)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /confirmar agrupación/i }));
    expect(onConfirm).toHaveBeenCalledWith(preview);
  });

  test('cancels with Escape without applying the preview', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <SuperGroupDialog
        isOpen
        preview={preview}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
