import { buscarUsuario, registrarUsuario, actualizarUsuario} from '../../base-datos/configuracion';
import { hashPassword, verificarPassword } from './EncriptacionService';

export const loginUsuario = async (correo, password) => {
    const user = await buscarUsuario(correo);
    if (!user) throw new Error('Correo o contraseña incorrectos.');
   
    if(!user.salt){
        if(user.password !== password) throw new Error('Correo o contraseña incorrectos.');
        const { hash, salt } = await hashPassword(password);
        await actualizarUsuario({...user, password: hash, salt });
        return {...user, password: hash, salt};
    }
   
    const esValida = await verificarPassword(password, user.password, user.salt);
    if (!esValida) throw new Error('Correo o contraseña incorrectos.');
    return user;
}

export const crearUsuario = async (datos) =>{
    const existente = await buscarUsuario(datos.correo);
    if(existente) throw new Error('Este correo ya esta registrado');
    const { hash, salt } = await hashPassword(datos.password);
    await registrarUsuario({
        ...datos,
        password: hash,
        salt,
    });
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