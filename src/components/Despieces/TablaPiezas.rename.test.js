import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import TablaPiezas from './TablaPiezas';

test('opens module rename from double-click and keyboard activation', () => {
  const onRenameModule = jest.fn();
  const props = { despieces: [{ id: 'd', filas: [{ id: 'r', detalle: 'D1-01 pieza' }] }], activeDespieceId: 'd', pieceSearchType: 'detalle', modules: [{ moduleId: 'm', legacyToken: 'D1-01', displayName: 'Base' }], onRenameModule, showModuleColors: true, darkMode: false, services: [], rowSelection: new Set(), handleInputChange: jest.fn(), handleKeyDown: jest.fn(), handleRemoveRow: jest.fn(), handleRowClick: jest.fn(), handleOpenCobroModal: jest.fn(), setActiveCell: jest.fn(), setIsEditing: jest.fn(), setDragSelection: jest.fn(), handleCellClick: jest.fn(), handleCellDoubleClick: jest.fn(), handleDragFill: jest.fn() };
  const { getByRole } = render(<TablaPiezas {...props} />); const module = getByRole('button', { name: /rename module base/i });
  fireEvent.doubleClick(module); fireEvent.keyDown(module, { key: 'Enter' }); expect(onRenameModule).toHaveBeenCalledTimes(2);
});
