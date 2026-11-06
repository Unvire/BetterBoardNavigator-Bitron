import { useState, useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";

export function usePanZoom(canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // storing offset and scale values for synchronus operations
  const scaleRef = useRef(scale);
  useEffect(() => { 
    scaleRef.current = scale; 
  }, [scale]);

  const offsetRef = useRef(offset);
  useEffect(() => { 
    offsetRef.current = offset; 
  }, [offset]);



  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, []);


  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  }, [isDragging, lastMousePos]);


  const onMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const zoomSensitivity = 0.1;
      const zoomFactor = e.deltaY < 0 ? 1 + zoomSensitivity : 1 - zoomSensitivity;
      
      const prevScale = scaleRef.current;
      const prevOffset = offsetRef.current;

      const newScale = prevScale * zoomFactor;
      if (newScale < 0.1 || newScale > 200) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
			
      // zooming on cursor position
      const newOffsetX = mouseX - (mouseX - prevOffset.x) * zoomFactor;
      const newOffsetY = mouseY - (mouseY - prevOffset.y) * zoomFactor;

      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });

    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [canvasRef]);

  return {
    scale, offset, handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave: onMouseUp
    }
  };
}