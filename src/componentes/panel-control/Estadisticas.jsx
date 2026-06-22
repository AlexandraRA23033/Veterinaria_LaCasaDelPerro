import {useEffect, useState} from 'react';
import { obtenerPacientes } from '../../base-datos/configuracion';
import { obtenerCitasAgenda , obtenerLotesDB} from '../../base-datos/configuracion';
import { AreaChart , Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';


const Estadisticas = () =>{

    //Estados individuales para manejar la data real de IndexedDB
    const [totalMascotas, setTotalMascotas] = useState(0);
    const [totalCitasAgenda, setTotalCitasAgenda] = useState(0);
    const [totalStockCritico, setTotalStockCritico] = useState(0);
    const [dataMensual, setDataMensual] = useState([]);
    const [dataEspecies, setDataEspecies] =useState([]);
    const [cargando, setCargando] = useState(true);


    const procesarCitasMensuales = (citas)=>{
        console.log("Citas curdas de la DB:", citas);
        const mesesKey = ['Ene', 'Feb','Mar','Abr','May','Jun','Jul','Ago', 'Sep','Oct','Nov','Dic'];
        const conteoMeses = mesesKey.reduce((acc, mes)=>({ ...acc, [mes]:0}), {});
        citas.forEach(cita => {
            if(!cita.fecha) return;
            const partes = cita.fecha.split('-');
            if(partes.length === 3){
                const anio = parseInt(partes[0], 10);
                const mesIndex = parseInt(partes[1], 10) - 1;
                const dia = parseInt(partes[2], 10);
        
                const fechaLocal= new Date(anio, mesIndex, dia);
                const numeroMes = fechaLocal.getMonth();
                const mesFormateado = mesesKey[numeroMes]
                if(conteoMeses[mesFormateado] !== undefined){
                    conteoMeses[mesFormateado] += 1;
                }
            }
        });
        const dataFinal = mesesKey.map(mes => ({name: mes, Citas: conteoMeses[mes]}));
        console.log("Data final corregida para Recharts:", dataFinal)
        return dataFinal
    };

    const procesarEspecies = (mascotas)=>{
        const conteo = {};
        mascotas.forEach(m =>{
            if(!m.especie) return;
            const esp = m.especie.charAt(0).toUpperCase() + m.especie.slice(1).toLowerCase();
            conteo[esp] = (conteo[esp] || 0) + 1;
        });
        return Object.keys(conteo).map(key => ({name: key, value: conteo[key]}));
    }
    const Colores_Especies = ["#BB8588", "#4E5748",  "#7FA6A0", "#B8B2A0"]

    
    useEffect(() =>{

        let componenteMontado = true;
        async function calcularEstadisticas() {

            try{
                setCargando(true);
                
                const todasLasMascotas = await obtenerPacientes();
                const todasLasCitasAgenda = await obtenerCitasAgenda();
                const todosLosProductos = await obtenerLotesDB();

                if(componenteMontado){

                    //mascotas
                    if(Array.isArray(todasLasMascotas)){
                        setTotalMascotas(todasLasMascotas.length);
                        setDataEspecies(procesarEspecies(todasLasMascotas));
                    }else{
                        setTotalMascotas(0);
                    }
                    //citas
                    if(Array.isArray(todasLasCitasAgenda)){
                        const hoy = new Date().toLocaleDateString('sv-SE');
                        const citasDeHoy = todasLasCitasAgenda.filter(cita => cita.fecha === hoy);
                        setTotalCitasAgenda(citasDeHoy.length);
                        setDataMensual(procesarCitasMensuales(todasLasCitasAgenda));
                    }else{
                        setTotalCitasAgenda(0);
                    }
                    //stock critico
                    if(Array.isArray(todosLosProductos)){
                        const productosCriticos = todosLosProductos.filter(producto=> producto.cantidad <=5);
                        setTotalStockCritico(productosCriticos.length);
                    }else{
                        setTotalStockCritico(0);
                    }
                    
                }
            }catch(err){
                console.error("Error al obtener estadisticas de IndexedDB:", err);
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
        {id:2, titulo: 'Citas para Hoy', cifra: cargando ?  '...' : String(totalCitasAgenda), color: 'warning', texto: 'Pendientes de atención hoy'},
        {id:3, titulo: 'Stock Crítico', cifra: cargando ? '...' : String(totalStockCritico), color: 'danger', texto: 'Productos por agotarse'},
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

            <div className='row mt-2'>

                <div className='col-md-8 mb-2'>
                    <div className='card br-3 p-3' style={{minHeight:'330px'}}>
                        <h3 className='text-accent fs-3 mb-1'>Flujo de Citas Mensuales</h3>
                        <p className='text-muted mb-3'>Reporte analítico de visitas a la veterinaria</p>

                        <div style={{width: '100%', overflowX: 'auto', overflowY: 'hidden'}}>
                            {cargando ? (
                                <div className='text-center pt-5'><span className='text-muted'>Procesando gráficos...</span></div>
                            ) : (
                               
                                <AreaChart width={700} height={230} data={dataMensual} margin={{top: 10, right:10, left:-25, bottom: 0}} style={{maxWidth: '100%'}}>
                                    <defs>
                                        <linearGradient id='colorCitas' x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor='#0d6efd' stopOpacity={0.3} />
                                            <stop offset="95%" stopColor='#0d6efd' stopOpacity={0} />

                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid  strokeDasharray="3 3" vertical={false}/>
                                    <XAxis dataKey="name" style={{fontSize: "12px"}} stroke='#6c757d'/>
                                    <YAxis allowDecimals={false} style={{fontSize: "12px"}} stroke='#6c757d'/>
                                    <Tooltip/>
                                    <Area 
                                        type="monotone"
                                        dataKey="Citas"
                                        stroke='#0d6efd'
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill='url(#colorCitas)'
                                    />
                                </AreaChart>
                                
                            )}
                        </div>
                    </div>
                </div>

                <div className='col-md-4 mb-2'>
                    <div className='card br-3 p-3' style={{minHeight:'330px'}}>
                        <h3 className='text-accent fs-3 mb-1'>Especies Atendidas</h3>
                        <p className='text-muted mb-3'>Distribución por tipo de mascota</p>
                        <div style={{width: '100%', overflowX: 'auto', overflowY: 'hidden'}}>
                            {cargando ? (
                                <div className='text-center pt-5'><span className='text-muted'>Procesando gráficos...</span></div>
                            ) : dataEspecies.length > 0 ? (
                               
                                <BarChart width={280} height={230} data={dataEspecies} margin={{top: 10, right:10, left:-25, bottom: 5}} style={{maxWidth: '100%'}}>
                                    <CartesianGrid  strokeDasharray="3 3" vertical={false}/>
                                    <XAxis dataKey="name" style={{fontSize: "11px"}} stroke='#6c757d'/>
                                    <YAxis allowDecimals={false} style={{fontSize: "11px"}} stroke='#6c757d'/>
                                    <Tooltip/>
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {dataEspecies.map((entry, index)=> (
                                            <Cell 
                                            key={`cell-${index}`}
                                            fill={Colores_Especies[index % Colores_Especies.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                                
                            ): (
                                <div className='text-center pt-5'><sapn className="text-muted">Sin registros</sapn></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Estadisticas;