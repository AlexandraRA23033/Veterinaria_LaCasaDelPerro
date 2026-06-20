import Estadisticas from './Estadisticas';

const DashboardAdmin = () =>{
    

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

        </div>
    );
};

export default DashboardAdmin;