import { useRef, useEffect, useCallback } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { usePanZoom } from '../../hooks/usePanZoom';
import type { ShapeData } from '../../types/board';

function BoardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { boardData, currentSide, isDarkMode, showOutlines, 
    selectedComponents, selectComponents } = useBoardStore();

  const { scale, offset, handlers, resetView } = usePanZoom(canvasRef);

  const handleCanvasClick = useCallback((worldX: number, worldY: number) => {
    if (!boardData) return;

    const clickedComps = Object.entries(boardData.components).filter(([name, comp]) => {
      if (comp.side !== currentSide && comp.mountingType !== 'TH') return false;

      const shape = comp.shapeData;
      if (!shape) return;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const addPoint = (x: number, y: number) => {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      };

      if (shape.type === 'Line') {
        addPoint(shape.start.x, shape.start.y);
        addPoint(shape.end.x, shape.end.y);

      } else if (shape.type === 'Rectangle' && shape.points) {
        shape.points.forEach(p => addPoint(p.x, p.y));

      } else if (shape.type === 'Circle' || shape.type === 'Arc') {
        addPoint(shape.center.x - shape.radius, shape.center.y - shape.radius);
        addPoint(shape.center.x + shape.radius, shape.center.y + shape.radius);
      }

      const tolerance = 0.5;
      return (worldX >= minX - tolerance && worldX <= maxX + tolerance && 
          worldY >= minY - tolerance && worldY <= maxY + tolerance);
    });

    const clickedNames = clickedComps.map(c => c[0]);
    selectComponents(clickedNames);
  }, [boardData, currentSide, selectComponents]);

  useEffect(() => {
    if (boardData && boardData.boardDimensions) {
      resetView(boardData);
    }
  }, [boardData, resetView]);

  const addShapeToPath = (ctx: CanvasRenderingContext2D, shape: ShapeData) => {
    if (shape.type === 'Line') {
      ctx.moveTo(shape.start.x, shape.start.y);
      ctx.lineTo(shape.end.x, shape.end.y);

    } else if (shape.type === 'Arc') {
      ctx.arc(shape.center.x, shape.center.y, shape.radius, shape.startAngle, shape.endAngle);
    
    } else if (shape.type === 'Circle') {
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


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !boardData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    // clearing and setting background
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = isDarkMode ? '#0a0a0a' : '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    const baseLineWidth = 1 / scale; // constant line size

    // 1. Drawing outlines
    if (showOutlines && boardData.outlines) {
      ctx.beginPath();
      ctx.lineWidth = baseLineWidth * 2;
      ctx.strokeStyle = isDarkMode ? '#e2e8f0' : '#475569';
      
      boardData.outlines.forEach(shape => addShapeToPath(ctx, shape));
      ctx.stroke();
    }

    // Grouping pads and components
    const thtPads: ShapeData[] = [];
    const smtPads: ShapeData[] = [];
    const bodyShapes: ShapeData[] = [];
    const selectedShapes: ShapeData[] = []
    Object.entries(boardData.components).forEach(([compName, comp]) => {
      const isOnCurrentSide = comp.side === currentSide;
      const isTH = comp.mountingType === 'TH';
      const isSelected = selectedComponents.has(compName);
      
      if (isOnCurrentSide && comp.shapeData) {
        if (isSelected) selectedShapes.push(comp.shapeData);
        else bodyShapes.push(comp.shapeData);
      }

      if ((isOnCurrentSide || isTH) && comp.pins) {
        Object.values(comp.pins).forEach(pin => {
          if (pin.shapeData) {
           if (isSelected) selectedShapes.push(pin.shapeData);
            else if (isTH) thtPads.push(pin.shapeData);
            else smtPads.push(pin.shapeData);
          }
        });
      }
    });

    // 2. Drawing components
    if (bodyShapes.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = baseLineWidth;
      ctx.strokeStyle = isDarkMode ? '#4ade80' : '#16a34a';
      bodyShapes.forEach(shape => addShapeToPath(ctx, shape));
      ctx.stroke();
    }

    // 3. SMT pads
    if (smtPads.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = baseLineWidth;
      ctx.strokeStyle = isDarkMode ? '#fbbf24' : '#d97706';
      smtPads.forEach(shape => addShapeToPath(ctx, shape));
      ctx.stroke();
    }

    // 4. THT pads
    if (thtPads.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = baseLineWidth;
      ctx.strokeStyle = isDarkMode ? '#60a5fa' : '#2563eb';
      thtPads.forEach(shape => addShapeToPath(ctx, shape));
      ctx.stroke();
    }

    if (selectedShapes.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = baseLineWidth * 3;
      ctx.strokeStyle = isDarkMode ? '#f43f5e' : '#e11d48'; 
      selectedShapes.forEach(shape => addShapeToPath(ctx, shape));
      ctx.stroke();
    }

    ctx.restore(); 
  }, [boardData, currentSide, isDarkMode, showOutlines, scale, offset, selectedComponents]);

  return (
    <div className="w-full h-full relative block overflow-hidden">
        <canvas 
          ref={canvasRef}
          {...handlers}
          className="absolute inset-0 block w-full h-full cursor-grab active:cursor-grabbing touch-none"
        />
    </div>
  );
}

export default BoardCanvas;