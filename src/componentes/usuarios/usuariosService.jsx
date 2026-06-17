import { buscarUsuario, registrarUsuario, actualizarUsuario} from '../../base-datos/configuracion';

export const loginUsuario = async (correo, password) => {
    const user = await buscarUsuario(correo);
    if (!user) throw new Error('Correo o contraseña incorrectos.');
    if (user.password !== password) throw new Error('Correo o contraseña incorrecta');
    return user;
}

export const crearUsuario = async (datos) =>{
    const existente = await buscarUsuario(datos.correo);
    if(existente) throw new Error('Este correo ya esta registrado');
    await registrarUsuario(datos);
}

export const editarUsuario = async (usuarioActual, datosNuevos) => {
    if(!datosNuevos.nombre_completo?.trim()){
        throw new Error('El nombre no puede estar vacío.');
    }
    const acrualizado = {
        ...usuarioActual,
        nombre_completo: datosNuevos.nombre_completo.trim(),
        telefono: datosNuevos.telefono?.trim() || '',
    };
    await actualizarUsuario(acrualizado);
    return acrualizado;
}