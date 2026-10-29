export function obtenerFechaHoy(): string {
  const f = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return f.charAt(0).toUpperCase() + f.slice(1);
}

