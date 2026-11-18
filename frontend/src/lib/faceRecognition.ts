'use client';

import type * as FaceApiTypes from '@vladmandic/face-api/dist/face-api.esm.js';

export interface EmpleadoConDescriptor {
  id: string;
  nombre: string;
  apellido: string;
  cargo?: string;
  codigo_biometrico?: string;
  foto_url?: string | null;
  descripcion_facial?: number[] | null;
  departamentos?: { nombre: string } | null;
  horarios?: { id?: string; descripcion: string; hora_entrada: string; hora_salida: string } | null;
}

export interface FaceMatchResult {
  box: { x: number; y: number; width: number; height: number };
  landmarks: Array<{ x: number; y: number }>;
  empleadoMatch: EmpleadoConDescriptor | null;
  distancia: number | null;
  confianzaPorcentaje: number;
}

const LOCAL_MODELS_URI = '/models';
const CDN_MODELS_URI = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

let faceApiModule: typeof FaceApiTypes | null = null;
let loadPromise: Promise<boolean> | null = null;
let modelsReady = false;
const descriptorCache = new Map<string, number[]>();
const pendingDescriptorExtraction = new Set<string>();

async function getFaceApi(): Promise<typeof FaceApiTypes | null> {
  if (typeof window === 'undefined') return null;
  if (faceApiModule) return faceApiModule;
  const mod = await import('@vladmandic/face-api/dist/face-api.esm.js');
  faceApiModule = mod as unknown as typeof FaceApiTypes;
  return faceApiModule;
}

export function isFaceModelsLoaded(): boolean {
  return modelsReady;
}

export async function loadFaceModels(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (modelsReady) return true;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const faceapi = await getFaceApi();
      if (!faceapi) return false;

      const cargarDesde = async (uri: string) => {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(uri),
          faceapi.nets.faceLandmark68Net.loadFromUri(uri),
          faceapi.nets.faceRecognitionNet.loadFromUri(uri),
        ]);
      };

      try {
        await cargarDesde(LOCAL_MODELS_URI);
      } catch (localErr) {
        console.warn('[faceRecognition] Fallback a CDN para modelos:', localErr);
        await cargarDesde(CDN_MODELS_URI);
      }

      modelsReady = true;
      return true;
    } catch (err) {
      console.error('[faceRecognition] Error cargando modelos face-api.js:', err);
      loadPromise = null;
      return false;
    }
  })();

  return loadPromise;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export async function extractFaceDescriptor(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | string
): Promise<number[] | null> {
  const ok = await loadFaceModels();
  const faceapi = await getFaceApi();
  if (!ok || !faceapi) return null;

  try {
    const element = typeof input === 'string' ? await loadImageElement(input) : input;
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 });
    const detection = await faceapi
      .detectSingleFace(element, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) return null;
    return Array.from(detection.descriptor);
  } catch (err) {
    console.warn('[faceRecognition] Error extrayendo descriptor facial:', err);
    return null;
  }
}

export async function preloadEmployeeDescriptors(empleados: EmpleadoConDescriptor[]): Promise<void> {
  if (!empleados.length) return;
  const ok = await loadFaceModels();
  if (!ok) return;

  for (const emp of empleados) {
    if (Array.isArray(emp.descripcion_facial) && emp.descripcion_facial.length === 128) {
      descriptorCache.set(emp.id, emp.descripcion_facial);
      continue;
    }
    if (emp.foto_url && !descriptorCache.has(emp.id) && !pendingDescriptorExtraction.has(emp.id)) {
      pendingDescriptorExtraction.add(emp.id);
      extractFaceDescriptor(emp.foto_url)
        .then((desc) => {
          if (desc) descriptorCache.set(emp.id, desc);
        })
        .catch(() => {})
        .finally(() => {
          pendingDescriptorExtraction.delete(emp.id);
        });
    }
  }
}

export async function matchFaceInFrame(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  empleados: EmpleadoConDescriptor[],
  threshold = 0.55
): Promise<FaceMatchResult[]> {
  const ok = await loadFaceModels();
  const faceapi = await getFaceApi();
  if (!ok || !faceapi) return [];

  try {
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 });
    const detections = await faceapi
      .detectAllFaces(input, options)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections.length) return [];

    // Asegurar descriptores cacheados para empleados con foto
    const candidatos = empleados
      .map((emp) => {
        const vector =
          Array.isArray(emp.descripcion_facial) && emp.descripcion_facial.length === 128
            ? emp.descripcion_facial
            : descriptorCache.get(emp.id);
        return vector ? { emp, vector } : null;
      })
      .filter((item): item is { emp: EmpleadoConDescriptor; vector: number[] } => item !== null);

    return detections.map((det) => {
      const box = {
        x: det.detection.box.x,
        y: det.detection.box.y,
        width: det.detection.box.width,
        height: det.detection.box.height,
      };
      const landmarks = det.landmarks.positions.map((p) => ({ x: p.x, y: p.y }));

      let bestEmp: EmpleadoConDescriptor | null = null;
      let minDist = Infinity;

      for (const { emp, vector } of candidatos) {
        const dist = faceapi.euclideanDistance(det.descriptor, vector);
        if (dist < minDist) {
          minDist = dist;
          bestEmp = emp;
        }
      }

      if (bestEmp && minDist <= threshold) {
        const confianza = Number(Math.max(50, Math.min(99.9, (1 - minDist * 0.4) * 100)).toFixed(1));
        return {
          box,
          landmarks,
          empleadoMatch: bestEmp,
          distancia: Number(minDist.toFixed(3)),
          confianzaPorcentaje: confianza,
        };
      }

      return {
        box,
        landmarks,
        empleadoMatch: null,
        distancia: minDist < Infinity ? Number(minDist.toFixed(3)) : null,
        confianzaPorcentaje: Number((det.detection.score * 100).toFixed(1)),
      };
    });
  } catch (err) {
    console.warn('[faceRecognition] Error analizando frame:', err);
    return [];
  }
}
