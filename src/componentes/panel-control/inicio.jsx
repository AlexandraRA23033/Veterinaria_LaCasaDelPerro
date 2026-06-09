const Inicio = () => {
  return (
    <div className="container mt-3">
      <div className="bg-success mb-3 d-flex f-wrap">
        <div className="col-md-6">
          <img src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=1000&auto=format&fit=crop" alt="Veterinaria atendiendo" className="d-block" />
        </div>
        <div className="col-md-6 p-3 d-flex f-colum j-cont-cent">
          <h1 className="text-light font-times fs-1 mb-2">La casa del perro</h1>
          <p className="text-light">Cuidamos a quienes más quieres con servicios profesionales de salud y bienestar animal.</p>
        </div>
      </div>
      <h2 className="text-accent text-center mb-3 fw-bold">Consejos y recomendaciones</h2>
      <div className="d-flex f-wrap">
        <div className="col-md-4">
          <div className="card card-light mb-3">
            <img src="https://images.unsplash.com/photo-1589924691995-400dc9ecc119?q=80&w=500&auto=format&fit=crop" alt="Alimentación" />
            <div className="card-body"><p className="fw-bold">¿Cómo elegir la mejor alimentación para tu mascota?</p></div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card card-light mb-3">
            <img src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500&auto=format&fit=crop" alt="Vacunas" />
            <div className="card-body"><p className="fw-bold">La importancia de las vacunas anuales en cachorros.</p></div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card card-light mb-3">
            <img src="https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=500&auto=format&fit=crop" alt="Pelaje" />
            <div className="card-body"><p className="fw-bold">Tips para mantener el pelaje de tu perro brillante.</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inicio;