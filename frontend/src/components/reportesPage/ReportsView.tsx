"use client";

import { useState, useEffect } from "react";
import { fetchAsistencias } from "@/services/asistenciaService";
import {
  AttendanceRecord,
  ExportFormat,
  Filters,
  Period,
  ReportDefinition,
  ReportRow,
  ReportType,
  buildReportRows,
  defaultFilters,
  exportCsv,
  exportXlsx,
  filterRecords,
  getDateRange,
  initials,
  isValidRange,
  mapAttendanceToReportRecords,
  reportDefinitions,
  reportMatrix,
} from "@/lib/reportUtils";

const ICON_SIZES: Record<string, [number, number]> = {
  "3503:5561": [11, 11],
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
};

function DesignIcon({ id }: { id: string }) {
  const [width, height] = ICON_SIZES[id] ?? [16, 16];
  return (
    <svg width={width} height={height} aria-hidden="true" className="shrink-0">
      <use href={`/imgs/reportes-icons.svg#icon-${id.replace(":", "-")}`} />
    </svg>
  );
}

const PERIODS: { id: Period; label: string }[] = [
  { id: "today", label: "Hoy" },
  { id: "month", label: "Este Mes" },
  { id: "previous", label: "Mes Anterior" },
  { id: "custom", label: "Personalizado" },
];

function ReportFilters({
  filters,
  departments,
  invalidRange,
  onChange,
}: {
  filters: Filters;
  departments: string[];
  invalidRange: boolean;
  onChange: (patch: Partial<Filters>) => void;
}) {
  return (
    <div className="reports-filters">
      <div className="reports-filter-row">
        <div className="reports-periods" role="group" aria-label="Período del reporte">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              aria-pressed={filters.period === p.id}
              className={filters.period === p.id ? "selected" : ""}
              onClick={() => onChange({ period: p.id })}
            >
              {p.id === "custom" && <DesignIcon id="3503:5561" />}
              {p.label}
            </button>
          ))}
        </div>
        <select aria-label="Departamento" value={filters.department} onChange={(e) => onChange({ department: e.target.value })}>
          <option value="">Todos los departamentos</option>
          {departments.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      {filters.period === "custom" && (
        <div className="reports-custom-dates">
          <label>
            Desde
            <input type="date" value={filters.startDate} max={filters.endDate || undefined} onChange={(e) => onChange({ startDate: e.target.value })} aria-invalid={invalidRange} />
          </label>
          <label>
            Hasta
            <input type="date" value={filters.endDate} min={filters.startDate || undefined} onChange={(e) => onChange({ endDate: e.target.value })} aria-invalid={invalidRange} />
          </label>
          {invalidRange && <p role="alert">Selecciona un rango de fechas válido.</p>}
        </div>
      )}
    </div>
  );
}

function ReportTypeSelector({ value, onChange }: { value: ReportType; onChange: (v: ReportType) => void }) {
  return (
    <section aria-labelledby="report-type-title">
      <h2 id="report-type-title" className="reports-section-label">SELECCIONAR TIPO DE REPORTE</h2>
      <div className="reports-cards" role="group" aria-label="Tipo de reporte">
        {reportDefinitions.map((r) => (
          <button
            key={r.id}
            className={`reports-card ${value === r.id ? "selected" : ""}`}
            aria-pressed={value === r.id}
            onClick={() => onChange(r.id)}
          >
            <span className="reports-card-top">
              <span className="reports-icon-box"><DesignIcon id={r.icon} /></span>
              <DesignIcon id={value === r.id ? "3503:5583" : "3503:5599"} />
            </span>
            <span>
              <strong>{r.title}</strong>
              <span className="reports-card-description">{r.description}</span>
            </span>
            <span className="reports-card-footer">
              <span>{r.caption}</span>
              <span>{value === r.id ? "Seleccionado" : "Elegir"}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ExportToolbar({ count, disabled, onExport }: { count: number; disabled: boolean; onExport: (f: ExportFormat) => void }) {
  return (
    <section className="reports-export reports-panel" aria-label="Exportar reporte">
      <div className="reports-export-label">
        <span className="reports-icon-box"><DesignIcon id="3503:5629" /></span>
        <span>
          <strong>{disabled ? "Sin datos para exportar" : "Listo para exportar"}</strong>
          <small>
            {count} {count === 1 ? "colaborador incluido" : "colaboradores incluidos"} en el período actual
          </small>
        </span>
      </div>
      <div className="reports-export-buttons">
        <button disabled={disabled} onClick={() => onExport("csv")}>
          <DesignIcon id="3503:5637" /> CSV
        </button>
        <button disabled={disabled} onClick={() => onExport("pdf")} title="Abre el diálogo de impresión para guardar como PDF">
          <DesignIcon id="3503:5642" /> Exportar PDF
        </button>
        <button disabled={disabled} onClick={() => onExport("xlsx")} className="primary">
          <DesignIcon id="3503:5647" /> Descargar Reporte (Excel .xlsx)
        </button>
      </div>
    </section>
  );
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
}: {
  definition: ReportDefinition;
  rows: ReportRow[];
  total: number;
  page: number;
  pages: number;
  onPage: (page: number) => void;
  onReset: () => void;
  filtered: boolean;
}) {
  return (
    <section className="reports-preview reports-panel" aria-labelledby="preview-title">
      <div className="reports-preview-header">
        <div>
          <h2 id="preview-title">Vista previa de datos</h2>
          <p>{definition.summary}</p>
        </div>
        <small aria-live="polite">
          Mostrando {rows.length} de {total} {definition.id === "payroll" ? "colaboradores" : "registros"}
        </small>
      </div>
      <div className="reports-table-scroll">
        <table>
          <thead>
            <tr>{definition.columns.map((col) => <th key={col} scope="col">{col}</th>)}</tr>
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
                {row.values.map((val, idx) => (
                  <td key={idx} className={idx === 2 && definition.id === "payroll" ? "reports-hours" : ""}>{val}</td>
                ))}
                <td>
                  <span className={`reports-status ${["Listo", "Completo", "Validado"].includes(row.status) ? "success" : row.status === "Ausente" ? "danger" : "warning"}`}>
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
          <span className="reports-icon-box"><DesignIcon id="3503:5597" /></span>
          <h3>{filtered ? "No se encontraron resultados" : "Aún no hay registros de asistencia"}</h3>
          <p>{filtered ? "Prueba otro período, departamento o término de búsqueda." : "Los reportes estarán disponibles cuando se incorporen registros de asistencia."}</p>
          {filtered && <button onClick={onReset}>Restablecer filtros</button>}
        </div>
      )}
      <footer className="reports-pagination">
        <small>Página {page} de {pages}</small>
        <div>
          <button disabled={page <= 1} onClick={() => onPage(page - 1)}><DesignIcon id="3503:5770" /> Anterior</button>
          <button disabled={page >= pages} onClick={() => onPage(page + 1)}>Siguiente <DesignIcon id="3503:5777" /></button>
        </div>
      </footer>
    </section>
  );
}

const PAGE_SIZE = 5;

export default function ReportsView({ todayIso, globalSearch = "" }: { todayIso: string; globalSearch?: string }) {
  const [today] = useState(() => new Date(`${todayIso}T12:00:00`));
  const [filters, setFilters] = useState<Filters>(() => defaultFilters(today));
  const [type, setType] = useState<ReportType>("payroll");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [recordsData, setRecordsData] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchAsistencias()
      .then((data) => {
        if (isMounted) setRecordsData(mapAttendanceToReportRecords(data, todayIso));
      })
      .catch((err) => console.error("[Reportes] Error al cargar asistencias:", err));
    return () => {
      isMounted = false;
    };
  }, [todayIso]);

  const effectiveFilters: Filters = globalSearch ? { ...filters, search: globalSearch } : filters;
  const definition = reportDefinitions.find((r) => r.id === type)!;
  const departments = [...new Set(recordsData.map((r) => r.department))].sort();
  const records = filterRecords(recordsData, effectiveFilters, today);
  const rows = buildReportRows(records, type);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const [start, end] = getDateRange(effectiveFilters, today);
  const invalidRange = !isValidRange(start, end);
  const filtered = Boolean(effectiveFilters.search || effectiveFilters.department || effectiveFilters.period !== "month");

  const updateFilters = (patch: Partial<Filters>) => {
    setFilters((cur) => ({ ...cur, ...patch }));
    setPage(1);
    setMessage("");
  };

  const handleExport = (format: ExportFormat) => {
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
        setMessage(`Archivo ${format.toUpperCase()} generado con ${rows.length} registros.`);
      }
    } catch {
      setMessage("No se pudo generar el archivo. Inténtalo nuevamente.");
    }
  };

  return (
    <>
      <div className="reports-content">
        <div className="reports-main">
          <div className="reports-page-header">
            <div>
              <h1>Reportes y Exportación</h1>
              <p>Generación de reportes de asistencia y nómina</p>
            </div>
            <ReportFilters filters={filters} departments={departments} invalidRange={invalidRange} onChange={updateFilters} />
          </div>
          <ReportTypeSelector
            value={type}
            onChange={(v) => {
              setType(v);
              setPage(1);
              setMessage("");
            }}
          />
          <ExportToolbar
            count={new Set(records.map((r) => r.employeeId)).size}
            disabled={!rows.length || invalidRange}
            onExport={handleExport}
          />
          {message && <p role="status" className="reports-feedback">{message}</p>}
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
        </div>
      </div>

      <section className="reports-print" aria-hidden="true">
        <h1>{definition.title}</h1>
        <p>Período: {start} al {end} · {effectiveFilters.department || "Todos los departamentos"}</p>
        <table>
          <thead>
            <tr>{definition.columns.map((c) => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.name} ({r.department})</td>
                {r.values.map((v, i) => <td key={i}>{v}</td>)}
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
