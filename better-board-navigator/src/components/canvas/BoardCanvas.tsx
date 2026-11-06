import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { usePanZoom } from '../../hooks/usePanZoom';
import type { ShapeData } from '../../types/board';

function BoardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  const hoverStateRef = useRef(false); 

  const { 
    boardData, currentSide, setCurrentSide, isMirrored, setIsMirrored, 
    isDarkMode, showOutlines, selectedComponents, selectComponents, 
    selectedNet, componentToFocus, clearFocus, 
    inspectedComponent, setInspectedComponent, clearSelection
  } = useBoardStore();

  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setIsSelectionMode(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') setIsSelectionMode(false);
    };
    const handleBlur = () => setIsSelectionMode(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  
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
      Object.values(boardData.components).forEach(comp => {
        if (comp.shapeData) processShape(comp.shapeData);
        if (comp.pins) Object.values(comp.pins).forEach(p => p.shapeData && processShape(p.shapeData));
      });
    }

    return minX !== Infinity ? (minX + maxX) / 2 : 0;
  }, [boardData]);

  // --- HITBOXES for mouse hovering ---
  const componentHitboxes = useMemo(() => {
    if (!boardData) return [];
    const boxes: { name: string, minX: number, maxX: number, minY: number, maxY: number }[] = [];
    
    Object.entries(boardData.components).forEach(([name, comp]) => {
      if (comp.side !== currentSide && comp.mountingType !== 'TH') return;

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
        } else if ((shape.type === 'Circle' || shape.type === 'Arc') && shape.center) {
          addPoint(shape.center.x - (shape.radius || 0), shape.center.y - (shape.radius || 0));
          addPoint(shape.center.x + (shape.radius || 0), shape.center.y + (shape.radius || 0));
        }
      };

      if (comp.shapeData && !hasSinglePin) processShape(comp.shapeData);
      if (comp.pins) Object.values(comp.pins).forEach(pin => pin.shapeData && processShape(pin.shapeData));

      if (hasGeometry) boxes.push({ name, minX, maxX, minY, maxY });
    });

    return boxes;
  }, [boardData, currentSide]);

  const handleCanvasClick = useCallback((clickWorldX: number, clickWorldY: number, isMultiSelect: boolean) => {
    if (!boardData) return;

    const worldX = isMirrored ? (boardCenterX * 2 - clickWorldX) : clickWorldX;
    const worldY = clickWorldY;

    const tolerance = 0.5;
    const clickedNames: string[] = [];
    
    for (let i = 0; i < componentHitboxes.length; i++) {
      const box = componentHitboxes[i];
      if (worldX >= box.minX - tolerance && worldX <= box.maxX + tolerance &&
          worldY >= box.minY - tolerance && worldY <= box.maxY + tolerance) {
        clickedNames.push(box.name);
      }
    }

    if (clickedNames.length === 0) {
      if (!isMultiSelect) {
        setInspectedComponent(null);
      }
      return; 
    }

    const firstCompName = clickedNames[0];
    const firstComp = boardData.components[firstCompName];

    if (firstComp && firstComp.side !== currentSide) {
      setCurrentSide(firstComp.side);
      setIsMirrored(firstComp.side === 'B');
    }

    if (isMultiSelect) {
      if (inspectedComponent === firstCompName) setInspectedComponent(null);

      selectComponents(clickedNames, true);
    } else setInspectedComponent(firstCompName);
  }, [
    boardData, currentSide, isMirrored, boardCenterX, selectComponents, 
    setCurrentSide, setIsMirrored, inspectedComponent, setInspectedComponent, componentHitboxes
  ]);

  
  const { scale, offset, handlers, resetView, focusOnBoundingBox } = usePanZoom(canvasRef, handleCanvasClick);

  
  useEffect(() => {
    if (componentToFocus && boardData && boardData.components[componentToFocus]) {
      const comp = boardData.components[componentToFocus];
      const box = componentHitboxes.find(b => b.name === componentToFocus);
      
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      
      if (box) {
        minX = box.minX; maxX = box.maxX; minY = box.minY; maxY = box.maxY;
      } else if (comp.coords) {
        minX = comp.coords.x; maxX = comp.coords.x;
        minY = comp.coords.y; maxY = comp.coords.y;
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
  }, [componentToFocus, boardData, isMirrored, boardCenterX, focusOnBoundingBox, clearFocus, componentHitboxes]);

  
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

    // Grouping pads and components
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

      const pinKeys = comp.pins ? Object.keys(comp.pins) : [];
      const hasSinglePin = pinKeys.length === 1;
      
      if (isOnCurrentSide && comp.shapeData && !hasSinglePin) {
        if (isInspected) inspectedShapes.push(comp.shapeData);
        else if (isSelected) selectedShapes.push(comp.shapeData);
        else bodyShapes.push(comp.shapeData);
      }

      if ((isOnCurrentSide || isTH) && comp.pins) {
        Object.values(comp.pins).forEach(pin => {
          if (pin.shapeData) {
            if (isInspected) inspectedShapes.push(pin.shapeData);
            else if (isSelected) selectedShapes.push(pin.shapeData);
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

    // B. Pady SMD
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

    // 7. Inspected component (2nd selection)
    if (inspectedShapes.length > 0) {
      ctx.beginPath();
      ctx.lineWidth = baseLineWidth * 2;
      ctx.strokeStyle = isDarkMode ? '#22d3ee' : '#0891b2';
      ctx.fillStyle = isDarkMode ? 'rgba(34, 211, 238, 0.4)' : 'rgba(8, 145, 178, 0.4)';
      inspectedShapes.forEach(shape => addShapeToPath(ctx, shape));
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore(); 
  }, [boardData, currentSide, isMirrored, boardCenterX, isDarkMode, showOutlines, scale, 
    offset, selectedComponents, selectedNet, inspectedComponent]);
  

  // --- MOUSE HOVER ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      let worldX = (screenX - offset.x) / scale;
      const worldY = (screenY - offset.y) / scale;

      if (isMirrored) worldX = boardCenterX * 2 - worldX;

      const tolerance = 0.5;
      let foundHover = false;

      for (let i = 0; i < componentHitboxes.length; i++) {
        const box = componentHitboxes[i];
        if (worldX >= box.minX - tolerance && worldX <= box.maxX + tolerance &&
            worldY >= box.minY - tolerance && worldY <= box.maxY + tolerance) {
          foundHover = true;
          break;
        }
      }

      if (foundHover !== hoverStateRef.current) {
        hoverStateRef.current = foundHover;
        setIsHovering(foundHover);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, [componentHitboxes, scale, offset, isMirrored, boardCenterX]);
  
  return (
    <div className="w-full h-full relative block overflow-hidden">
      <canvas 
        ref={canvasRef}
        {...handlers}
        className={`absolute inset-0 block w-full h-full touch-none active:cursor-grabbing ${
          isSelectionMode 
            ? 'cursor-crosshair'
            : isHovering 
              ? 'cursor-pointer'
              : 'cursor-grab'
        }`}
      />
    </div>
  );
}

export default BoardCanvas;