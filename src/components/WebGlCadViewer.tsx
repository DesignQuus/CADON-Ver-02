'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ZoomIn, ZoomOut, RotateCcw, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface WebGlCadViewerProps {
  caseId: string;
  focusBbox?: { min_x: number; min_y: number; max_x: number; max_y: number } | null;
  drawings?: any[];
  bomAreas?: any[];
  showOverlays?: boolean;
  showTexts?: boolean;
  selectedDrawingIdx?: number;
  highlightDrawingIds?: string[];
  onResetFocus?: () => void;
}

export default function WebGlCadViewer({
  caseId,
  focusBbox,
  drawings = [],
  bomAreas = [],
  showOverlays = false,
  showTexts = true,
  selectedDrawingIdx = -1,
  highlightDrawingIds = [],
  onResetFocus
}: WebGlCadViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(true);
  const [totalLines, setTotalLines] = useState(0);
  const [cadTexts, setCadTexts] = useState<Array<{ t: string; x: number; y: number; h: number; r: number; c?: string }>>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cadTextsRef = useRef<Array<{ t: string; x: number; y: number; h: number; r: number; c?: string }>>([]);
  cadTextsRef.current = cadTexts;

  const showTextsRef = useRef(showTexts);
  showTextsRef.current = showTexts;

  const drawingsRef = useRef<any[]>(drawings);
  drawingsRef.current = drawings;

  const highlightDrawingIdsRef = useRef<string[]>(highlightDrawingIds);
  highlightDrawingIdsRef.current = highlightDrawingIds;

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const lineSegmentsRef = useRef<THREE.LineSegments | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const overlaysGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Global bounds from binary file
  const boundsRef = useRef({ minX: 0, minY: 0, maxX: 1000, maxY: 700 });

  // Pan & Zoom interaction state
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Smooth fly-to animation ref
  const targetCamRef = useRef<{ x: number; y: number; zoom: number } | null>(null);

  // 1. Initialize Three.js Scene, Camera, and Renderer
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const aspect = width / height;

    // Scene with dark CAD background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0e1117);
    sceneRef.current = scene;

    // Orthographic Camera (Perfect for 2D CAD engineering)
    const frustumSize = 1000;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      10000
    );
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // WebGL Renderer with High Performance & Antialiasing
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    rendererRef.current = renderer;

    // Animation Loop
    const animate = () => {
      // Smooth camera interpolation (Fly-to)
      if (targetCamRef.current && cameraRef.current) {
        const cam = cameraRef.current;
        const target = targetCamRef.current;
        cam.position.x += (target.x - cam.position.x) * 0.15;
        cam.position.y += (target.y - cam.position.y) * 0.15;
        cam.zoom += (target.zoom - cam.zoom) * 0.15;
        cam.updateProjectionMatrix();

        if (
          Math.abs(cam.position.x - target.x) < 0.5 &&
          Math.abs(cam.position.y - target.y) < 0.5 &&
          Math.abs(cam.zoom - target.zoom) < 0.001
        ) {
          cam.position.x = target.x;
          cam.position.y = target.y;
          cam.zoom = target.zoom;
          cam.updateProjectionMatrix();
          targetCamRef.current = null;
        }
      }

      renderer.render(scene, camera);

      // Render 2D Text Overlay
      const textCanvas = textCanvasRef.current;
      if (textCanvas && container) {
        const tctx = textCanvas.getContext('2d');
        if (tctx) {
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const w = container.clientWidth;
          const h = container.clientHeight;

          if (textCanvas.width !== Math.round(w * dpr) || textCanvas.height !== Math.round(h * dpr)) {
            textCanvas.width = Math.round(w * dpr);
            textCanvas.height = Math.round(h * dpr);
          }

          tctx.clearRect(0, 0, textCanvas.width, textCanvas.height);

          if (showTextsRef.current && cadTextsRef.current.length > 0 && cameraRef.current) {
            tctx.save();
            tctx.scale(dpr, dpr);

            const cam = cameraRef.current;
            const frustumW = (cam.right - cam.left) / cam.zoom;
            const frustumH = (cam.top - cam.bottom) / cam.zoom;
            const scale = w / frustumW;

            const minX = cam.position.x - frustumW / 2;
            const maxX = cam.position.x + frustumW / 2;
            const minY = cam.position.y - frustumH / 2;
            const maxY = cam.position.y + frustumH / 2;

            const texts = cadTextsRef.current;
            for (let i = 0; i < texts.length; i++) {
              const item = texts[i];
              // Viewport Culling
              if (
                item.x < minX - 100 ||
                item.x > maxX + 100 ||
                item.y < minY - 100 ||
                item.y > maxY + 100
              ) {
                continue;
              }

              // Level of Detail (LOD): screen pixel height
              const pxH = item.h * scale;
              if (pxH < 3.5) continue; // Skip microscopic text when zoomed far out

              // Project CAD world coordinates to screen pixel coordinates
              const sx = (item.x - cam.position.x) * scale + w / 2;
              const sy = h / 2 - (item.y - cam.position.y) * scale;

              // Safe Font Clamping: Proportional CAD font size with upper safety bound (max 52px)
              // Prevents anomalous CAD text heights (e.g. 242.3) or deep zoom-in from covering the screen
              const maxScreenFontSize = 52;
              const fontSize = Math.min(Math.round(pxH), maxScreenFontSize);
              if (fontSize < 3) continue;

              tctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Malgun Gothic", "Noto Sans KR", sans-serif`;
              tctx.fillStyle = item.c || '#e2e8f0';

              // Map AutoCAD halign / valign to 2D Canvas textAlign / textBaseline
              tctx.textAlign = (item as any).ha === 1 ? 'center' : (item as any).ha === 2 ? 'right' : 'left';
              tctx.textBaseline = (item as any).va === 1 ? 'bottom' : (item as any).va === 2 ? 'middle' : (item as any).va === 3 ? 'top' : 'alphabetic';

              if (item.r && Math.abs(item.r) > 0.5) {
                tctx.save();
                tctx.translate(sx, sy);
                tctx.rotate((-item.r * Math.PI) / 180);
                tctx.fillText(item.t, 0, 0);
                tctx.restore();
              } else {
                tctx.fillText(item.t, sx, sy);
              }
            }

            tctx.restore();
          }

          // Render Duplicate Location Markers above frames
          if (highlightDrawingIdsRef.current && highlightDrawingIdsRef.current.length > 0 && cameraRef.current) {
            tctx.save();
            tctx.scale(dpr, dpr);
            const ids = highlightDrawingIdsRef.current;
            const cam = cameraRef.current;
            const frustumW = (cam.right - cam.left) / cam.zoom;
            const scale = w / frustumW;

            ids.forEach((id, idx) => {
              const d = drawingsRef.current.find(dw => dw.id === id);
              if (!d) return;
              const fbox = typeof d.frame_bbox_json === 'string' ? JSON.parse(d.frame_bbox_json) : d.frame_bbox;
              if (!fbox || typeof fbox.min_x !== 'number') return;
              const sx = (fbox.min_x - cam.position.x) * scale + w / 2;
              const sy = h / 2 - (fbox.max_y - cam.position.y) * scale;

              const tagText = `📍 ${idx + 1}번 위치: ${d.drawing_no_raw} (${d.drawing_name_raw || '도면'})`;
              tctx.font = 'bold 12px sans-serif';
              const tm = tctx.measureText(tagText);
              const pw = tm.width + 16;
              const ph = 24;

              tctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
              tctx.strokeStyle = '#f59e0b';
              tctx.lineWidth = 1.5;
              tctx.beginPath();
              if (typeof (tctx as any).roundRect === 'function') {
                (tctx as any).roundRect(sx, sy - ph - 8, pw, ph, 5);
              } else {
                tctx.rect(sx, sy - ph - 8, pw, ph);
              }
              tctx.fill();
              tctx.stroke();

              tctx.fillStyle = '#fbbf24';
              tctx.textAlign = 'left';
              tctx.textBaseline = 'middle';
              tctx.fillText(tagText, sx + 8, sy - ph / 2 - 8);
            });
            tctx.restore();
          }
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    animationFrameIdRef.current = requestAnimationFrame(animate);

    // Resize Observer
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      const asp = w / h;
      const cam = cameraRef.current;
      cam.left = (-frustumSize * asp) / 2;
      cam.right = (frustumSize * asp) / 2;
      cam.top = frustumSize / 2;
      cam.bottom = -frustumSize / 2;
      cam.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // 2. Fetch and Load Ultra-Fast Binary WebGL CAD Data
  const loadBinaryData = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/quotation-cases/${caseId}/webgl-binary?v=${Date.now()}`);
      if (!res.ok) {
        throw new Error(`CAD 바이너리 로드 실패 (${res.status})`);
      }

      const arrayBuffer = await res.arrayBuffer();
      if (arrayBuffer.byteLength < 28) {
        throw new Error('유효하지 않은 CAD 바이너리 형식입니다.');
      }

      const dataView = new DataView(arrayBuffer);
      const magic = String.fromCharCode(
        dataView.getUint8(0),
        dataView.getUint8(1),
        dataView.getUint8(2),
        dataView.getUint8(3)
      );

      if (magic !== 'CADW') {
        throw new Error(`알 수 없는 CAD 헤더: ${magic}`);
      }

      const version = dataView.getUint32(4, true);
      let numLines = 0, numTris = 0;
      let minX = 0, minY = 0, maxX = 0, maxY = 0;
      let posByteOffset = 28;

      if (version === 2) {
        numLines = dataView.getUint32(8, true);
        numTris = dataView.getUint32(12, true);
        minX = dataView.getFloat32(16, true);
        minY = dataView.getFloat32(20, true);
        maxX = dataView.getFloat32(24, true);
        maxY = dataView.getFloat32(28, true);
        posByteOffset = 32;
      } else {
        numLines = dataView.getUint32(8, true);
        minX = dataView.getFloat32(12, true);
        minY = dataView.getFloat32(16, true);
        maxX = dataView.getFloat32(20, true);
        maxY = dataView.getFloat32(24, true);
      }

      boundsRef.current = { minX, minY, maxX, maxY };
      setTotalLines(numLines + numTris);

      const posCount = numLines * 6;
      const posArray = new Float32Array(arrayBuffer, posByteOffset, posCount);
      const colByteOffset = posByteOffset + posCount * 4;
      const colArray = new Float32Array(arrayBuffer, colByteOffset, posCount);

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
      const material = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 1 });
      const lineSegments = new THREE.LineSegments(geometry, material);

      let triMesh: THREE.Mesh | null = null;
      if (numTris > 0) {
        const triPosOffset = colByteOffset + posCount * 4;
        const triPosCount = numTris * 9;
        const triPosArray = new Float32Array(arrayBuffer, triPosOffset, triPosCount);
        
        const triColOffset = triPosOffset + triPosCount * 4;
        const triColArray = new Float32Array(arrayBuffer, triColOffset, triPosCount);
        
        const triGeometry = new THREE.BufferGeometry();
        triGeometry.setAttribute('position', new THREE.BufferAttribute(triPosArray, 3));
        triGeometry.setAttribute('color', new THREE.BufferAttribute(triColArray, 3));
        const triMaterial = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
        triMesh = new THREE.Mesh(triGeometry, triMaterial);
      }

      if (sceneRef.current) {
        if (lineSegmentsRef.current) {
          sceneRef.current.remove(lineSegmentsRef.current);
          lineSegmentsRef.current.geometry.dispose();
        }
        if (meshRef.current) {
          sceneRef.current.remove(meshRef.current);
          meshRef.current.geometry.dispose();
          meshRef.current = null;
        }
        
        sceneRef.current.add(lineSegments);
        lineSegmentsRef.current = lineSegments;
        
        if (triMesh) {
          sceneRef.current.add(triMesh);
          meshRef.current = triMesh;
        }
      }

      // Auto-fit to view
      fitToExtents(minX, minY, maxX, maxY, false);
      setLoading(false);
    } catch (err: any) {
      console.error('WebGL CAD Binary Load Error:', err);
      setErrorMsg(err.message || '도면 로드 중 오류가 발생했습니다.');
      setLoading(false);
    }
  }, [caseId]);

  // 2.1 Fetch CAD Texts for 2D Canvas Overlay
  const loadTexts = useCallback(async () => {
    if (!caseId) return;
    try {
      const res = await fetch(`/api/quotation-cases/${caseId}/webgl-texts?v=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.texts)) {
          setCadTexts(data.texts);
        }
      }
    } catch (err) {
      console.warn('CAD Texts load warning:', err);
    }
  }, [caseId]);

  useEffect(() => {
    loadBinaryData();
    loadTexts();
  }, [loadBinaryData, loadTexts]);

  // 3. Render Detected Overlays (Blue Frames, Green Title Blocks, Amber BOM Boxes) in Three.js
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (overlaysGroupRef.current) {
      scene.remove(overlaysGroupRef.current);
      overlaysGroupRef.current = null;
    }

    if (!showOverlays || drawings.length === 0) return;

    const group = new THREE.Group();
    const framePositions: number[] = [];
    const tbPositions: number[] = [];
    const bomPositions: number[] = [];

    const addBox = (minX: number, minY: number, maxX: number, maxY: number, targetArr: number[]) => {
      targetArr.push(
        minX, minY, 1,  maxX, minY, 1,
        maxX, minY, 1,  maxX, maxY, 1,
        maxX, maxY, 1,  minX, maxY, 1,
        minX, maxY, 1,  minX, minY, 1
      );
    };

    if (showOverlays) {
      drawings.forEach((dwg) => {
        const fbox = typeof dwg.frame_bbox_json === 'string' ? JSON.parse(dwg.frame_bbox_json) : dwg.frame_bbox;
        if (fbox) addBox(fbox.min_x, fbox.min_y, fbox.max_x, fbox.max_y, framePositions);

        const tbox = typeof dwg.title_block_bbox_json === 'string' ? JSON.parse(dwg.title_block_bbox_json) : dwg.title_block_bbox;
        if (tbox) addBox(tbox.min_x, tbox.min_y, tbox.max_x, tbox.max_y, tbPositions);
      });

      bomAreas.forEach((ba) => {
        const bbox = typeof ba.bbox_json === 'string' ? JSON.parse(ba.bbox_json) : ba.bbox;
        if (bbox) addBox(bbox.min_x, bbox.min_y, bbox.max_x, bbox.max_y, bomPositions);
      });

      if (framePositions.length > 0) {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(framePositions, 3));
        const mat = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
        group.add(new THREE.LineSegments(geom, mat));
      }

      if (tbPositions.length > 0) {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(tbPositions, 3));
        const mat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 });
        group.add(new THREE.LineSegments(geom, mat));
      }

      if (bomPositions.length > 0) {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(bomPositions, 3));
        const mat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
        group.add(new THREE.LineSegments(geom, mat));
      }
    }

    // Active Selection Highlight: Highlight selected drawing's Frame (cyan) & Title Block (golden-amber)
    if (selectedDrawingIdx >= 0 && drawings[selectedDrawingIdx]) {
      const curDwg = drawings[selectedDrawingIdx];
      const curFbox = typeof curDwg.frame_bbox_json === 'string'
        ? JSON.parse(curDwg.frame_bbox_json)
        : curDwg.frame_bbox;
      const curTbox = typeof curDwg.title_block_bbox_json === 'string' 
        ? JSON.parse(curDwg.title_block_bbox_json) 
        : curDwg.title_block_bbox;

      // 1. Drawing Sheet Frame (Vibrant Cyan border)
      if (curFbox && typeof curFbox.min_x === 'number') {
        const selFramePositions: number[] = [];
        addBox(curFbox.min_x, curFbox.min_y, curFbox.max_x, curFbox.max_y, selFramePositions);
        const selFGeom = new THREE.BufferGeometry();
        selFGeom.setAttribute('position', new THREE.Float32BufferAttribute(selFramePositions, 3));
        const selFMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
        group.add(new THREE.LineSegments(selFGeom, selFMat));
      }

      // 2. Title Block (Golden-amber highlight)
      if (curTbox && typeof curTbox.min_x === 'number') {
        const selTbPositions: number[] = [];
        addBox(curTbox.min_x, curTbox.min_y, curTbox.max_x, curTbox.max_y, selTbPositions);
        const selGeom = new THREE.BufferGeometry();
        selGeom.setAttribute('position', new THREE.Float32BufferAttribute(selTbPositions, 3));
        const selMat = new THREE.LineBasicMaterial({ color: 0xfbbf24, linewidth: 3 });
        group.add(new THREE.LineSegments(selGeom, selMat));
      }
    }

    // 3. Highlight Multiple Duplicate Drawings Simultaneously (Vibrant Gold/Amber thick border)
    if (highlightDrawingIds && highlightDrawingIds.length > 0) {
      const dupFramePositions: number[] = [];
      highlightDrawingIds.forEach(id => {
        const d = drawings.find(dw => dw.id === id);
        if (d) {
          const fbox = typeof d.frame_bbox_json === 'string' ? JSON.parse(d.frame_bbox_json) : d.frame_bbox;
          if (fbox && typeof fbox.min_x === 'number') {
            addBox(fbox.min_x, fbox.min_y, fbox.max_x, fbox.max_y, dupFramePositions);
          }
        }
      });

      if (dupFramePositions.length > 0) {
        const dupGeom = new THREE.BufferGeometry();
        dupGeom.setAttribute('position', new THREE.Float32BufferAttribute(dupFramePositions, 3));
        const dupMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 3 });
        group.add(new THREE.LineSegments(dupGeom, dupMat));
      }
    }

    scene.add(group);
    overlaysGroupRef.current = group;
  }, [drawings, bomAreas, showOverlays, selectedDrawingIdx, highlightDrawingIds]);

  // 3. Zoom Camera to Extents or Specific Bounding Box
  const fitToExtents = (minX: number, minY: number, maxX: number, maxY: number, animate = true) => {
    const camera = cameraRef.current;
    const container = containerRef.current;
    if (!camera || !container) return;

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    const margin = 1.15; // 15% margin
    const dx = Math.max(maxX - minX, 100) * margin;
    const dy = Math.max(maxY - minY, 100) * margin;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const frustumSize = 1000;
    const aspect = w / h;
    const camWidth = frustumSize * aspect;
    const camHeight = frustumSize;

    const zoomX = camWidth / dx;
    const zoomY = camHeight / dy;
    const targetZoom = Math.max(Math.min(zoomX, zoomY), 0.0001);

    if (animate) {
      targetCamRef.current = { x: centerX, y: centerY, zoom: targetZoom };
    } else {
      camera.position.x = centerX;
      camera.position.y = centerY;
      camera.zoom = targetZoom;
      camera.updateProjectionMatrix();
    }
  };

  // 4. Focus on Specific Sheet when clicked in Excel Title Block Sheet
  useEffect(() => {
    if (focusBbox && cameraRef.current) {
      const timer = setTimeout(() => {
        fitToExtents(focusBbox.min_x, focusBbox.min_y, focusBbox.max_x, focusBbox.max_y, true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [focusBbox]);

  // 5. Mouse Interaction: 60 FPS Zoom on Wheel (Native non-passive listener to block page scroll 100%)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const onNativeWheel = (e: WheelEvent) => {
      // 100% Guaranteed: Completely stop outer window/page from scrolling
      e.preventDefault();
      e.stopPropagation();

      const camera = cameraRef.current;
      if (!camera) return;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Convert mouse screen coordinates to world coordinates
      const aspect = container.clientWidth / container.clientHeight;
      const frustumSize = 1000;
      const worldW = (frustumSize * aspect) / camera.zoom;
      const worldH = frustumSize / camera.zoom;

      const worldMouseX = camera.position.x + (mouseX / container.clientWidth - 0.5) * worldW;
      const worldMouseY = camera.position.y - (mouseY / container.clientHeight - 0.5) * worldH;

      const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
      const newZoom = Math.min(Math.max(camera.zoom * zoomFactor, 0.00001), 5000);

      // Zoom centered towards mouse cursor
      const newWorldW = (frustumSize * aspect) / newZoom;
      const newWorldH = frustumSize / newZoom;

      camera.position.x = worldMouseX - (mouseX / container.clientWidth - 0.5) * newWorldW;
      camera.position.y = worldMouseY + (mouseY / container.clientHeight - 0.5) * newWorldH;
      camera.zoom = newZoom;
      camera.updateProjectionMatrix();
      targetCamRef.current = null; // Cancel any ongoing fly-to
    };

    // Attach with passive: false so preventDefault() cancels window scroll
    canvas.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onNativeWheel);
    };
  }, []);

  // 6. Mouse Interaction: 60 FPS Pan on Drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    targetCamRef.current = null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const camera = cameraRef.current;
    const container = containerRef.current;
    if (!camera || !container) return;

    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = 1000;
    const worldPerPixelX = (frustumSize * aspect) / camera.zoom / container.clientWidth;
    const worldPerPixelY = frustumSize / camera.zoom / container.clientHeight;

    camera.position.x -= dx * worldPerPixelX;
    camera.position.y += dy * worldPerPixelY;
    camera.updateProjectionMatrix();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Zoom Button Handlers
  const handleZoomIn = () => {
    if (!cameraRef.current) return;
    cameraRef.current.zoom *= 1.35;
    cameraRef.current.updateProjectionMatrix();
  };

  const handleZoomOut = () => {
    if (!cameraRef.current) return;
    cameraRef.current.zoom *= 0.7;
    cameraRef.current.updateProjectionMatrix();
  };

  const handleReset = () => {
    const { minX, minY, maxX, maxY } = boundsRef.current;
    fitToExtents(minX, minY, maxX, maxY, true);
    if (onResetFocus) onResetFocus();
  };

  return (
    <div
      ref={containerRef}
      style={{ overscrollBehavior: 'contain' }}
      className="relative w-full h-[680px] bg-[#0e1117] rounded-2xl overflow-hidden border border-slate-800 select-none cursor-grab active:cursor-grabbing shadow-inner overscroll-contain"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full block touch-none"
      />

      {/* 2D Text Overlay Layer (Synchronized with 3D Camera at 60 FPS) */}
      <canvas
        ref={textCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center space-y-3 z-30">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
          <div className="text-center">
            <p className="text-sm font-bold text-white">WebGL GPU CAD 엔진 가속 중...</p>
            <p className="text-xs text-slate-400 mt-1">30만+ 개 정밀 선분을 GPU VRAM에 업로드하고 있습니다.</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {errorMsg && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center space-y-2 z-30 p-6 text-center">
          <p className="text-rose-400 font-bold text-sm">도면 렌더링 오류</p>
          <p className="text-xs text-slate-300">{errorMsg}</p>
          <button
            onClick={loadBinaryData}
            className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Top Left: HUD Status Overlay */}
      {!loading && !errorMsg && (
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 text-[11px] font-mono flex items-center space-x-2 z-20 shadow-md pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-bold text-blue-400">WebGL GPU 60 FPS</span>
          <span className="text-slate-600">|</span>
          <span>{totalLines.toLocaleString()}개 선분</span>
          {cadTexts.length > 0 && (
            <>
              <span className="text-slate-600">|</span>
              <span className={showTexts ? "text-emerald-400 font-semibold" : "text-slate-500"}>
                TXT {cadTexts.length.toLocaleString()}개 {showTexts ? 'ON' : 'OFF'}
              </span>
            </>
          )}
        </div>
      )}

      {/* Bottom Right: Floating Zoom/Fit Controls */}
      <div className="absolute bottom-4 right-4 flex items-center space-x-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 z-20 shadow-xl">
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="확대 (마우스 휠 위로)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="축소 (마우스 휠 아래로)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-700 mx-0.5"></div>
        <button
          onClick={handleReset}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="전체 도면 맞춤 (1:1)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
