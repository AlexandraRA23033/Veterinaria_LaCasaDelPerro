const Login = () => {
  return (
    <div className="container-flex-center" style={{ minHeight: '70vh' }}>
      <div className="card card-light shadow-lg" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="card-header border-bottom-accent">
          <h2 className="card-title text-accent">Iniciar Sesión</h2>
        </div>
        <div className="card-body">
          <form className="form">
            <div className="form-group">
              <label className="label">Correo Institucional</label>
              <input type="email" className="input border-muted" placeholder="ejemplo@ues.edu.sv" required />
            </div>
            
            <div className="form-group">
              <label className="label">Contraseña</label>
              <input type="password" className="input border-muted" placeholder="••••••••" required />
            </div>

            <div className="mt-4">
              <button type="submit" className="btn-primary btn-md btn-block">
                Ingresar al Sistema
              </button>
            </div>
          </form>
        </div>
        <div className="card-footer text-center">
          <p className="text-muted">¿Olvidaste tu contraseña? <span className="text-accent">Recupérala aquí</span></p>
        </div>
      </div>
    </div>
  );
};

export default Login;