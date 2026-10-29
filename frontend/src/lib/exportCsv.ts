import { AttendanceRecord } from "@/types/attendance";

export function exportarAsistenciasCSV(
  registros: AttendanceRecord[],
  rolesMap: Map<string, string>
) {
  const fecha = new Date().toISOString().slice(0, 10);
  const cabecera = [
    "Colaborador",
    "Cargo",
    "Departamento",
    "Hora Entrada",
    "Hora Salida",
    "Estado",
    "Horas Registradas",
    "Observación",
  ];

  const filas = registros.map((r) => {
    const cargo = rolesMap.get(r.employeeId) || "Colaborador";
    const estadoTexto =
      r.status === "presente"
        ? "Presente"
        : r.status === "tardanza"
        ? "Tardanza"
        : r.status === "permiso"
        ? "Permiso / Justificado"
        : "Ausente";

    return [
      `"${r.name}"`,
      `"${cargo}"`,
      `"${r.department}"`,
      `"${r.checkIn || "—"}"`,
      `"${r.checkOut || "—"}"`,
      `"${estadoTexto}"`,
      `"${r.hours || "—"}"`,
      `"${r.note || ""}"`,
    ].join(";");
  });

  const csvContent = "\uFEFF" + [cabecera.join(";"), ...filas].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-asistencia-${fecha}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

