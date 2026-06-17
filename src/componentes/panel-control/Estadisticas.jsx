import {useEffect, useState} from 'react';
import { obtenerPacientes } from '../../base-datos/configuracion';

const Estadisticas = () =>{

    // const [kpis]= useState([
    //     {id:1, titulo: 'Mascotas Activas', cifra: '50', color: 'success', texto: 'Pacientes registrados'},
    //     {id:2, titulo: 'Citas para Hoy', cifra: '18', color: 'warning', texto: '8 pendientes'},
    //     {id:3, titulo: 'Stock Crítico', cifra: '4', color: 'danger', texto: 'Productos por agotarse'},
    // ]);

    //Estados individuales para manejar la data real de IndexedDB
    const [totalMascotas, setTotalMascotas] = useState(0);
    const [cargando, setCargando] = useState(true);
    useEffect(() =>{

        let componenteMontado = true;
        async function calcularEstadisticas() {

            try{
                setCargando(true);
                
                const todasLasMascotas = await obtenerPacientes();
                if(componenteMontado){
                    if(Array.isArray(todasLasMascotas)){
                        setTotalMascotas(todasLasMascotas.length);
                    }else{
                        setTotalMascotas(0);
                    }
                }
            }catch(err){
                console.err("Error al obtener estadisticas de IndexedDB:", err);
            }finally{
                if(componenteMontado){
                    setCargando(false);
                }
                
            }
        }
        calcularEstadisticas();
        return ()=>{
            componenteMontado = false;
        }
    }, []);

    const kpis= [
        {id:1, titulo: 'Mascotas Registradas', cifra: cargando ? '...': String(totalMascotas), color: 'success', texto: 'Pacientes registrados'},
        {id:2, titulo: 'Citas para Hoy', cifra: '18', color: 'warning', texto: '8 pendientes'},
        {id:3, titulo: 'Stock Crítico', cifra: '4', color: 'danger', texto: 'Productos por agotarse'},
    ];

    return(
        <div className='container mt-2'>
            {/*Grid de Tarjetas de Rendimiento*/}
            <div className='row'>
                {kpis.map((kpi)=>(
                    <div key={kpi.id} className='col-md-4 mb-2'>
                        <div className='card br-3 p-2 overflow-hidden'>
                            <span className={`badge ${kpi.color} mb-1`}>{kpi.titulo}</span>
                            <h3 className='fs-2 text-accent fw-bold mb-1'>{kpi.cifra}</h3>
                            <p className='text-muted fs-3'>{kpi.texto}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/*Marcadores de posicion para graficos avanzados */}

            <div className='row mt-2'>

                <div className='col-md-8 mb-2'>
                    <div className='card br-3 p-3' style={{minHeight:'300px'}}>
                        <h3 className='text-accent fs-3 mb-1'>Flujo de Citas Mensuales</h3>
                        <p className='text-muted mb-3'>Reporte analítico de visitas a la veterinaria</p>
                        <div className='bg-light br-2 d-flex j-cont-cent align-item' style={{height: '200px', border: '2px dashed #ccc'}}>
                            <span className='text-muted'>[Espacio reservado para Gráficos de Líneas / Recharts]</span>
                        </div>
                    </div>
                </div>

                <div className='col-md-4 mb-2'>
                    <div className='card br-3 p-3' style={{minHeight:'300px'}}>
                        <h3 className='text-accent fs-3 mb-1'>Especies Atendidas</h3>
                        <p className='text-muted mb-3'>Distribución por tipo de mascota</p>
                        <div className='bg-light br-2 d-flex j-cont-cent align-item' style={{height: '200px', border: '2px dashed #ccc'}}>
                            <span className='text-muted'>[Grafico de Pastel]</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Estadisticas;