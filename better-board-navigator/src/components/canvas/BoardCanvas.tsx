import { useState, useRef, useEffect, useCallback } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { usePanZoom } from '../../hooks/usePanZoom';
import { useBoardGeometry } from '../../hooks/useBoardGeometry';
import { renderBoard } from './canvasRenderer';

function BoardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const hoverStateRef = useRef(false); 

  const store = useBoardStore();
  const isMirrored = store.mirrorState[store.currentSide];
  const { boardCenterX, boardCenterY, componentHitboxes } = useBoardGeometry(store.boardData, store.currentSide);


  const getHitboxCoords = useCallback((rawWx: number, rawWy: number) => {
    let wx = rawWx;
    let wy = rawWy;

    if (isMirrored) {
      wx = boardCenterX * 2 - wx;
    }

    if (store.rotation !== 0) {
      const rad = (-store.rotation * Math.PI) / 180;
      const dx = wx - boardCenterX;
      const dy = wy - boardCenterY;

      wx = dx * Math.cos(rad) - dy * Math.sin(rad) + boardCenterX;
      wy = dx * Math.sin(rad) + dy * Math.cos(rad) + boardCenterY;
    }

    return { wx, wy };
  }, [isMirrored, store.rotation, boardCenterX, boardCenterY]);


  // Click logic
  const handleCanvasClick = useCallback((rawWorldX: number, rawWorldY: number, isMultiSelect: boolean) => {
    if (!store.boardData) return;

    const { wx, wy } = getHitboxCoords(rawWorldX, rawWorldY);
    
    const clickedNames = componentHitboxes
      .filter(box => wx >= box.minX && wx <= box.maxX && wy >= box.minY && wy <= box.maxY)
      .map(box => box.name);

    if (clickedNames.length === 0) {
      if (!isMultiSelect) store.setInspectedComponents([]);
      return; 
    }

    const firstComp = store.boardData.components[clickedNames[0]];
    if (firstComp && firstComp.side !== store.currentSide) {
      store.setCurrentSide(firstComp.side);
    }

    if (isMultiSelect) {
      if (store.inspectedComponents.length > 0) store.setInspectedComponents([]);
      if (store.highlightedPrefix) store.setHighlightedPrefix(null);
      store.selectComponents(clickedNames, true);
    } else {
      store.setInspectedComponents(clickedNames); // Przekazujemy wszystkie naraz!
    }
  }, [store, boardCenterX, componentHitboxes, getHitboxCoords]);


  // Camera
  const { scale, offset, handlers, resetView, focusOnBoundingBox } = usePanZoom(canvasRef, handleCanvasClick);


  // Auto focus
  useEffect(() => {
    if (store.componentToFocus && store.boardData) {
      const box = componentHitboxes.find(b => b.name === store.componentToFocus);
      if (box) {
        let cx = (box.minX + box.maxX) / 2;
        let cy = (box.minY + box.maxY) / 2;
        let w = box.maxX - box.minX;
        let h = box.maxY - box.minY;

        if (store.rotation !== 0) {
          const rad = (store.rotation * Math.PI) / 180;
          const dx = cx - boardCenterX;
          const dy = cy - boardCenterY;
          cx = dx * Math.cos(rad) - dy * Math.sin(rad) + boardCenterX;
          cy = dx * Math.sin(rad) + dy * Math.cos(rad) + boardCenterY;
          
          if (store.rotation === 90 || store.rotation === 270) {
            [w, h] = [h, w]; 
          }
        }

        if (isMirrored) {
          cx = boardCenterX * 2 - cx;
        }

        const padding = Math.max(15, Math.max(w, h) * 0.5);
        focusOnBoundingBox(cx - w/2 - padding, cx + w/2 + padding, cy - h/2 - padding, cy + h/2 + padding);
      }
      store.clearFocus();
    }
  }, [store.componentToFocus, store, componentHitboxes, focusOnBoundingBox, boardCenterX, boardCenterY]);
  

  // Reset View
  useEffect(() => {
    if (store.boardData) resetView(store.boardData);
  }, [store.boardData, resetView]);
  

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !store.boardData) return;
    
    if (canvas.parentElement) {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderBoard({
      ctx,
      boardData: store.boardData,
      scale,
      offset,
      boardCenterX,
      boardCenterY,
      rotation: store.rotation,
      isMirrored: isMirrored,
      isDarkMode: store.isDarkMode,
      showOutlines: store.showOutlines,
      currentSide: store.currentSide,
      selectedComponents: store.selectedComponents,
      inspectedComponents: store.inspectedComponents,
      selectedNet: store.selectedNet,
      highlightedPrefix: store.highlightedPrefix,
      showLabels: store.showLabels,
      componentHitboxes: componentHitboxes
    });
  }, [store, scale, offset, boardCenterX, boardCenterY, isMirrored]);


  // Mouse Clicking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();

      // revert Camera offset and scale
      const rawWx = ((e.clientX - rect.left) - offset.x) / scale;
      const rawWy = ((e.clientY - rect.top) - offset.y) / scale;

      // revert mirroring and rotation
      const { wx, wy } = getHitboxCoords(rawWx, rawWy);

      const foundHover = componentHitboxes.some(box => 
        wx >= box.minX && wx <= box.maxX && 
        wy >= box.minY && wy <= box.maxY
      );

      if (foundHover !== hoverStateRef.current) {
        hoverStateRef.current = foundHover;
        setIsHovering(foundHover);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, [componentHitboxes, scale, offset, getHitboxCoords]);


  return (
    <div className="w-full h-full relative block overflow-hidden">
      <canvas 
        ref={canvasRef}
        {...handlers}
        className={`absolute inset-0 block w-full h-full touch-none active:cursor-grabbing ${
          isSelectionMode ? 'cursor-crosshair' : (isHovering ? 'cursor-pointer' : 'cursor-grab')
        }`}
      />
    </div>
  );
}

export default BoardCanvas;