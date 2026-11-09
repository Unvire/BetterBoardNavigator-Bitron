import { useMemo } from 'react';
import type { BoardData, ShapeData } from '../types/board';

export interface Hitbox {
  name: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function useBoardGeometry(boardData: BoardData | null, currentSide: 'T' | 'B') {
  // 1. Calculating center of board
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

  // 2. Calculating hitbox hover
  const componentHitboxes = useMemo(() => {
    if (!boardData) return [];
    const boxes: Hitbox[] = [];
    
    Object.entries(boardData.components).forEach(([name, comp]) => {
      if (comp.side !== currentSide && comp.mountingType !== 'TH') return;

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      let hasGeometry = false;
      const hasSinglePin = comp.pins ? Object.keys(comp.pins).length === 1 : false;

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

  return { boardCenterX, componentHitboxes };
}