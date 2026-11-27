import React, { useId } from 'react';
import styles from './ServicePlanCanvas.module.css';

const VIEWBOX_WIDTH = 520;
const VIEWBOX_HEIGHT = 400;
const PIECE_LEFT = 90;
const PIECE_TOP = 64;
const PIECE_MAX_WIDTH = 320;
const PIECE_MAX_HEIGHT = 230;
const SUPPORTED_PRIMITIVES = ['circle', 'rounded-corners', 'chamfer'];
const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

const isFinitePositive = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
};

const firstPositiveNumber = (...values) => {
  const value = values.find(isFinitePositive);
  return value == null ? null : Number(value);
};

const formatMillimetres = (value) => (
  Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
);

const clamp = (value, minimum, maximum) => Math.min(Math.max(value, minimum), maximum);

const getPieceSource = (piece, plan) => piece || plan?.piece || null;

const normalizePiece = (piece, plan) => {
  const source = getPieceSource(piece, plan);
  if (!source) return null;

  return {
    lengthMm: firstPositiveNumber(source.lengthMm, source.length, source.largo),
    widthMm: firstPositiveNumber(source.widthMm, source.width, source.ancho)
  };
};

const getOperationSource = (operation, plan) => (
  operation
  || plan?.groups?.find((group) => group?.operations?.length > 0)?.operations?.[0]
  || null
);

const getGeometryFromProfile = (operation) => {
  const geometryId = operation?.geometryId;
  const geometries = operation?.planProfile?.geometries || operation?.geometry?.profile?.geometries || [];
  if (!geometryId || !Array.isArray(geometries)) return null;
  return geometries.find((geometry) => geometry?.id === geometryId) || null;
};

const getParameters = (operation, geometry) => {
  if (operation?.parameters && !Array.isArray(operation.parameters)) return operation.parameters;
  if (operation?.parameters && Array.isArray(operation.parameters)) {
    return operation.parameters.reduce((values, parameter) => {
      if (parameter?.id && parameter.value != null) values[parameter.id] = parameter.value;
      return values;
    }, {});
  }
  if (geometry?.parameters && !Array.isArray(geometry.parameters)) return geometry.parameters;
  return {};
};

const resolveGeometry = (operation) => {
  const profileGeometry = getGeometryFromProfile(operation);
  const primitive = String(
    operation?.primitive
      || operation?.geometryPrimitive
      || operation?.geometry?.primitive
      || profileGeometry?.primitive
      || (SUPPORTED_PRIMITIVES.includes(operation?.geometryId) ? operation.geometryId : '')
  ).trim().toLowerCase();

  return {
    primitive,
    scope: operation?.planProfile?.scope || operation?.geometry?.scope || null,
    parameters: getParameters(operation, profileGeometry)
  };
};

const getCorner = (parameters) => {
  const requestedCorner = String(parameters?.corner || parameters?.position || '').trim().toLowerCase();
  const normalizedCorner = requestedCorner.replace(/_/g, '-').replace(/\s+/g, '-');
  return CORNERS.includes(normalizedCorner) ? normalizedCorner : 'bottom-left';
};

const getCorners = (parameters) => {
  const requestedCorners = Array.isArray(parameters?.corners)
    ? parameters.corners
    : [getCorner(parameters)];
  const normalizedCorners = requestedCorners
    .map((corner) => String(corner).trim().toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-'))
    .filter((corner) => CORNERS.includes(corner));
  return normalizedCorners.length > 0 ? normalizedCorners : ['bottom-left'];
};

const createCornerRadii = (parameters, radius) => {
  const corners = getCorners(parameters);
  return {
    'top-left': corners.includes('top-left') ? radius : 0,
    'top-right': corners.includes('top-right') ? radius : 0,
    'bottom-right': corners.includes('bottom-right') ? radius : 0,
    'bottom-left': corners.includes('bottom-left') ? radius : 0
  };
};

const createRoundedPath = (x, y, width, height, radii) => {
  const topLeft = radii['top-left'];
  const topRight = radii['top-right'];
  const bottomRight = radii['bottom-right'];
  const bottomLeft = radii['bottom-left'];
  const right = x + width;
  const bottom = y + height;

  return [
    `M ${x + topLeft} ${y}`,
    `H ${right - topRight}`,
    topRight ? `A ${topRight} ${topRight} 0 0 1 ${right} ${y + topRight}` : '',
    `V ${bottom - bottomRight}`,
    bottomRight ? `A ${bottomRight} ${bottomRight} 0 0 1 ${right - bottomRight} ${bottom}` : '',
    `H ${x + bottomLeft}`,
    bottomLeft ? `A ${bottomLeft} ${bottomLeft} 0 0 1 ${x} ${bottom - bottomLeft}` : '',
    `V ${y + topLeft}`,
    topLeft ? `A ${topLeft} ${topLeft} 0 0 1 ${x + topLeft} ${y}` : '',
    'Z'
  ].filter(Boolean).join(' ');
};

const createRoundedHighlightPath = (x, y, width, height, radii) => {
  const right = x + width;
  const bottom = y + height;
  const paths = [];

  if (radii['top-left']) paths.push(`M ${x} ${y + radii['top-left']} A ${radii['top-left']} ${radii['top-left']} 0 0 1 ${x + radii['top-left']} ${y}`);
  if (radii['top-right']) paths.push(`M ${right - radii['top-right']} ${y} A ${radii['top-right']} ${radii['top-right']} 0 0 1 ${right} ${y + radii['top-right']}`);
  if (radii['bottom-right']) paths.push(`M ${right} ${bottom - radii['bottom-right']} A ${radii['bottom-right']} ${radii['bottom-right']} 0 0 1 ${right - radii['bottom-right']} ${bottom}`);
  if (radii['bottom-left']) paths.push(`M ${x + radii['bottom-left']} ${bottom} A ${radii['bottom-left']} ${radii['bottom-left']} 0 0 1 ${x} ${bottom - radii['bottom-left']}`);

  return paths.join(' ');
};

const createChamferPath = (x, y, width, height, corner, size) => {
  const right = x + width;
  const bottom = y + height;
  const points = {
    'top-left': [[x + size, y], [right, y], [right, bottom], [x, bottom], [x, y + size]],
    'top-right': [[x, y], [right - size, y], [right, y + size], [right, bottom], [x, bottom]],
    'bottom-right': [[x, y], [right, y], [right, bottom - size], [right - size, bottom], [x, bottom]],
    'bottom-left': [[x, y], [right, y], [right, bottom], [x + size, bottom], [x, bottom - size]]
  }[corner];

  return `${points.map(([pointX, pointY]) => `${pointX},${pointY}`).join(' ')} Z`;
};

const createChamferHighlightPath = (x, y, width, height, corner, size) => {
  const right = x + width;
  const bottom = y + height;
  const highlights = {
    'top-left': `M ${x + size} ${y} L ${x} ${y + size}`,
    'top-right': `M ${right - size} ${y} L ${right} ${y + size}`,
    'bottom-right': `M ${right} ${bottom - size} L ${right - size} ${bottom}`,
    'bottom-left': `M ${x + size} ${bottom} L ${x} ${bottom - size}`
  };

  return highlights[corner];
};

const renderGeometry = (primitive, scope, parameters, piece, scale, x, y, width, height) => {
  const minimumDimensionMm = Math.min(piece.lengthMm, piece.widthMm);
  const minimumDimensionPx = Math.min(width, height);

  if (primitive === 'circle' && scope === 'outer-contour') {
    return (
      <circle
        className={styles.piece}
        cx={x + width / 2}
        cy={y + height / 2}
        r={minimumDimensionPx / 2}
        data-diameter-mm={formatMillimetres(piece.lengthMm)}
        data-geometry-primitive="circle"
        data-testid="service-plan-geometry-outer-circle"
      />
    );
  }

  if (primitive === 'circle') {
    const diameterMm = firstPositiveNumber(parameters?.diameter, parameters?.size)
      || minimumDimensionMm / 3;
    const maximumRadiusPx = Math.max(
      minimumDimensionPx / 2 - 1,
      minimumDimensionPx / 4,
      0.01
    );
    const radiusPx = clamp(
      (diameterMm * scale) / 2,
      Math.min(4, maximumRadiusPx),
      maximumRadiusPx
    );
    const centerX = x + clamp(
      firstPositiveNumber(parameters?.centerX, parameters?.positionX) * scale || width / 2,
      radiusPx,
      width - radiusPx
    );
    const centerY = y + clamp(
      firstPositiveNumber(parameters?.centerY, parameters?.positionY) * scale || height / 2,
      radiusPx,
      height - radiusPx
    );

    return (
      <circle
        className={styles.cut}
        cx={centerX}
        cy={centerY}
        r={radiusPx}
        data-diameter-mm={formatMillimetres(diameterMm)}
        data-geometry-primitive="circle"
        data-testid="service-plan-geometry-circle"
      />
    );
  }

  if (primitive === 'rounded-corners') {
    const radiusMm = firstPositiveNumber(parameters?.radius, parameters?.size)
      || minimumDimensionMm / 6;
    const radiusPx = clamp(radiusMm * scale, 4, minimumDimensionPx / 2);
    const radii = createCornerRadii(parameters, radiusPx);

    return (
      <g data-geometry-primitive="rounded-corners" data-testid="service-plan-geometry-rounded-corners">
        <path
          className={styles.piece}
          d={createRoundedPath(x, y, width, height, radii)}
          data-radius-mm={formatMillimetres(radiusMm)}
        />
        <path className={styles.cut} d={createRoundedHighlightPath(x, y, width, height, radii)} />
      </g>
    );
  }

  const sizeMm = firstPositiveNumber(parameters?.size, parameters?.length, parameters?.depth)
    || minimumDimensionMm / 6;
  const sizePx = clamp(sizeMm * scale, 4, minimumDimensionPx / 2);
  const corner = getCorner(parameters);

  return (
    <g data-geometry-primitive="chamfer" data-testid="service-plan-geometry-chamfer">
      <path
        className={styles.piece}
        d={createChamferPath(x, y, width, height, corner, sizePx)}
        data-size-mm={formatMillimetres(sizeMm)}
      />
      <path className={styles.cut} d={createChamferHighlightPath(x, y, width, height, corner, sizePx)} />
    </g>
  );
};

const DimensionLines = ({ x, y, width, height, piece, markerId }) => {
  const right = x + width;
  const bottom = y + height;
  const horizontalDimensionY = bottom + 42;
  const verticalDimensionX = right + 42;

  return (
    <g className={styles.dimensions} aria-label={`Dimensiones: ${formatMillimetres(piece.lengthMm)} por ${formatMillimetres(piece.widthMm)} milímetros`}>
      <line className={styles.extension} x1={x} x2={x} y1={bottom} y2={horizontalDimensionY + 8} />
      <line className={styles.extension} x1={right} x2={right} y1={bottom} y2={horizontalDimensionY + 8} />
      <line
        className={styles.dimension}
        markerEnd={`url(#${markerId})`}
        markerStart={`url(#${markerId})`}
        x1={x + 5}
        x2={right - 5}
        y1={horizontalDimensionY}
        y2={horizontalDimensionY}
      />
      <text className={styles.dimensionText} textAnchor="middle" x={x + width / 2} y={horizontalDimensionY - 9}>
        {formatMillimetres(piece.lengthMm)} mm
      </text>

      <line className={styles.extension} x1={right} x2={verticalDimensionX + 8} y1={y} y2={y} />
      <line className={styles.extension} x1={right} x2={verticalDimensionX + 8} y1={bottom} y2={bottom} />
      <line
        className={styles.dimension}
        markerEnd={`url(#${markerId})`}
        markerStart={`url(#${markerId})`}
        x1={verticalDimensionX}
        x2={verticalDimensionX}
        y1={y + 5}
        y2={bottom - 5}
      />
      <text
        className={styles.dimensionText}
        textAnchor="middle"
        transform={`rotate(-90 ${verticalDimensionX + 17} ${y + height / 2})`}
        x={verticalDimensionX + 17}
        y={y + height / 2}
      >
        {formatMillimetres(piece.widthMm)} mm
      </text>
    </g>
  );
};

const ServicePlanCanvas = ({ piece, operation, plan, className = '' }) => {
  const titleId = `service-plan-canvas-title-${useId().replace(/:/g, '')}`;
  const descriptionId = `${titleId}-description`;
  const markerId = `${titleId}-arrow`;
  const normalizedPiece = normalizePiece(piece, plan);

  if (!normalizedPiece) {
    return <div className={`${styles.status} ${className}`.trim()} role="status">No hay dimensiones de pieza para mostrar.</div>;
  }

  if (!normalizedPiece.lengthMm || !normalizedPiece.widthMm) {
    return <div className={`${styles.status} ${className}`.trim()} role="status">Las dimensiones deben ser mayores que cero.</div>;
  }

  const sourceOperation = getOperationSource(operation, plan);
  const geometry = resolveGeometry(sourceOperation);
  if (geometry.primitive && !SUPPORTED_PRIMITIVES.includes(geometry.primitive)) {
    return <div className={`${styles.status} ${className}`.trim()} role="status">Geometría no soportada.</div>;
  }
  if (
    geometry.primitive === 'circle'
    && geometry.scope === 'outer-contour'
    && normalizedPiece.lengthMm !== normalizedPiece.widthMm
  ) {
    return (
      <div className={`${styles.status} ${className}`.trim()} role="status">
        Un círculo exterior requiere largo y ancho iguales.
      </div>
    );
  }

  const scale = Math.min(
    PIECE_MAX_WIDTH / normalizedPiece.lengthMm,
    PIECE_MAX_HEIGHT / normalizedPiece.widthMm
  );
  const pieceWidth = normalizedPiece.lengthMm * scale;
  const pieceHeight = normalizedPiece.widthMm * scale;
  const x = PIECE_LEFT + (PIECE_MAX_WIDTH - pieceWidth) / 2;
  const y = PIECE_TOP + (PIECE_MAX_HEIGHT - pieceHeight) / 2;
  const pieceClassName = className ? `${styles.canvas} ${className}` : styles.canvas;

  return (
    <svg
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      className={pieceClassName}
      data-piece-length-mm={formatMillimetres(normalizedPiece.lengthMm)}
      data-piece-width-mm={formatMillimetres(normalizedPiece.widthMm)}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
    >
      <title id={titleId}>Plano CAD de pieza</title>
      <desc id={descriptionId}>
        Pieza rectangular de {formatMillimetres(normalizedPiece.lengthMm)} por {formatMillimetres(normalizedPiece.widthMm)} milímetros con cotas exteriores.
      </desc>
      <defs>
        <marker
          id={markerId}
          markerHeight="7"
          markerWidth="7"
          orient="auto"
          refX="3.5"
          refY="3.5"
        >
          <path className={styles.arrowHead} d="M 7 0 L 0 3.5 L 7 7" />
        </marker>
      </defs>
      {!geometry.primitive && (
        <rect className={styles.piece} height={pieceHeight} width={pieceWidth} x={x} y={y} />
      )}
      {geometry.primitive && renderGeometry(
        geometry.primitive,
        geometry.scope,
        geometry.parameters,
        normalizedPiece,
        scale,
        x,
        y,
        pieceWidth,
        pieceHeight
      )}
      <DimensionLines
        height={pieceHeight}
        markerId={markerId}
        piece={normalizedPiece}
        width={pieceWidth}
        x={x}
        y={y}
      />
    </svg>
  );
};

export default ServicePlanCanvas;
