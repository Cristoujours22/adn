import React, { useCallback, useEffect, useRef } from 'react';
import styles from './ServicePlanContextMenu.module.css';

const asCount = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const formatCount = (value, singular, plural) => `${value} ${value === 1 ? singular : plural}`;

const toCssPosition = (value) => (
  typeof value === 'number' ? `${value}px` : String(value ?? 0).replace(/(;|\s)/g, '')
);

const ServicePlanContextMenu = ({
  isOpen = true,
  position,
  screenPosition,
  detectedServiceCount = 0,
  pieceQuantity = 1,
  onOpenPlan,
  onOpen,
  onConfigure,
  onConfigurePlan,
  onApplyToAll,
  onApply,
  onSplitUnits,
  onSplit,
  onClose,
  triggerRef,
  openerRef,
  restoreFocusRef
}) => {
  const menuRef = useRef(null);
  const firstItemRef = useRef(null);
  const itemsRef = useRef([]);
  const serviceCount = asCount(detectedServiceCount);
  const quantity = asCount(pieceQuantity, 1);
  const openAction = onOpenPlan || onOpen;
  const configureAction = onConfigure || onConfigurePlan;
  const applyAction = onApplyToAll || onApply;
  const splitAction = onSplitUnits || onSplit;
  const point = screenPosition || position || {};
  const left = point.x ?? point.left ?? 0;
  const top = point.y ?? point.top ?? 0;

  const focusTrigger = useCallback(() => {
    const possibleTriggers = [triggerRef, openerRef, restoreFocusRef];
    const trigger = possibleTriggers
      .map((ref) => ref?.current)
      .find((element) => element && typeof element.focus === 'function');
    trigger?.focus();
  }, [openerRef, restoreFocusRef, triggerRef]);

  const closeMenu = useCallback(() => {
    onClose?.();
    focusTrigger();
  }, [focusTrigger, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    firstItemRef.current?.focus();
    const handleOutsideMouseDown = (event) => {
      if (!menuRef.current?.contains(event.target)) closeMenu();
    };

    document.addEventListener('mousedown', handleOutsideMouseDown);
    return () => document.removeEventListener('mousedown', handleOutsideMouseDown);
  }, [closeMenu, isOpen]);

  if (!isOpen) return null;

  const menuItems = [
    {
      label: 'Abrir plano de servicios',
      description: 'Configurar geometría y cotas',
      action: openAction
    },
    {
      label: 'Configurar servicios',
      description: 'Editar la geometría declarativa del servicio',
      action: configureAction
    },
    {
      label: `Aplicar el mismo plano a ${formatCount(quantity, 'pieza', 'piezas')}`,
      description: 'Compartir este plano con todas las unidades',
      action: applyAction
    },
    {
      label: 'Separar unidades…',
      description: 'Crear grupos de plano independientes',
      action: splitAction
    }
  ];

  const runAction = (action) => {
    action?.();
    closeMenu();
  };

  const handleKeyDown = (event) => {
    const items = itemsRef.current.filter(Boolean);
    const currentIndex = items.indexOf(document.activeElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) || items.length === 0) return;

    event.preventDefault();
    let nextIndex = currentIndex;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = items.length - 1;
    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1 + items.length) % items.length;
    if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length;
    items[nextIndex]?.focus();
  };

  return (
    <div
      ref={menuRef}
      className={styles.menu}
      role="menu"
      aria-label="Acciones de plano"
      aria-orientation="vertical"
      style={{ left: toCssPosition(left), top: toCssPosition(top) }}
      onKeyDown={handleKeyDown}
    >
      <div className={styles.context} role="status" aria-live="polite">
        {formatCount(serviceCount, 'servicio detectado', 'servicios detectados')} · {formatCount(quantity, 'pieza', 'piezas')}
      </div>
      {menuItems.map((item, index) => (
        <button
          key={item.label}
          ref={(element) => {
            itemsRef.current[index] = element;
            if (index === 0) firstItemRef.current = element;
          }}
          className={styles.item}
          type="button"
          role="menuitem"
          onClick={() => runAction(item.action)}
        >
          <span className={styles.itemLabel}>{item.label}</span>
          <span className={styles.itemDescription}>{item.description}</span>
        </button>
      ))}
    </div>
  );
};

export default ServicePlanContextMenu;
