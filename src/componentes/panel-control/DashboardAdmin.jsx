import {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import Estadisticas from './Estadisticas';

const DashboardAdmin = () =>{
    const navigate = useNavigate();
    const [actividades] = useState([
        {id:1, detalle: "Carlos Pérez registró a 'Mimi' (Pastor Alemán)", hora: "Hace 10 min", tipo: "success"},
        {id:2, detalle: "Cita médica agendada para 'Luna' (Gato Persa)", hora: "Hace 25 min", tipo: "warning"},
        {id:3, detalle: "Salida de inventario: 2x Vacuna Sextuple Canina", hora: "Hace 1 hora", tipo: "danger"},
    ]);

    return(
        <div className='container mt-3'>
            <header className='mb-3'>
                <h2 className='text-accent fs-1 mb-1'>Panel de Administración</h2>
                <p className='text-muted'>Bienvenido de vuelta. Monitoreo global de La Casa del Perro</p>
            </header>

            {/*Render de Estadisticas Inyectadas */}
            <section className='mb-3'>
                <Estadisticas />
            </section>

            <div className='row'>
                {/*Accesos Rapido Operativos */}
                <div className='col-md-5 mb-2'>
                    <div className='card br-3 p-3'>
                        <h3 className='text-accent fs-3 mb-2'>Acciones Rápidas</h3>
                        <div className='form-group'>
                            <button className='btn-primary btn-block btn-md mb-2' onClick={() => navigate('/expedientes')}>
                                + Registrar Expediente Nuevo
                            </button>
                            <button className='btn-primary btn-block btn-md mb-2' onClick={() => navigate('/citas')}>
                                📅 Agendar Nueva Cita Médica
                            </button>
                            <button className='btn-primary btn-block btn-md mb-2' onClick={() => navigate('/inventario')}>
                                📦 Gestionar Stock Almacén
                            </button>
                        </div>
                    </div>
                </div>

                {/*Tabla de Monitoreo en Tiempo Real */}
                <div className='col-md-7 mb-2'>
                    <div className='card br-3 p-3' style={{overflow: 'hidden'}}>
                        <h3 className='text-accent fs-3 mb-1'>Bitácora de Actividades Recientes</h3>
                        <p className='text-muted mb-2'>últimos movimientos del ecosistema.</p>

                        <div className='table-container'>
                            {actividades.map((act) =>(
                                <aside key={act.id} className={`${act.tipo} alerta mb-1 d-flex j-cont-bet`} roles= "status">
                                    <span>{act.detalle}</span>
                                    <span className='fw-bold fs-3'>{act.hora}</span>
                                </aside>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardAdmin;
