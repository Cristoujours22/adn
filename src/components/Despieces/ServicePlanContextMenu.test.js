import React, { useRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ServicePlanContextMenu from './ServicePlanContextMenu';

const actions = () => ({
  onOpenPlan: jest.fn(),
  onConfigure: jest.fn(),
  onApplyToAll: jest.fn(),
  onSplitUnits: jest.fn(),
  onClose: jest.fn()
});

const MenuHarness = ({ callbacks, ...props }) => {
  const triggerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      <button ref={triggerRef} type="button">Detalle</button>
      {isOpen && (
        <ServicePlanContextMenu
          {...props}
          {...callbacks}
          isOpen={isOpen}
          triggerRef={triggerRef}
          onClose={() => {
            callbacks.onClose();
            setIsOpen(false);
          }}
        />
      )}
    </>
  );
};

test('renders a positioned menu with service and piece context', () => {
  const callbacks = actions();
  render(
    <ServicePlanContextMenu
      isOpen
      position={{ x: 140, y: 220 }}
      detectedServiceCount={2}
      pieceQuantity={4}
      {...callbacks}
    />
  );

  const menu = screen.getByRole('menu', { name: /acciones de plano/i });
  expect(menu).toHaveStyle({ left: '140px', top: '220px' });
  expect(menu).toHaveTextContent('2 servicios detectados');
  expect(menu).toHaveTextContent('4 piezas');
  expect(screen.getByRole('menuitem', { name: /abrir plano de servicios/i })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /configurar servicios/i })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /aplicar.*4 piezas/i })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: /separar unidades/i })).toBeInTheDocument();
});

test('supports arrow-key navigation and Escape restores focus to the trigger', () => {
  const callbacks = actions();
  render(
    <MenuHarness
      callbacks={callbacks}
      position={{ x: 10, y: 20 }}
      detectedServiceCount={1}
      pieceQuantity={2}
    />
  );

  const menu = screen.getByRole('menu', { name: /acciones de plano/i });
  const openPlan = screen.getByRole('menuitem', { name: /abrir plano de servicios/i });
  const configure = screen.getByRole('menuitem', { name: /configurar servicios/i });
  expect(openPlan).toHaveFocus();

  fireEvent.keyDown(menu, { key: 'ArrowDown' });
  expect(configure).toHaveFocus();
  fireEvent.keyDown(menu, { key: 'ArrowUp' });
  expect(openPlan).toHaveFocus();
  fireEvent.keyDown(menu, { key: 'Escape' });

  expect(callbacks.onClose).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Detalle' })).toHaveFocus();
});

test('closes on outside click and routes menu actions', () => {
  const callbacks = actions();
  render(
    <ServicePlanContextMenu
      isOpen
      position={{ x: 0, y: 0 }}
      detectedServiceCount={1}
      pieceQuantity={3}
      {...callbacks}
    />
  );

  fireEvent.click(screen.getByRole('menuitem', { name: /configurar servicios/i }));
  expect(callbacks.onConfigure).toHaveBeenCalledTimes(1);
  expect(callbacks.onClose).toHaveBeenCalledTimes(1);

  callbacks.onClose.mockClear();
  fireEvent.mouseDown(document.body);
  expect(callbacks.onClose).toHaveBeenCalledTimes(1);
});
