import crypto from 'crypto';
import { empresaRepository } from '../repositories/empresaRepository.js';
import { usuarioRepository } from '../repositories/usuarioRepository.js';
import { suscripcionRepository } from '../repositories/suscripcionRepository.js';
import { emailService } from './emailService.js';
import { generarTokenJWT, verificarTokenJWT } from '../utils/jwt.js';

const SALT = 'AsistenciaAI_B2B_Salt_2026';

/**
 * Genera un hash seguro para la contraseña
 */
export function hashearContrasena(password) {
  return crypto.createHash('sha256').update(`${password}_${SALT}`).digest('hex');
}

/**
 * Valida si una contraseña coincide con el hash almacenado
 */
export function validarContrasena(passwordPlana, hashAlmacenado) {
  if (!passwordPlana || !hashAlmacenado) return false;
  if (passwordPlana === hashAlmacenado) return true;
  const hashCalculado = hashearContrasena(passwordPlana);
  return hashCalculado === hashAlmacenado;
}

/**
 * Servicio de Autenticación JWT, Registro y Recuperación de Contraseña en capas
 */
export const authService = {
  /**
   * Registra una nueva empresa (Tenant) con su Gerente inicial, suscripción activa y emite un token JWT
   */
  async registrarEmpresaYGerente({
    nombreEmpresa,
    ruc,
    telefono = '',
    ciudad = 'Lima',
    nombreGerente,
    apellidoGerente,
    correo,
    password,
    idPlan = null,
  }) {
    if (!nombreEmpresa?.trim()) throw new Error('El nombre de la empresa es obligatorio.');
    if (!ruc?.trim() || !/^\d{11}$/.test(ruc.trim())) {
      throw new Error('El RUC debe tener 11 dígitos numéricos válidos.');
    }
    if (!nombreGerente?.trim() || !apellidoGerente?.trim()) {
      throw new Error('El nombre y apellido del encargado son obligatorios.');
    }
    if (!correo?.trim() || !correo.includes('@')) {
      throw new Error('Debes ingresar un correo electrónico válido.');
    }
    if (!password || password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    const empresaExistente = await empresaRepository.buscarPorRuc(ruc.trim());
    if (empresaExistente) {
      throw new Error(`Ya existe una empresa registrada con el RUC ${ruc.trim()}.`);
    }

    const usuarioExistente = await usuarioRepository.buscarPorCorreo(correo.trim());
    if (usuarioExistente) {
      throw new Error(`El correo ${correo.trim()} ya se encuentra registrado.`);
    }

    const plan = await suscripcionRepository.obtenerPlanPorId(idPlan);
    if (!plan) {
      throw new Error('No se pudo asociar un plan comercial activo.');
    }

    const nuevaEmpresa = await empresaRepository.crear({
      nombre: nombreEmpresa,
      ruc,
      telefono,
      ciudad,
    });

    await empresaRepository.crearConfiguracionInicial(nuevaEmpresa.id);

    const nuevaSuscripcion = await suscripcionRepository.crearSuscripcion({
      id_empresa: nuevaEmpresa.id,
      id_plan: plan.id,
      meses: 1,
      estado: 'ACTIVA',
    });

    const contrasenaHash = hashearContrasena(password);
    const nuevoUsuario = await usuarioRepository.crear({
      id_empresa: nuevaEmpresa.id,
      nombre: nombreGerente,
      apellido: apellidoGerente,
      correo,
      contrasena_hash: contrasenaHash,
      rol: 'GERENTE',
    });

    const token = generarTokenJWT({
      sub: nuevoUsuario.id,
      id_empresa: nuevaEmpresa.id,
      correo: nuevoUsuario.correo,
      nombre: nuevoUsuario.nombre,
      apellido: nuevoUsuario.apellido,
      rol: nuevoUsuario.rol,
      empresa_nombre: nuevaEmpresa.nombre,
    });

    return {
      token,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        apellido: nuevoUsuario.apellido,
        correo: nuevoUsuario.correo,
        rol: nuevoUsuario.rol,
      },
      empresa: {
        id: nuevaEmpresa.id,
        nombre: nuevaEmpresa.nombre,
        ruc: nuevaEmpresa.ruc,
        ciudad: nuevaEmpresa.ciudad,
      },
      suscripcion: {
        id: nuevaSuscripcion.id,
        plan: plan.nombre,
        precio_mensual: plan.precio_mensual,
        fecha_fin: nuevaSuscripcion.fecha_fin,
        estado: nuevaSuscripcion.estado,
      },
    };
  },

  /**
   * Autenticación de usuario (Login) y emisión de JSON Web Token (JWT)
   */
  async autenticarUsuario({ correo, password }) {
    if (!correo?.trim() || !password) {
      throw new Error('Correo y contraseña son obligatorios.');
    }

    const usuario = await usuarioRepository.buscarPorCorreo(correo.trim());
    if (!usuario) {
      throw new Error('No existe una cuenta asociada a este correo electrónico.');
    }

    if (!usuario.activo) {
      throw new Error('Esta cuenta de usuario se encuentra desactivada.');
    }

    const esValida = validarContrasena(password, usuario.contrasena_hash);
    if (!esValida) {
      throw new Error('Contraseña incorrecta. Por favor verifica tus credenciales.');
    }

    const empresa = await empresaRepository.buscarPorId(usuario.id_empresa);
    const suscripcion = await suscripcionRepository.obtenerSuscripcionPorEmpresa(usuario.id_empresa);

    const nombreEmpresa = empresa?.nombre || 'Corporación AsistenciaAI SAC';

    const token = generarTokenJWT({
      sub: usuario.id,
      id_empresa: usuario.id_empresa,
      correo: usuario.correo,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: usuario.rol,
      empresa_nombre: nombreEmpresa,
    });

    return {
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        rol: usuario.rol,
      },
      empresa: empresa || {
        id: usuario.id_empresa,
        nombre: nombreEmpresa,
      },
      suscripcion: suscripcion || {
        estado: 'ACTIVA',
        plan: 'Profesional',
      },
    };
  },

  /**
   * Verifica un token JWT y retorna los datos de la sesión activa
   */
  verificarSesionJWT(token) {
    return verificarTokenJWT(token);
  },

  /**
   * Genera un código de 6 dígitos, lo guarda con expiración de 15 minutos y lo envía por Gmail
   */
  async solicitarRecuperacionContrasena(correo) {
    if (!correo?.trim() || !correo.includes('@')) {
      throw new Error('Ingresa un correo electrónico válido.');
    }

    const usuario = await usuarioRepository.buscarPorCorreo(correo.trim());
    if (!usuario) {
      throw new Error('No encontramos una cuenta registrada con ese correo electrónico.');
    }

    const codigo = crypto.randomInt(100000, 999999).toString();
    const expiracionIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await usuarioRepository.guardarCodigoRecuperacion(usuario.correo, codigo, expiracionIso);

    const resultadoEmail = await emailService.enviarCodigoRecuperacionGmail({
      correoDestino: usuario.correo,
      nombreUsuario: usuario.nombre,
      codigo,
    });

    return {
      correo: usuario.correo,
      destinatarioFinal: resultadoEmail.destinatarioFinal,
      enviadoPorGmail: resultadoEmail.enviadoPorGmail,
      ...(resultadoEmail.enviadoPorGmail ? {} : { codigoDemo: codigo }),
    };
  },

  /**
   * Verifica el código de recuperación de 6 dígitos y actualiza la contraseña en Supabase
   */
  async restablecerContrasena({ correo, codigo, nuevaPassword }) {
    if (!correo?.trim() || !codigo?.trim() || !nuevaPassword) {
      throw new Error('Todos los campos son obligatorios.');
    }
    if (nuevaPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    const usuario = await usuarioRepository.buscarPorCorreo(correo.trim());
    if (!usuario) {
      throw new Error('Usuario no encontrado.');
    }

    if (!usuario.codigo_recuperacion || usuario.codigo_recuperacion !== codigo.trim()) {
      throw new Error('El código de verificación es incorrecto.');
    }

    if (!usuario.expiracion_recuperacion || new Date(usuario.expiracion_recuperacion) < new Date()) {
      throw new Error('El código de verificación ha expirado. Solicita uno nuevo.');
    }

    const nuevoHash = hashearContrasena(nuevaPassword);
    await usuarioRepository.actualizarContrasena(usuario.correo, nuevoHash);

    return {
      correo: usuario.correo,
      actualizado: true,
    };
  },

  /**
   * Obtiene la lista de planes comerciales para mostrar en el formulario de registro
   */
  async listarPlanes() {
    return await suscripcionRepository.obtenerPlanes();
  },
};
