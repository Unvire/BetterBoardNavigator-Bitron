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
  

  const { boardCenterX, componentHitboxes } = useBoardGeometry(store.boardData, store.currentSide);

  // Shortcuts
  useEffect(() => {
    const toggleSelect = (e: KeyboardEvent) => setIsSelectionMode(e.key === 'Control' || e.key === 'Meta');
    const handleBlur = () => setIsSelectionMode(false);

    window.addEventListener('keydown', toggleSelect);
    window.addEventListener('keyup', toggleSelect);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', toggleSelect);
      window.removeEventListener('keyup', toggleSelect);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);


  // Click logic
  const handleCanvasClick = useCallback((clickWorldX: number, clickWorldY: number, isMultiSelect: boolean) => {
    if (!store.boardData) return;
    const worldX = store.isMirrored ? (boardCenterX * 2 - clickWorldX) : clickWorldX;
    
    const clickedNames = componentHitboxes
      .filter(box => worldX >= box.minX - 0.5 && worldX <= box.maxX + 0.5 && clickWorldY >= box.minY - 0.5 && clickWorldY <= box.maxY + 0.5)
      .map(box => box.name);

    if (clickedNames.length === 0) {
      if (!isMultiSelect) store.setInspectedComponent(null);
      return; 
    }

    const firstComp = store.boardData.components[clickedNames[0]];
    if (firstComp && firstComp.side !== store.currentSide) {
      store.setCurrentSide(firstComp.side);
      store.setIsMirrored(firstComp.side === 'B');
    }

    if (isMultiSelect) {
      if (store.inspectedComponent) store.setInspectedComponent(null);
      store.selectComponents(clickedNames, true);
    } else {
      store.setInspectedComponent(clickedNames[0]);
    }
  }, [store, boardCenterX, componentHitboxes]);


  // Camera
  const { scale, offset, handlers, resetView, focusOnBoundingBox } = usePanZoom(canvasRef, handleCanvasClick);


  // Auto focus
  useEffect(() => {
    if (store.componentToFocus && store.boardData) {
      const box = componentHitboxes.find(b => b.name === store.componentToFocus);
      if (box) {
        const padding = Math.max(15, Math.max(box.maxX - box.minX, box.maxY - box.minY) * 0.5);
        if (store.isMirrored) {
          focusOnBoundingBox(boardCenterX * 2 - box.maxX - padding, boardCenterX * 2 - box.minX + padding, box.minY - padding, box.maxY + padding);
        } else {
          focusOnBoundingBox(box.minX - padding, box.maxX + padding, box.minY - padding, box.maxY + padding);
        }
      }
      store.clearFocus();
    }
  }, [store.componentToFocus, store, componentHitboxes, focusOnBoundingBox, boardCenterX]);


  useEffect(() => {
    if (store.boardData) resetView(store.boardData);
  }, [store.boardData, resetView]);


  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !store.boardData) return;
    
    // Auto-resize
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
      isMirrored: store.isMirrored,
      isDarkMode: store.isDarkMode,
      showOutlines: store.showOutlines,
      currentSide: store.currentSide,
      selectedComponents: store.selectedComponents,
      inspectedComponent: store.inspectedComponent,
      selectedNet: store.selectedNet,
    });
  }, [store, scale, offset, boardCenterX]);


  // Mouse Hover
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      let worldX = ((e.clientX - rect.left) - offset.x) / scale;
      const worldY = ((e.clientY - rect.top) - offset.y) / scale;

      if (store.isMirrored) worldX = boardCenterX * 2 - worldX;

      const foundHover = componentHitboxes.some(box => 
        worldX >= box.minX - 0.5 && worldX <= box.maxX + 0.5 && 
        worldY >= box.minY - 0.5 && worldY <= box.maxY + 0.5
      );

      if (foundHover !== hoverStateRef.current) {
        hoverStateRef.current = foundHover;
        setIsHovering(foundHover);
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, [componentHitboxes, scale, offset, store.isMirrored, boardCenterX]);
  

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