"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { fetchAsistencias } from "@/services/asistenciaService";
import "./reports.css";
import AppLayout from "@/components/layout/AppLayout";

// src/types/reports.ts
type ReportType = "payroll" | "attendance" | "biometric";
type Period = "today" | "month" | "previous" | "custom";
interface Filters {
  period: Period;
  department: string;
  search: string;
  startDate: string;
  endDate: string;
}
/** Un registro diario. Las fechas usan YYYY-MM-DD y las horas HH:mm. */
interface AttendanceRecord {
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
interface ReportRow {
  id: string;
  name: string;
  department: string;
  values: string[];
  status: string;
}
interface ReportDefinition {
  id: ReportType;
  title: string;
  description: string;
  caption: string;
  icon: string;
  summary: string;
  columns: string[];
}

// src/data/reports.ts
/** Fuente local del frontend. Vacía deliberadamente: no copia datos del Figma.
 * En una futura integración, sustituir esta fuente sin modificar los componentes.
 */
const attendanceRecords: AttendanceRecord[] = [];

const reportDefinitions: ReportDefinition[] = [
  {
    id: "payroll",
    title: "Consolidado de Nómina",
    description:
      "Horas netas, tardanzas y balance de ausencias para cálculo salarial.",
    caption: "Formato contable",
    icon: "3503:5581",
    summary: "Resumen de nómina generado para el período seleccionado",
    columns: [
      "Colaborador",
      "Días asistidos",
      "Tardanzas",
      "Horas totales",
      "Estado",
    ],
  },
  {
    id: "attendance",
    title: "Control de Asistencia",
    description:
      "Marcaciones detalladas de entrada/salida y puntualidad diaria.",
    caption: "Registro cronológico",
    icon: "3503:5597",
    summary: "Marcaciones de entrada y salida del período seleccionado",
    columns: [
      "Colaborador",
      "Fecha",
      "Entrada / Salida",
      "Tardanzas",
      "Estado",
    ],
  },
  {
    id: "biometric",
    title: "Bitácora Biométrica / IA",
    description:
      "Registros de validación facial por cámaras y nivel de confianza.",
    caption: "Auditoría biométrica",
    icon: "3503:5613",
    summary: "Validaciones biométricas del período seleccionado",
    columns: ["Colaborador", "Fecha", "Cámara", "Confianza", "Estado"],
  },
];

// src/utils/reports.ts
function localDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
function getDateRange(filters: Filters, today: Date): [string, string] {
  const year = today.getFullYear();
  const month = today.getMonth();
  switch (filters.period) {
    case "today":
      return [localDate(today), localDate(today)];
    case "previous":
      return [
        localDate(new Date(year, month - 1, 1)),
        localDate(new Date(year, month, 0)),
      ];
    case "custom":
      return [filters.startDate, filters.endDate];
    default:
      return [
        localDate(new Date(year, month, 1)),
        localDate(new Date(year, month + 1, 0)),
      ];
  }
}
function isValidRange(start: string, end: string): boolean {
  return Boolean(start && end && start <= end);
}
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
function filterRecords(
  records: AttendanceRecord[],
  filters: Filters,
  today: Date,
): AttendanceRecord[] {
  const [start, end] = getDateRange(filters, today);
  if (!isValidRange(start, end)) return [];
  return records.filter(
    (record) =>
      record.date >= start &&
      record.date <= end &&
      (!filters.department || record.department === filters.department) &&
      normalize(
        `${record.employeeName} ${record.employeeId} ${record.department}`,
      ).includes(normalize(filters.search.trim())),
  );
}
function buildReportRows(
  records: AttendanceRecord[],
  type: ReportType,
): ReportRow[] {
  if (type === "payroll") {
    const groups = new Map<string, AttendanceRecord[]>();
    for (const record of records)
      groups.set(record.employeeId, [
        ...(groups.get(record.employeeId) ?? []),
        record,
      ]);
    return Array.from(groups, ([id, entries]) => {
      const first = entries[0];
      const expected = new Set(
        entries.filter((r) => r.expected).map((r) => r.date),
      ).size;
      const attended = new Set(
        entries.filter((r) => r.entry).map((r) => r.date),
      ).size;
      const late = entries.reduce((sum, r) => sum + r.lateMinutes, 0);
      const hours = entries.reduce((sum, r) => sum + r.workedHours, 0);
      const incomplete = entries.some((r) => r.entry && !r.exit);
      return {
        id,
        name: first.employeeName,
        department: first.department,
        values: [
          `${attended} / ${expected}`,
          `${late} min`,
          `${hours.toFixed(1)} h`,
        ],
        status: incomplete || attended < expected ? "Revisión" : "Listo",
      };
    }).sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
  return [...records]
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) ||
        a.employeeName.localeCompare(b.employeeName, "es"),
    )
    .map((record) => ({
      id: record.id,
      name: record.employeeName,
      department: record.department,
      values:
        type === "attendance"
          ? [
              record.date.split("-").reverse().join("/"),
              `${record.entry ?? "—"} / ${record.exit ?? "—"}`,
              `${record.lateMinutes} min`,
            ]
          : [
              record.date.split("-").reverse().join("/"),
              record.camera ?? "—",
              record.confidence === null
                ? "—"
                : `${record.confidence.toFixed(1)} %`,
            ],
      status:
        type === "biometric"
          ? record.verification
          : !record.entry
            ? "Ausente"
            : !record.exit
              ? "Revisión"
              : "Completo",
    }));
}
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

// src/utils/exportReports.ts
function download(content: BlobPart, mime: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function reportMatrix(
  definition: ReportDefinition,
  rows: ReportRow[],
): string[][] {
  return [
    definition.columns,
    ...rows.map((row) => [
      `${row.name} (${row.department})`,
      ...row.values,
      row.status,
    ]),
  ];
}
/** Evita que nombres u otros textos se interpreten como fórmulas en Excel. */
function csvCell(value: string): string {
  const safe = /^[\s]*[=+@\-\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
function exportCsv(matrix: string[][], filename: string) {
  download(
    "\uFEFF" + matrix.map((row) => row.map(csvCell).join(",")).join("\r\n"),
    "text/csv;charset=utf-8",
    `${filename}.csv`,
  );
}
const xml = (value: string) =>
  value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/** ZIP sin compresión: suficiente para un libro OOXML pequeño, sin dependencias. */
function zip(files: Record<string, string>): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;
  const header = (length: number) => new Uint8Array(length);
  const crc32 = (bytes: Uint8Array) => {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++)
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
  for (const [path, content] of Object.entries(files)) {
    const name = encoder.encode(path);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = header(30);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(12, 33, true); // 1980-01-01, fecha mínima válida en ZIP.
    view.setUint32(14, crc, true);
    view.setUint32(18, data.length, true);
    view.setUint32(22, data.length, true);
    view.setUint16(26, name.length, true);
    chunks.push(local, name, data);
    const central = header(46);
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
  const directorySize = directory.reduce((sum, part) => sum + part.length, 0);
  const end = header(22);
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
function buildXlsx(matrix: string[][]): Uint8Array<ArrayBuffer> {
  const columnName = (index: number): string =>
    index < 26
      ? String.fromCharCode(65 + index)
      : columnName(Math.floor(index / 26) - 1) +
        String.fromCharCode(65 + (index % 26));
  const sheet = matrix
    .map(
      (row, i) =>
        `<row r="${i + 1}">${row.map((value, j) => `<c r="${columnName(j)}${i + 1}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join("")}</row>`,
    )
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
function exportXlsx(matrix: string[][], filename: string) {
  download(
    buildXlsx(matrix),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    `${filename}.xlsx`,
  );
}

// src/components/dashboard/DesignIcon.tsx
const sizes: Record<string, [number, number]> = {
  "3521:8626": [12, 14],
  "3521:8635": [14, 14],
  "3521:8637": [15, 15],
  "3503:5561": [11, 11],
  "3503:5568": [18, 18],
  "3503:5581": [21, 15],
  "3503:5583": [19, 19],
  "3503:5597": [19, 19],
  "3503:5599": [19, 19],
  "3503:5613": [19, 19],
  "3503:5629": [14, 14],
  "3503:5637": [12, 12],
  "3503:5642": [14, 14],
  "3503:5647": [12, 12],
  "3503:5770": [5, 8],
  "3503:5777": [5, 8],
  "3503:5785": [24, 24],
  "3534:810": [15, 15],
  "3534:774": [19, 14],
  "3534:828": [17, 14],
  "3534:792": [15, 15],
  "3534:756": [15, 15],
  "3594:194": [19, 19],
  "3503:5824": [20, 20],
  "3503:5831": [20, 20],
  "3503:5845": [20, 20],
};
/** SVG exportado del nodo original. Mantiene su proporción natural. */
function DesignIcon({ id }: { id: string }) {
  const [width, height] = sizes[id] ?? [16, 16];
  return (
    <svg width={width} height={height} aria-hidden="true" className="shrink-0">
      <use href={`/imgs/reportes-icons.svg#icon-${id.replace(":", "-")}`} />
    </svg>
  );
}

// src/components/reports/ReportFilters.tsx
const periods: { id: Period; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "month", label: "Este Mes" },
  { id: "previous", label: "Mes Anterior" },
  { id: "custom", label: "Personalizado" },
];
interface ReportFiltersProps {
  filters: Filters;
  departments: string[];
  invalidRange: boolean;
  onChange: (patch: Partial<Filters>) => void;
}
function ReportFilters({
  filters,
  departments,
  invalidRange,
  onChange,
}: ReportFiltersProps) {
  return (
    <div className="reports-filters">
      <div className="reports-filter-row">
        <div
          className="reports-periods"
          role="group"
          aria-label="Período del reporte"
        >
          {periods.map((period) => (
            <button
              key={period.id}
              aria-pressed={filters.period === period.id}
              className={filters.period === period.id ? "selected" : ""}
              onClick={() => onChange({ period: period.id })}
            >
              {period.id === "custom" && <DesignIcon id="3503:5561" />}
              {period.label}
            </button>
          ))}
        </div>
        <select
          aria-label="Departamento"
          value={filters.department}
          onChange={(event) => onChange({ department: event.target.value })}
        >
          <option value="">Todos los departamentos</option>
          {departments.map((department) => (
            <option key={department}>{department}</option>
          ))}
        </select>
      </div>
      {filters.period === "custom" && (
        <div className="reports-custom-dates">
          <label>
            Desde
            <input
              type="date"
              value={filters.startDate}
              max={filters.endDate || undefined}
              onChange={(event) => onChange({ startDate: event.target.value })}
              aria-invalid={invalidRange}
            />
          </label>
          <label>
            Hasta
            <input
              type="date"
              value={filters.endDate}
              min={filters.startDate || undefined}
              onChange={(event) => onChange({ endDate: event.target.value })}
              aria-invalid={invalidRange}
            />
          </label>
          {invalidRange && (
            <p role="alert">Selecciona un rango de fechas válido.</p>
          )}
        </div>
      )}
    </div>
  );
}

// src/components/reports/ReportTypeSelector.tsx
function ReportTypeSelector({
  value,
  onChange,
}: {
  value: ReportType;
  onChange: (value: ReportType) => void;
}) {
  return (
    <section aria-labelledby="report-type-title">
      <h2 id="report-type-title" className="reports-section-label">
        SELECCIONAR TIPO DE REPORTE
      </h2>
      <div className="reports-cards" role="group" aria-label="Tipo de reporte">
        {reportDefinitions.map((report) => (
          <button
            key={report.id}
            className={`reports-card ${value === report.id ? "selected" : ""}`}
            aria-pressed={value === report.id}
            onClick={() => onChange(report.id)}
          >
            <span className="reports-card-top">
              <span className="reports-icon-box">
                <DesignIcon id={report.icon} />
              </span>
              <DesignIcon
                id={value === report.id ? "3503:5583" : "3503:5599"}
              />
            </span>
            <span>
              <strong>{report.title}</strong>
              <span className="reports-card-description">
                {report.description}
              </span>
            </span>
            <span className="reports-card-footer">
              <span>{report.caption}</span>
              <span>{value === report.id ? "Seleccionado" : "Elegir"}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// src/components/reports/ExportToolbar.tsx
type ExportFormat = "csv" | "pdf" | "xlsx";
interface ExportToolbarProps {
  count: number;
  disabled: boolean;
  onExport: (format: ExportFormat) => void;
}
function ExportToolbar({ count, disabled, onExport }: ExportToolbarProps) {
  return (
    <section
      className="reports-export reports-panel"
      aria-label="Exportar reporte"
    >
      <div className="reports-export-label">
        <span className="reports-icon-box">
          <DesignIcon id="3503:5629" />
        </span>
        <span>
          <strong>
            {disabled ? "Sin datos para exportar" : "Listo para exportar"}
          </strong>
          <small>
            {count}{" "}
            {count === 1 ? "colaborador incluido" : "colaboradores incluidos"}{" "}
            en el período actual
          </small>
        </span>
      </div>
      <div className="reports-export-buttons">
        <button disabled={disabled} onClick={() => onExport("csv")}>
          <DesignIcon id="3503:5637" />
          CSV
        </button>
        <button
          disabled={disabled}
          onClick={() => onExport("pdf")}
          title="Abre el diálogo de impresión para guardar como PDF"
        >
          <DesignIcon id="3503:5642" />
          Exportar PDF
        </button>
        <button
          disabled={disabled}
          onClick={() => onExport("xlsx")}
          className="primary"
        >
          <DesignIcon id="3503:5647" />
          Descargar Reporte (Excel .xlsx)
        </button>
      </div>
    </section>
  );
}

// src/components/reports/ReportPreview.tsx
interface ReportPreviewProps {
  definition: ReportDefinition;
  rows: ReportRow[];
  total: number;
  page: number;
  pages: number;
  onPage: (page: number) => void;
  onReset: () => void;
  filtered: boolean;
}
function ReportPreview({
  definition,
  rows,
  total,
  page,
  pages,
  onPage,
  onReset,
  filtered,
}: ReportPreviewProps) {
  return (
    <section
      className="reports-preview reports-panel"
      aria-labelledby="preview-title"
    >
      <div className="reports-preview-header">
        <div>
          <h2 id="preview-title">Vista previa de datos</h2>
          <p>{definition.summary}</p>
        </div>
        <small aria-live="polite">
          Mostrando {rows.length} de {total}{" "}
          {definition.id === "payroll" ? "colaboradores" : "registros"}
        </small>
      </div>
      <div className="reports-table-scroll">
        <table>
          <thead>
            <tr>
              {definition.columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="reports-person">
                    <span className="reports-avatar">{initials(row.name)}</span>
                    <span>
                      <strong>{row.name}</strong>
                      <small>{row.department}</small>
                    </span>
                  </span>
                </td>
                {row.values.map((value, index) => (
                  <td
                    key={index}
                    className={
                      index === 2 && definition.id === "payroll"
                        ? "reports-hours"
                        : ""
                    }
                  >
                    {value}
                  </td>
                ))}
                <td>
                  <span
                    className={`reports-status ${["Listo", "Completo", "Validado"].includes(row.status) ? "success" : row.status === "Ausente" ? "danger" : "warning"}`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <div className="reports-empty">
          <span className="reports-icon-box">
            <DesignIcon id="3503:5597" />
          </span>
          <h3>
            {filtered
              ? "No se encontraron resultados"
              : "Aún no hay registros de asistencia"}
          </h3>
          <p>
            {filtered
              ? "Prueba otro período, departamento o término de búsqueda."
              : "Los reportes estarán disponibles cuando se incorporen registros de asistencia."}
          </p>
          {filtered && <button onClick={onReset}>Restablecer filtros</button>}
        </div>
      )}
      <footer className="reports-pagination">
        <small>
          Página {page} de {pages}
        </small>
        <div>
          <button disabled={page <= 1} onClick={() => onPage(page - 1)}>
            <DesignIcon id="3503:5770" />
            Anterior
          </button>
          <button disabled={page >= pages} onClick={() => onPage(page + 1)}>
            Siguiente
            <DesignIcon id="3503:5777" />
          </button>
        </div>
      </footer>
    </section>
  );
}

// src/components/reports/ReportsPage.tsx
const PAGE_SIZE = 5;
function defaultFilters(today: Date): Filters {
  return {
    period: "month",
    department: "",
    search: "",
    startDate: localDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    endDate: localDate(today),
  };
}
function ReportsPage({
  todayIso,
  dateLabel,
}: {
  todayIso: string;
  dateLabel: string;
}) {
  // La misma fecha inicial en servidor y cliente evita diferencias de hidratación.
  const [today] = useState(() => new Date(`${todayIso}T12:00:00`));
  const [filters, setFilters] = useState<Filters>(() => defaultFilters(today));
  const [type, setType] = useState<ReportType>("payroll");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [recordsData, setRecordsData] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await fetchAsistencias();
        if (!isMounted) return;
        if (data.records && data.records.length > 0) {
          const mapped: AttendanceRecord[] = data.records.map((r) => {
            const isPresent = r.status === "presente" || r.status === "tardanza";
            let workedHours = 0;
            if (r.hours) {
              const match = r.hours.match(/(\d+)h/);
              if (match) workedHours = parseInt(match[1], 10);
            } else if (r.checkIn && r.checkOut && r.checkOut !== "En curso") {
              workedHours = 8;
            } else if (r.checkIn) {
              workedHours = 4;
            }

            return {
              id: r.id,
              employeeId: r.employeeId,
              employeeName: r.name,
              department: r.department || "General",
              date: localDate(today),
              entry: r.checkIn && r.checkIn !== "En curso" ? r.checkIn : null,
              exit: r.checkOut && r.checkOut !== "En curso" ? r.checkOut : null,
              lateMinutes: r.status === "tardanza" ? 15 : 0,
              workedHours,
              expected: true,
              camera: "Cámara 01",
              confidence: isPresent ? 98.4 : null,
              verification: isPresent
                ? r.status === "tardanza"
                  ? "Revisión"
                  : "Validado"
                : "Sin validación",
            };
          });
          setRecordsData(mapped);
        } else if (data.employees && data.employees.length > 0) {
          const fallback: AttendanceRecord[] = data.employees.map((emp) => ({
            id: `emp-${emp.id}`,
            employeeId: emp.id,
            employeeName: emp.name,
            department: emp.department || "General",
            date: localDate(today),
            entry: emp.checkIn && emp.checkIn !== "En curso" ? emp.checkIn : null,
            exit: emp.checkOut && emp.checkOut !== "En curso" ? emp.checkOut : null,
            lateMinutes: emp.status === "tardanza" ? 15 : 0,
            workedHours: emp.checkIn ? 8 : 0,
            expected: true,
            camera: "Cámara 01",
            confidence: emp.checkIn ? 98.2 : null,
            verification: (emp.status === "presente"
              ? "Validado"
              : emp.status === "tardanza"
                ? "Revisión"
                : "Sin validación") as "Validado" | "Revisión" | "Sin validación",
          }));
          setRecordsData(fallback);
        }
      } catch (err) {
        console.error("[Reportes] Error al cargar asistencias:", err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [today]);

  const definition = reportDefinitions.find((report) => report.id === type)!;
  const departments = [
    ...new Set(recordsData.map((record) => record.department)),
  ].sort();
  const records = filterRecords(recordsData, filters, today);
  const rows = buildReportRows(records, type);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const [start, end] = getDateRange(filters, today);
  const invalidRange = !isValidRange(start, end);
  const filtered = Boolean(
    filters.search || filters.department || filters.period !== "month",
  );

  function updateFilters(patch: Partial<Filters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
    setMessage("");
  }
  function handleExport(format: ExportFormat) {
    if (!rows.length || invalidRange) return;
    const matrix = reportMatrix(definition, rows);
    const filename = `reporte-${type}-${start}-${end}`;
    try {
      if (format === "pdf") {
        setMessage("En el diálogo de impresión, selecciona Guardar como PDF.");
        window.print();
      } else {
        if (format === "csv") exportCsv(matrix, filename);
        else exportXlsx(matrix, filename);
        setMessage(
          `Archivo ${format.toUpperCase()} generado con ${rows.length} registros.`,
        );
      }
    } catch {
      setMessage("No se pudo generar el archivo. Inténtalo nuevamente.");
    }
  }
  return (
    <AppLayout activeItem="reportes">
      <div className="reports-content">
          <main className="reports-main">
            <div className="reports-page-header">
              <div>
                <h1>Reportes y Exportación</h1>
                <p>Generación de reportes de asistencia y nómina</p>
              </div>
              <ReportFilters
                filters={filters}
                departments={departments}
                invalidRange={invalidRange}
                onChange={updateFilters}
              />
            </div>
            <ReportTypeSelector
              value={type}
              onChange={(value) => {
                setType(value);
                setPage(1);
                setMessage("");
              }}
            />
            <ExportToolbar
              count={new Set(records.map((record) => record.employeeId)).size}
              disabled={!rows.length || invalidRange}
              onExport={handleExport}
            />
            {message && (
              <p role="status" className="reports-feedback">
                {message}
              </p>
            )}
            <ReportPreview
              definition={definition}
              rows={visibleRows}
              total={rows.length}
              page={page}
              pages={pages}
              onPage={setPage}
              filtered={filtered}
              onReset={() => {
                setFilters(defaultFilters(today));
                setPage(1);
              }}
            />
          </main>
      </div>
      <section className="reports-print" aria-hidden="true">
        <h1>{definition.title}</h1>
        <p>
          Período: {start} al {end} ·{" "}
          {filters.department || "Todos los departamentos"}
        </p>
        <table>
          <thead>
            <tr>
              {definition.columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  {row.name} ({row.department})
                </td>
                {row.values.map((value, index) => (
                  <td key={index}>{value}</td>
                ))}
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppLayout>
  );
}

/** La fecha inicial se obtiene del navegador después de la hidratación. */
const subscribeToDate = () => () => {};
const getClientDate = () => localDate(new Date());
const getServerDate = () => "";

export default function Page() {
  const todayIso = useSyncExternalStore(
    subscribeToDate,
    getClientDate,
    getServerDate,
  );
  if (!todayIso)
    return (
      <main className="reports-shell" aria-busy="true">
        Cargando reportes…
      </main>
    );
  const date = new Date(`${todayIso}T12:00:00`);
  return (
    <ReportsPage
      todayIso={todayIso}
      dateLabel={date.toLocaleDateString("es-PE", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      })}
    />
  );
}
