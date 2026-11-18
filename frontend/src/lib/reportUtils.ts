export type ReportType = "payroll" | "attendance" | "biometric";
export type Period = "today" | "month" | "previous" | "custom";
export type ExportFormat = "csv" | "pdf" | "xlsx";

export interface Filters {
  period: Period;
  department: string;
  search: string;
  startDate: string;
  endDate: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  entry: string | null;
  exit: string | null;
  lateMinutes: number;
  workedHours: number;
  expected: boolean;
  camera: string | null;
  confidence: number | null;
  verification: "Validado" | "Revisión" | "Sin validación";
}

export interface ReportRow {
  id: string;
  name: string;
  department: string;
  values: string[];
  status: string;
}

export interface ReportDefinition {
  id: ReportType;
  title: string;
  description: string;
  caption: string;
  icon: string;
  summary: string;
  columns: string[];
}

export const reportDefinitions: ReportDefinition[] = [
  {
    id: "payroll",
    title: "Consolidado de Nómina",
    description: "Horas netas, tardanzas y balance de ausencias para cálculo salarial.",
    caption: "Formato contable",
    icon: "3503:5581",
    summary: "Resumen de nómina generado para el período seleccionado",
    columns: ["Colaborador", "Días asistidos", "Tardanzas", "Horas totales", "Estado"],
  },
  {
    id: "attendance",
    title: "Control de Asistencia",
    description: "Marcaciones detalladas de entrada/salida y puntualidad diaria.",
    caption: "Registro cronológico",
    icon: "3503:5597",
    summary: "Marcaciones de entrada y salida del período seleccionado",
    columns: ["Colaborador", "Fecha", "Entrada / Salida", "Tardanzas", "Estado"],
  },
  {
    id: "biometric",
    title: "Bitácora Biométrica",
    description: "Registros de validación facial por cámaras y nivel de confianza.",
    caption: "Auditoría biométrica",
    icon: "3503:5613",
    summary: "Validaciones biométricas del período seleccionado",
    columns: ["Colaborador", "Fecha", "Cámara", "Confianza", "Estado"],
  },
];

export const localDate = (date: Date): string =>
  [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");

export const defaultFilters = (today: Date): Filters => ({
  period: "month",
  department: "",
  search: "",
  startDate: localDate(new Date(today.getFullYear(), today.getMonth(), 1)),
  endDate: localDate(today),
});

export function getDateRange(filters: Filters, today: Date): [string, string] {
  const [y, m] = [today.getFullYear(), today.getMonth()];
  if (filters.period === "today") return [localDate(today), localDate(today)];
  if (filters.period === "previous") return [localDate(new Date(y, m - 1, 1)), localDate(new Date(y, m, 0))];
  if (filters.period === "custom") return [filters.startDate, filters.endDate];
  return [localDate(new Date(y, m, 1)), localDate(new Date(y, m + 1, 0))];
}

export const isValidRange = (start: string, end: string): boolean => Boolean(start && end && start <= end);

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export const initials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

export function mapAttendanceToReportRecords(
  data: { records?: any[]; employees?: any[] },
  todayIso: string
): AttendanceRecord[] {
  const hasRecords = Boolean(data.records && data.records.length > 0);
  const source = hasRecords ? data.records! : data.employees || [];
  if (!source.length) return [];

  return source.map((item) => {
    const isPresent = item.status === "presente" || item.status === "tardanza";
    const entry = item.checkIn && item.checkIn !== "En curso" ? item.checkIn : null;
    const exit = item.checkOut && item.checkOut !== "En curso" ? item.checkOut : null;
    let workedHours = 0;

    if (hasRecords) {
      const match = item.hours?.match(/(\d+)h/);
      if (match) workedHours = parseInt(match[1], 10);
      else if (entry && exit) workedHours = 8;
      else if (entry) workedHours = 4;
    } else if (item.checkIn) {
      workedHours = 8;
    }

    return {
      id: hasRecords ? item.id : `emp-${item.id}`,
      employeeId: hasRecords ? item.employeeId : item.id,
      employeeName: item.name,
      department: item.department || "General",
      date: todayIso,
      entry,
      exit,
      lateMinutes: item.status === "tardanza" ? 15 : 0,
      workedHours,
      expected: true,
      camera: "Cámara 01",
      confidence: hasRecords ? (isPresent ? 98.4 : null) : item.checkIn ? 98.2 : null,
      verification: isPresent ? (item.status === "tardanza" ? "Revisión" : "Validado") : "Sin validación",
    };
  });
}

export function filterRecords(records: AttendanceRecord[], filters: Filters, today: Date): AttendanceRecord[] {
  const [start, end] = getDateRange(filters, today);
  if (!isValidRange(start, end)) return [];
  const q = normalize(filters.search.trim());
  return records.filter(
    (r) =>
      r.date >= start &&
      r.date <= end &&
      (!filters.department || r.department === filters.department) &&
      (!q || normalize(`${r.employeeName} ${r.employeeId} ${r.department}`).includes(q))
  );
}

export function buildReportRows(records: AttendanceRecord[], type: ReportType): ReportRow[] {
  if (type === "payroll") {
    const groups = new Map<string, AttendanceRecord[]>();
    for (const r of records) groups.set(r.employeeId, [...(groups.get(r.employeeId) ?? []), r]);

    return Array.from(groups, ([id, entries]) => {
      const expected = new Set(entries.filter((r) => r.expected).map((r) => r.date)).size;
      const attended = new Set(entries.filter((r) => r.entry).map((r) => r.date)).size;
      const late = entries.reduce((sum, r) => sum + r.lateMinutes, 0);
      const hours = entries.reduce((sum, r) => sum + r.workedHours, 0);
      const incomplete = entries.some((r) => r.entry && !r.exit);
      return {
        id,
        name: entries[0].employeeName,
        department: entries[0].department,
        values: [`${attended} / ${expected}`, `${late} min`, `${hours.toFixed(1)} h`],
        status: incomplete || attended < expected ? "Revisión" : "Listo",
      };
    }).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  return [...records]
    .sort((a, b) => b.date.localeCompare(a.date) || a.employeeName.localeCompare(b.employeeName, "es"))
    .map((r) => ({
      id: r.id,
      name: r.employeeName,
      department: r.department,
      values:
        type === "attendance"
          ? [r.date.split("-").reverse().join("/"), `${r.entry ?? "—"} / ${r.exit ?? "—"}`, `${r.lateMinutes} min`]
          : [r.date.split("-").reverse().join("/"), r.camera ?? "—", r.confidence === null ? "—" : `${r.confidence.toFixed(1)} %`],
      status: type === "biometric" ? r.verification : !r.entry ? "Ausente" : !r.exit ? "Revisión" : "Completo",
    }));
}

export const reportMatrix = (definition: ReportDefinition, rows: ReportRow[]): string[][] => [
  definition.columns,
  ...rows.map((r) => [`${r.name} (${r.department})`, ...r.values, r.status]),
];

function download(content: BlobPart, mime: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const csvCell = (value: string): string => {
  const safe = /^[\s]*[=+@\-\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
};

export const exportCsv = (matrix: string[][], filename: string) =>
  download("\uFEFF" + matrix.map((r) => r.map(csvCell).join(",")).join("\r\n"), "text/csv;charset=utf-8", `${filename}.csv`);

const xml = (v: string) =>
  v
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export function zip(files: Record<string, string>): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;

  const crc32 = (bytes: Uint8Array) => {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };

  for (const [path, content] of Object.entries(files)) {
    const name = encoder.encode(path);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = new Uint8Array(30);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(12, 33, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true);
    chunks.push(local, name, data);

    const central = new Uint8Array(46);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(14, 33, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    directory.push(central, name);
    offset += local.length + name.length + data.length;
  }

  const directorySize = directory.reduce((sum, p) => sum + p.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, Object.keys(files).length, true);
  ev.setUint16(10, Object.keys(files).length, true);
  ev.setUint32(12, directorySize, true);
  ev.setUint32(16, offset, true);

  const result = new Uint8Array(offset + directorySize + end.length);
  let cursor = 0;
  for (const part of [...chunks, ...directory, end]) {
    result.set(part, cursor);
    cursor += part.length;
  }
  return result;
}

export function buildXlsx(matrix: string[][]): Uint8Array<ArrayBuffer> {
  const colName = (i: number): string =>
    i < 26 ? String.fromCharCode(65 + i) : colName(Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26));
  const sheet = matrix
    .map((row, i) => `<row r="${i + 1}">${row.map((v, j) => `<c r="${colName(j)}${i + 1}" t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`).join("")}</row>`)
    .join("");

  return zip({
    "[Content_Types].xml":
      '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    "_rels/.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml":
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Reporte" sheetId="1" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml": `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="42" customWidth="1"/><col min="2" max="5" width="23" customWidth="1"/></cols><sheetData>${sheet}</sheetData></worksheet>`,
  });
}

export const exportXlsx = (matrix: string[][], filename: string) =>
  download(buildXlsx(matrix), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", `${filename}.xlsx`);
