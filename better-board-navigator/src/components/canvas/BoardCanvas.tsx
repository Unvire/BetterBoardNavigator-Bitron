import { useRef, useEffect } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { usePanZoom } from '../../hooks/usePanZoom';
import type { ShapeData } from '../../types/board';

function BoardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { boardData, currentSide, isDarkMode, showOutlines } = useBoardStore();

  const { scale, offset, handlers, resetView } = usePanZoom(canvasRef);

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
    } else if (shape.type === 'Rectangle') {
      if (shape.points && shape.points.length === 4) {
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        ctx.lineTo(shape.points[1].x, shape.points[1].y);
        ctx.lineTo(shape.points[2].x, shape.points[2].y);
        ctx.lineTo(shape.points[3].x, shape.points[3].y);
        ctx.closePath();
      }
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
    Object.values(boardData.components).forEach(comp => {
      const isOnCurrentSide = comp.side === currentSide;
      const isTH = comp.mountingType === 'TH';
      
      if (isOnCurrentSide && comp.shapeData) {
        bodyShapes.push(comp.shapeData);
      }

      if ((isOnCurrentSide || isTH) && comp.pins) {
        Object.values(comp.pins).forEach(pin => {
          if (pin.shapeData) {
            if (isTH) thtPads.push(pin.shapeData);
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

    ctx.restore(); 
  }, [boardData, currentSide, isDarkMode, showOutlines, scale, offset]);

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