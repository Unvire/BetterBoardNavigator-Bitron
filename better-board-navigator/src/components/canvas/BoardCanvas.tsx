import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { usePanZoom } from '../../hooks/usePanZoom';
import type { ShapeData } from '../../types/board';

function BoardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    boardData, currentSide, setCurrentSide, isMirrored, setIsMirrored, 
    isDarkMode, showOutlines, selectedComponents, selectComponents, 
    selectedNet, componentToFocus, clearFocus 
  } = useBoardStore();


  const boardCenterX = useMemo(() => {
    if (!boardData) return 0;
    let minX = Infinity, maxX = -Infinity;

    const addPoint = (x: number) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    };

    const processShape = (shape: ShapeData) => {
      if (shape.type === 'Line' && shape.start && shape.end) {
        addPoint(shape.start.x); addPoint(shape.end.x);
      } else if (shape.type === 'Rectangle' && shape.points) {
        shape.points.forEach(p => addPoint(p.x));
      } else if ((shape.type === 'Circle' || shape.type === 'Arc') && shape.center) {
        addPoint(shape.center.x - (shape.radius || 0));
        addPoint(shape.center.x + (shape.radius || 0));
      }
    };

    if (boardData.outlines && boardData.outlines.length > 0) {
      boardData.outlines.forEach(processShape);
    } else {
      // Fallback: Brak zarysu płyty. Liczymy z komponentów (wymóg specyfikacji)
      Object.values(boardData.components).forEach(comp => {
        if (comp.shapeData) processShape(comp.shapeData);
        if (comp.pins) Object.values(comp.pins).forEach(p => p.shapeData && processShape(p.shapeData));
      });
    }

    return minX !== Infinity ? (minX + maxX) / 2 : 0;
  }, [boardData]);


  const handleCanvasClick = useCallback((clickWorldX: number, clickWorldY: number, isMultiSelect: boolean) => {
    if (!boardData) return;

    const worldX = isMirrored ? (boardCenterX * 2 - clickWorldX) : clickWorldX;
    const worldY = clickWorldY;

    const clickedComps = Object.entries(boardData.components).filter(([_, comp]) => {
      if (comp.side !== currentSide && comp.mountingType !== 'TH') return false;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      let hasGeometry = false;
      const pinKeys = comp.pins ? Object.keys(comp.pins) : [];
      const hasSinglePin = pinKeys.length === 1;

      const addPoint = (x: number, y: number) => {
        hasGeometry = true;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      };

      const processShape = (shape: ShapeData) => {
        if (shape.type === 'Line' && shape.start && shape.end) {
          addPoint(shape.start.x, shape.start.y);
          addPoint(shape.end.x, shape.end.y);

        } else if (shape.type === 'Rectangle' && shape.points) {
          shape.points.forEach(p => addPoint(p.x, p.y));

        } else if (shape.type === 'Circle' || shape.type === 'Arc' && shape.center) {
          addPoint(shape.center.x - (shape.radius || 0), shape.center.y - (shape.radius || 0));
          addPoint(shape.center.x + (shape.radius || 0), shape.center.y + (shape.radius || 0));
        }
      }

      if (comp.shapeData && !hasSinglePin) processShape(comp.shapeData);

      if (comp.pins) {
        Object.values(comp.pins).forEach(pin => {
          if (pin.shapeData) processShape(pin.shapeData);
        });
      }

      if (!hasGeometry) return false;

      const tolerance = 0.5;
      return (
        worldX >= minX - tolerance && 
        worldX <= maxX + tolerance && 
        worldY >= minY - tolerance && 
        worldY <= maxY + tolerance
      );
    });

    const clickedNames = clickedComps.map(c => c[0]);

    // ignore clicking in background
    if (clickedNames.length === 0) return; 

    const firstComp = boardData.components[clickedNames[0]];
    if (firstComp && firstComp.side !== currentSide) {
      setCurrentSide(firstComp.side);
      setIsMirrored(firstComp.side === 'B');
    }

    // prevent from losing selected components by accidental component click
    if (selectedComponents.size > 1 && !isMultiSelect) return; 

    selectComponents(clickedNames, isMultiSelect);
  }, [boardData, currentSide, isMirrored, selectComponents, setCurrentSide, setIsMirrored]);


  const { scale, offset, handlers, resetView, focusOnBoundingBox } = usePanZoom(canvasRef, handleCanvasClick);


  useEffect(() => {
    if (componentToFocus && boardData && boardData.components[componentToFocus]) {
      const comp = boardData.components[componentToFocus];
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

      const pinKeys = comp.pins ? Object.keys(comp.pins) : [];
      const hasSinglePin = pinKeys.length === 1;

      const addPoint = (x: number, y: number) => {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      };

      const processShape = (shape: ShapeData) => {
        if (shape.type === 'Line' && shape.start && shape.end) {
          addPoint(shape.start.x, shape.start.y);
          addPoint(shape.end.x, shape.end.y);

        } else if (shape.type === 'Rectangle' && shape.points) {
          shape.points.forEach(p => addPoint(p.x, p.y));
          
        } else if ((shape.type === 'Circle' || shape.type === 'Arc') && shape.center) {
          addPoint(shape.center.x - (shape.radius || 0), shape.center.y - (shape.radius || 0));
          addPoint(shape.center.x + (shape.radius || 0), shape.center.y + (shape.radius || 0));
        }
      };

      if (comp.shapeData && !hasSinglePin) processShape(comp.shapeData);

      if (comp.pins) {
        Object.values(comp.pins).forEach(pin => {
          if (pin.shapeData) processShape(pin.shapeData);
        });
      }

      if (minX === Infinity && comp.coords) {
        addPoint(comp.coords.x, comp.coords.y);
      }

      if (minX !== Infinity) {
        const width = maxX - minX;
        const height = maxY - minY;
        const padding = Math.max(15, Math.max(width, height) * 0.5); 
        
        if (isMirrored) {
          const mirroredMinX = boardCenterX * 2 - maxX;
          const mirroredMaxX = boardCenterX * 2 - minX;
          focusOnBoundingBox(mirroredMinX - padding, mirroredMaxX + padding, minY - padding, maxY + padding);

        } else {
          focusOnBoundingBox(minX - padding, maxX + padding, minY - padding, maxY + padding);
        }
      }
      clearFocus();
    }
  }, [componentToFocus, boardData, isMirrored, boardCenterX, focusOnBoundingBox, clearFocus]);


  useEffect(() => {
    if (boardData) {
      resetView(boardData);
    }
  }, [boardData, resetView]);


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
    ctx.fillStyle = isDarkMode ? '#0a0a0a' : '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // transformations
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    if (isMirrored) {
      ctx.translate(boardCenterX, 0);
      ctx.scale(-1, 1);
      ctx.translate(-boardCenterX, 0);
    }

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
    const selectedShapes: ShapeData[] = [];
    const netShapes: ShapeData[] = [];

    Object.entries(boardData.components).forEach(([compName, comp]) => {
      const isOnCurrentSide = comp.side === currentSide;
      const isTH = comp.mountingType === 'TH';
      const isSelected = selectedComponents.has(compName);

      const pinKeys = comp.pins ? Object.keys(comp.pins) : [];
      const hasSinglePin = pinKeys.length === 1;
      
      if (isOnCurrentSide && comp.shapeData && !hasSinglePin) {
        if (isSelected) selectedShapes.push(comp.shapeData);
        else bodyShapes.push(comp.shapeData);
      }

      if ((isOnCurrentSide || isTH) && comp.pins) {
        Object.values(comp.pins).forEach(pin => {
          if (pin.shapeData) {
            if (isSelected) selectedShapes.push(pin.shapeData);
            else if (selectedNet && pin.net === selectedNet) netShapes.push(pin.shapeData);
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
      ctx.fillStyle = isDarkMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(217, 119, 6, 0.2)';
      smtPads.forEach(shape => addShapeToPath(ctx, shape));
      ctx.fill();
      ctx.stroke();
    }

    // 4. THT pads
    if (thtPads.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = baseLineWidth;
      ctx.strokeStyle = isDarkMode ? '#60a5fa' : '#2563eb';
      ctx.fillStyle = isDarkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.2)';
      thtPads.forEach(shape => addShapeToPath(ctx, shape));
      ctx.fill();
      ctx.stroke();
    }

    // 5. Selected component
    if (selectedShapes.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = baseLineWidth * 1.5;
      ctx.strokeStyle = isDarkMode ? '#f43f5e' : '#e11d48'; 
      ctx.fillStyle = isDarkMode ? 'rgba(244, 63, 94, 0.4)' : 'rgba(225, 29, 72, 0.4)';
      selectedShapes.forEach(shape => addShapeToPath(ctx, shape));
      ctx.fill();
      ctx.stroke();
    }

    // 6. Selected net
    if (netShapes.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = baseLineWidth * 2;
      ctx.strokeStyle = isDarkMode ? '#d946ef' : '#c026d3'; 
      ctx.fillStyle = isDarkMode ? 'rgba(217, 70, 239, 0.5)' : 'rgba(192, 38, 211, 0.5)';
      netShapes.forEach(shape => addShapeToPath(ctx, shape));
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore(); 
  }, [boardData, currentSide, isMirrored, boardCenterX, isDarkMode, showOutlines, scale, offset, selectedComponents, selectedNet]);

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