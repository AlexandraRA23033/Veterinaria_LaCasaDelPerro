//este metodo sirve para generar un salt aleatorio unico por cada usuario
const generarSalt = () => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
};

//este convierte texto plano a hash
const hashTexto = async (texto) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

//hashea la contraseña combinandola con el salt
export const hashPassword = async (password) =>{
    const salt = generarSalt();
    const hash = await hashTexto(salt + password);
    return { hash, salt }
}

//este metodo verifica la contraseña 
export const verificarPassword = async (passwordIngresada, hashGuardado, salt) => {
    const hash = await hashTexto(salt + passwordIngresada);
    return  hash === hashGuardado
}