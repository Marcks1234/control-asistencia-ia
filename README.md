<div align="center">

# 🕒 Control de Asistencia IA

### Plataforma SaaS de asistencia biométrica con análisis inteligente

<p>
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/OpenAI_API-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI API" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/Figma-F24E1E?style=for-the-badge&logo=figma&logoColor=white" alt="Figma" />
</p>

</div>

---

## 📋 Descripción del proyecto

**Control de Asistencia IA** es una plataforma SaaS que automatiza el control de asistencia de empleados mediante reconocimiento facial y lo potencia con un asistente conversacional contextual. El sistema reemplaza el registro manual en papel u hojas de Excel —proceso lento y propenso a errores como nombres mal escritos, duplicidad de registros o suplantación de identidad— por un flujo digital, confiable y auditable.

El objetivo es reducir el tiempo dedicado al procesamiento manual de asistencias, minimizar errores humanos y entregar a Recursos Humanos herramientas de análisis para la toma de decisiones (identificación de patrones, tardanzas recurrentes y anomalías).

## ✨ Características principales

- **Registro biométrico:** reconocimiento facial para marcar entrada y salida de los empleados.
- **Registro manual:** módulo de entrada/salida gestionado por el personal administrativo, para casos de excepción.
- **Gestión de datos:** cálculo automático de puntualidad, tardanzas, faltas y horas extra.
- **Reportes:** generación de reportes en PDF para nómina y auditorías.
- **Asistente inteligente contextual:** chat integrado (RAG + API de OpenAI) que responde consultas directas sobre la base de datos ("¿Cuántos llegaron tarde hoy?") y consultas semánticas o abstractas ("¿Alguna incidencia o anomalía para revisar?").

## 🧠 Enfoque de Inteligencia Artificial

El asistente conversacional combina dos vías de consulta:

- **Consultas directas:** se traducen a consultas SQL sobre la tabla de asistencia.
- **Consultas semánticas:** el texto se vectoriza y se resuelve mediante RAG (Generación Aumentada de Recuperación) contra el histórico de asistencia, permitiendo al modelo interpretar la solicitud y ofrecer un análisis contextual de la empresa.

## 🛠️ Stack tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | Next.js, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express (arquitectura por capas) |
| **Base de datos / IA** | Supabase, RAG, Reconocimiento facial, API de ChatGPT (OpenAI) |
| **Diseño** | Figma |

## 🏗️ Estructura del proyecto

```
control-asistencia-ia/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   └── app.js
│   └── .env.example
└── frontend/
    ├── public/
    ├── src/
    ├── next.config.ts
    ├── postcss.config.mjs
    ├── eslint.config.mjs
    ├── tsconfig.json
    └── package.json
```

### Backend (`backend/src`)

El backend sigue una arquitectura por capas sobre Node.js/Express, separando responsabilidades de la siguiente manera:

- **`app.js`** — Punto de arranque del servidor Node.js/Express; inicializa la aplicación y conecta las rutas.
- **`config/`** — Integra la conexión a Supabase y gestiona las claves secretas de las APIs externas (OpenAI, etc.).
- **`routes/`** — Define las URLs (endpoints) expuestas por la API.
- **`middlewares/`** — Intercepta las peticiones entrantes y valida el token JWT del usuario antes de llegar al controlador.
- **`controllers/`** — Recibe los paquetes HTTP del frontend y responde al cliente con el estado correspondiente (verificado o error).
- **`services/`** — Contiene la lógica de negocio principal del sistema.
- **`repositories/`** — Capa de acceso a datos; se conecta directamente a la base de datos en Supabase.
- **`models/`** — Define la estructura de los datos que representan las tablas de la base de datos.

### Frontend (`frontend`)

El frontend está construido con Next.js (App Router), TypeScript y Tailwind CSS:

- **`src/`** — Código fuente de la aplicación: páginas, layouts, componentes y estilos globales bajo el App Router de Next.js.
- **`public/`** — Recursos estáticos servidos directamente (imágenes, íconos, favicon).
- **`next.config.ts`** — Configuración del framework Next.js.
- **`postcss.config.mjs`** — Configuración de PostCSS/Tailwind CSS para los estilos.
- **`eslint.config.mjs`** — Reglas de linting del proyecto.
- **`tsconfig.json`** — Configuración de TypeScript.
- **`package.json`** — Dependencias y scripts del proyecto.

> Esta sección se irá ampliando a medida que se desarrollen los módulos (autenticación, dashboard, reportes, asistente conversacional, etc.).

## 🎨 Prototipo (Figma)

- Diseño: [Inteligencia Artificial - LRPD](https://www.figma.com/design/4WI5nL02a8qJ8OPDVFRb8H/Inteligencia-Aritifical---LRPD?node-id=0-1&t=Mte0HVe70p6TyM2h-1)
- Prototipo interactivo: [Ver flujo navegable](https://www.figma.com/proto/4WI5nL02a8qJ8OPDVFRb8H/Inteligencia-Aritifical---LRPD?node-id=3503-6842&p=f&t=FGisx4ZJ4Ax1NYTg-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=3503%3A6842)

## 👥 Equipo

**Profesor**
- Donayre Cáceres, Armando Joel

**Integrantes**
- Gentille Pastor, Marco Tulio
- Jacho Apcho, José Miguel
- Jacobo Pachas, Giancarlos Jesús
- Ramos Vásquez, Luis Fabián
- Mosquera García, Anthony Eduardo

## 📄 Licencia

Proyecto académico desarrollado para la asignatura de Inteligencia Artificial — Programa Académico de Ingeniería de Sistemas, Universidad Privada San Juan Bautista (Chincha, Perú — 2026-II).
