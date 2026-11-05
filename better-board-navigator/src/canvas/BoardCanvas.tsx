import { useRef, useEffect } from "react";
import { useBoardStore } from "../store/boardStore";

function BoardCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const boardData = useBoardStore((state) => state.boardData);
  const currentSide = useBoardStore((state) => state.currentSide);
  const isDarkMode = useBoardStore((state) => state.isDarkMode);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !boardData) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    
    ctx.fillStyle = isDarkMode ? '#0f172a' : '#f1f5f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = isDarkMode ? '#38bdf8' : '#2563eb';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Canvas podłączony poprawnie! 🚀`, 40, 60);
    
    ctx.fillStyle = isDarkMode ? '#cbd5e1' : '#475569';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Aktualna warstwa widoku (Side): ${currentSide}`, 40, 100);
    ctx.fillText(`Ilość sieci (Nets): ${Object.keys(boardData.nets).length}`, 40, 130);
  }, [boardData, currentSide, isDarkMode]);

  return (
    <div className="w-full h-full relative block">
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full cursor-crosshair touch-none"
      />
    </div>
  );
}

export default BoardCanvas;