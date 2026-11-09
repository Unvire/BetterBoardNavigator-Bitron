import type { BoardData, ShapeData } from '../../types/board';

export interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  boardData: BoardData;
  scale: number;
  offset: { x: number; y: number };
  isMirrored: boolean;
  boardCenterX: number;
  isDarkMode: boolean;
  showOutlines: boolean;
  currentSide: 'T' | 'B';
  selectedComponents: Set<string>;
  inspectedComponent: string | null;
  selectedNet: string | null;
  highlightedPrefix: string | null;
}


const addShapeToPath = (ctx: CanvasRenderingContext2D, shape: ShapeData) => {
  if (shape.type === 'Line' && shape.start && shape.end) {
    ctx.moveTo(shape.start.x, shape.start.y);
    ctx.lineTo(shape.end.x, shape.end.y);
  } else if (shape.type === 'Arc' && shape.center && shape.radius !== undefined && shape.startAngle !== undefined && shape.endAngle !== undefined) {
    ctx.arc(shape.center.x, shape.center.y, shape.radius, shape.startAngle, shape.endAngle);
  } else if (shape.type === 'Circle' && shape.center && shape.radius !== undefined) {
    ctx.moveTo(shape.center.x + shape.radius, shape.center.y);
    ctx.arc(shape.center.x, shape.center.y, shape.radius, 0, 2 * Math.PI);
  } else if (shape.type === 'Rectangle' && shape.points && shape.points.length === 4) {
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    ctx.lineTo(shape.points[1].x, shape.points[1].y);
    ctx.lineTo(shape.points[2].x, shape.points[2].y);
    ctx.lineTo(shape.points[3].x, shape.points[3].y);
    ctx.closePath();
  }
};

export const renderBoard = (options: RenderOptions) => {
  const { 
    ctx, boardData, scale, offset, isMirrored, boardCenterX, 
    isDarkMode, showOutlines, currentSide, 
    selectedComponents, inspectedComponent, selectedNet, highlightedPrefix
  } = options;

  const canvas = ctx.canvas;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = isDarkMode ? '#0a0a0a' : '#f1f5f9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(offset.x, offset.y);
  ctx.scale(scale, scale);

  if (isMirrored) {
    ctx.translate(boardCenterX, 0);
    ctx.scale(-1, 1);
    ctx.translate(-boardCenterX, 0);
  }

  const baseLineWidth = 1 / scale;

  // 1. Drawing outlines
  if (showOutlines && boardData.outlines) {
    ctx.beginPath();
    ctx.lineWidth = baseLineWidth * 2;
    ctx.strokeStyle = isDarkMode ? '#e2e8f0' : '#475569';
    boardData.outlines.forEach(shape => addShapeToPath(ctx, shape));
    ctx.stroke();
  }

  // Objects grouping
  const thtPads: ShapeData[] = [];
  const smtPads: ShapeData[] = [];
  const bodyShapes: ShapeData[] = [];
  const selectedShapes: ShapeData[] = [];
  const netShapes: ShapeData[] = [];
  const inspectedShapes: ShapeData[] = [];

  Object.entries(boardData.components).forEach(([compName, comp]) => {
    const isOnCurrentSide = comp.side === currentSide;
    const isTH = comp.mountingType === 'TH';
    const isSelected = selectedComponents.has(compName);
    const isInspected = inspectedComponent === compName;
    const hasSinglePin = comp.pins ? Object.keys(comp.pins).length === 1 : false;

    const match = compName.match(/^[a-zA-Z]+/);
    const compPrefix = match ? match[0].toUpperCase() : '#';
    const isPrefixHighlighted = highlightedPrefix === compPrefix;
    
    if (isOnCurrentSide && comp.shapeData && !hasSinglePin) {
      if (isInspected || isPrefixHighlighted) inspectedShapes.push(comp.shapeData);
      else if (isSelected) selectedShapes.push(comp.shapeData);
      else bodyShapes.push(comp.shapeData);
    }

    if ((isOnCurrentSide || isTH) && comp.pins) {
      Object.values(comp.pins).forEach(pin => {
        if (pin.shapeData) {
          if (selectedNet && pin.net === selectedNet) netShapes.push(pin.shapeData);
          else if (isInspected || isPrefixHighlighted) inspectedShapes.push(pin.shapeData);
          else if (isSelected) selectedShapes.push(pin.shapeData);
          else if (isTH) thtPads.push(pin.shapeData);
          else smtPads.push(pin.shapeData);
        }
      });
    }
  });

  // Helper for drawing collections
  const drawGroup = (shapes: ShapeData[], lineW: number, strokeColor: string, fillColor?: string) => {
    if (shapes.length === 0) return;
    ctx.beginPath();
    ctx.lineWidth = lineW;
    ctx.strokeStyle = strokeColor;
    if (fillColor) ctx.fillStyle = fillColor;
    shapes.forEach(shape => addShapeToPath(ctx, shape));
    if (fillColor) ctx.fill();
    ctx.stroke();
  };

  drawGroup(bodyShapes, baseLineWidth, isDarkMode ? '#4ade80' : '#16a34a');
  drawGroup(smtPads, baseLineWidth, isDarkMode ? '#fbbf24' : '#d97706', isDarkMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(217, 119, 6, 0.2)');
  drawGroup(thtPads, baseLineWidth, isDarkMode ? '#60a5fa' : '#2563eb', isDarkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.2)');
  drawGroup(selectedShapes, baseLineWidth * 1.5, isDarkMode ? '#f43f5e' : '#e11d48', isDarkMode ? 'rgba(244, 63, 94, 0.4)' : 'rgba(225, 29, 72, 0.4)');
  drawGroup(inspectedShapes, baseLineWidth * 2, isDarkMode ? '#22d3ee' : '#0891b2', isDarkMode ? 'rgba(34, 211, 238, 0.4)' : 'rgba(8, 145, 178, 0.4)');
  drawGroup(netShapes, baseLineWidth * 2, isDarkMode ? '#d946ef' : '#c026d3', isDarkMode ? 'rgba(217, 70, 239, 0.5)' : 'rgba(192, 38, 211, 0.5)');

  ctx.restore(); 
};