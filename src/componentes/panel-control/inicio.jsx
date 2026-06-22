import { useState, useEffect } from "react";
import {
  obtenerServiciosDB,
  obtenerProductosDB,
} from "../../base-datos/configuracion";

const Carrusel = ({ items, renderItem, visibled = 3 }) => {
  const [pagina, setPagina] = useState(0);

  if (!items.length) {
    return (
      <div className="secondary alerta">No hay elementos registrados aún.</div>
    );
  }

  const totalPaginas = Math.ceil(items.length / visibled);
  const inicio = pagina * visibled;
  const visibles = items.slice(inicio, inicio + visibled);

  return (
    <div>
      <div className="row">{visibles.map((item) => renderItem(item))}</div>
      <div className="d-flex gap-1 j-cont-cent mt-2">
        <button
          className="btn-outline-secondary btn-sm"
          onClick={() => setPagina((p) => Math.max(0, p - 1))}
          disabled={pagina === 0}
        >
          Anterior
        </button>
        <span className="text-muted d-flex align-item">
          Página {pagina + 1} de {totalPaginas}
        </span>
        <button
          className="btn-outline-secondary btn-sm"
          onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
          disabled={pagina >= totalPaginas - 1}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

const infoClinica = [
  {
    titulo: "Ubicación",
    detalle: "7ª. Av Sur, 803, Barrio San Nicolas, San Miguel",
  },
  {
    titulo: "Horario",
    detalle:
      "Lunes a Viernes 8:00am – 12:00pm / 1:00pm – 4:00pm · Sábados 8:00am – 12:00pm",
  },
  { titulo: "WhatsApp", detalle: "7712-8139" },
  {
    titulo: "Servicios",
    detalle: "Consultas, vacunación, cirugías, grooming, laboratorio y más",
  },
];

const consejos = [
  {
    id: 1,
    imagen:
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?q=80&w=500&auto=format&fit=crop",
    categoria: "Nutrición",
    titulo: "¿Cómo elegir la mejor alimentación para tu perro?",
    resumen:
      "La alimentación adecuada es la base de la salud de tu mascota. Conoce qué nutrientes son esenciales según la edad y raza.",
    enlace:
      "https://www.purina.com/es/articulos/perro/alimentacion/guias/como-elegir-el-mejor-alimento-para-perros",
  },
  {
    id: 2,
    imagen:
      "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=500&auto=format&fit=crop",
    categoria: "Salud",
    titulo: "Calendario de vacunación para cachorros y adultos",
    resumen:
      "Las vacunas protegen a tu mascota de enfermedades graves. Descubre cuáles son obligatorias y con qué frecuencia aplicarlas.",
    enlace:
      "https://www.elsalvador.com/vida/hogar-y-espacios/mascotas-perros-vacunas-el-salvador/1236273/2025/",
  },
  {
    id: 3,
    imagen:
      "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?q=80&w=500&auto=format&fit=crop",
    categoria: "Cuidado",
    titulo: "Guía completa de grooming para perros en casa",
    resumen:
      "Un pelaje limpio y sin nudos previene infecciones dérmicas. Aprende la frecuencia de baño y cepillado según la raza.",
    enlace:
      "https://www.therealgroom.com/guia-completa-de-grooming-cepillado-bano-unas-oidos-y-mas/?srsltid=AfmBOoppRix0AzzYnZ9YdTGmwVTaQyfoxVOBa8SIkcN4WwBTujygPArK",
  },
  {
    id: 4,
    imagen:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=500&auto=format&fit=crop",
    categoria: "Gatos",
    titulo: "Cuidados esenciales para tu gato en interiores",
    resumen:
      "Los gatos de interior tienen necesidades específicas de enriquecimiento ambiental, dieta y revisiones veterinarias.",
    enlace:
      "https://www.royalcanin.com/pa/cats/thinking-of-getting-a-cat/indoor-house-cat-care-guide",
  },
  {
    id: 5,
    imagen:
      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=500&auto=format&fit=crop",
    categoria: "Bienestar",
    titulo: "Señales de que tu mascota necesita atención veterinaria",
    resumen:
      "Aprende a identificar síntomas como letargia, pérdida de apetito o cambios de comportamiento que requieren consulta.",
    enlace:
      "https://highgatevet.com/top-5-signs-your-pet-needs-to-see-the-vet-what-to-watch-out-for-in-dogs-and-cats/",
  },
  {
    id: 6,
    imagen:
      "https://images.unsplash.com/photo-1559190394-df5a28aab5c5?q=80&w=500&auto=format&fit=crop",
    categoria: "Dental",
    titulo: "Salud dental en mascotas: más importante de lo que crees",
    resumen:
      "El 80% de los perros mayores de 3 años tienen algún grado de enfermedad periodontal. Conoce cómo prevenirla.",
    enlace:
      "https://welljoy.com.au/post/dog-oral-hygiene-why-it-matters-more-than-you-think",
  },
];

const categoriaBadge = {
  Nutrición: "success",
  Salud: "info",
  Cuidado: "accent",
  Gatos: "primary",
  Bienestar: "warning",
  Dental: "secondary",
};

const Inicio = () => {
  const [servicios, setServicios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const [svcs, prods] = await Promise.all([
          obtenerServiciosDB(),
          obtenerProductosDB(),
        ]);
        setServicios(svcs.filter((s) => s.disponible !== false));
        setProductos(prods);
      } catch (err) {
        console.error("Error cargando datos del inicio:", err);
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  return (
    <>
      <section className="bg-success p-3">
        <div className="container">
          <div className="row align-item">
            <div className="col-md-6">
              <img
                src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?q=80&w=1000&auto=format&fit=crop"
                alt="Veterinaria atendiendo"
                className="d-block br-3"
              />
            </div>
            <div className="col-md-6">
              <h1 className="text-light font-times fs-1 mb-2">
                La Casa del Perro
              </h1>
              <p className="text-light mb-3">
                Somos una clínica veterinaria integral comprometida con la
                salud, el bienestar y la felicidad de tus mascotas. Contamos con
                profesionales certificados y equipos de última generación.
              </p>
              <div>
                <span className="accent badge">Perros</span>
                <span className="warning badge">Gatos</span>
                <span className="info badge">Conejos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container p-3">
        <h2 className="text-accent fw-bold mb-1">Sobre nosotros</h2>
        <p className="mb-3">
          Desde 2010 brindando atención veterinaria de calidad en El Salvador.
          Nuestro equipo está formado por médicos veterinarios especializados en
          medicina interna, cirugía y medicina preventiva.
        </p>

        <div className="row mb-3">
          <div className="col-md-6 mb-3">
            <div className="card card-light p-3 br-3">
              <h3 className="fw-bold text-primary mb-2">Misión</h3>
              <p>
                Brindar atención veterinaria responsable, accesible y de calidad
                a las mascotas de nuestra comunidad, promoviendo su salud,
                bienestar y calidad de vida mediante servicios profesionales,
                atención personalizada y orientación oportuna para sus
                propietarios.
              </p>
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <div className="card card-light p-3 br-3">
              <h3 className="fw-bold text-primary mb-2">Visión</h3>
              <p>
                Ser una clínica veterinaria reconocida en la ciudad de San
                Miguel por la confianza, compromiso y cercanía con nuestros
                clientes, contribuyendo al cuidado responsable de las mascotas y
                fortaleciendo la cultura de bienestar animal en nuestra
                comunidad mediante la mejora continua de nuestros servicios.
              </p>
            </div>
          </div>
        </div>

        <div className="row">
          {infoClinica.map((item, i) => (
            <div key={i} className="col-md-6 col-lg-3 mb-3">
              <div className="card card-light p-3 br-3">
                <h4 className="fw-bold text-accent mb-2">{item.titulo}</h4>
                <p>{item.detalle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary p-3">
        <div className="container">
          <div className="row align-item">
            <div className="col-md-8">
              <h3 className="text-light fw-bold mb-2">
                ¿Primera visita con tu mascota?
              </h3>
              <p className="text-light">
                Agenda tu cita en línea y recibe una consulta de bienvenida con
                revisión completa. Trae el carnet de vacunación si lo tienes.
              </p>
            </div>
            <div className="col-md-4 text-center">
              <a href="/registro" className="btn-primary btn-md">
                Crear cuenta y expediente
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="container p-3">
        <h2 className="text-accent fw-bold mb-1">Nuestros servicios</h2>
        <p className="mb-3">
          Atención veterinaria profesional para cada necesidad de tu mascota.
        </p>
        {cargando ? (
          <p className="text-muted">Cargando servicios...</p>
        ) : (
          <Carrusel
            items={servicios}
            visibled={3}
            renderItem={(servicio) => (
              <div key={servicio.id} className="col-md-4 mb-3">
                <div
                  className="card card-light br-3 shadow-sm overflow-hidden d-flex f-colum"
                  style={{ height: "100%" }}
                >
                  <div className="bg-success p-2 text-center">
                    <span className="badge badge-pildora bg-light text-success fw-bold">
                      {" "}
                      Servicio
                    </span>
                  </div>
                  <div
                    className="card-body p-3 d-flex f-colum"
                    style={{ flex: 1 }}
                  >
                    <h4 className="fw-bold mb-2 text-secondary">
                      {servicio.nombre}
                    </h4>
                    <hr className="bg-muted mt-1 mb-2" />
                    <div className="d-flex j-cont-bet align-item mt-2">
                      <span className="text-secondary">Categoría</span>
                      <span className="badge bg-secondary text-light">
                        {servicio.categoria}
                      </span>
                    </div>
                    <div className="d-flex j-cont-bet align-item mt-2">
                      <span className="text-secondary">Precio</span>
                      <span className="fw-bold fs-2 text-accent">
                        ${Number(servicio.precio).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </section>

      <section className="container p-3">
        <h2 className="text-accent fw-bold mb-1">Productos disponibles</h2>
        <p className="mb-3">
          Medicamentos e insumos de venta directa en nuestra clínica.
        </p>
        {cargando ? (
          <p className="text-muted">Cargando productos...</p>
        ) : (
          <Carrusel
            items={productos}
            visibled={3}
            renderItem={(producto) => (
              <div key={producto.id} className="col-md-4 mb-3">
                <div
                  className="card bg-light br-3 shadow-sm overflow-hidden d-flex f-colum"
                  style={{ height: "100%" }}
                >
                  <div className="bg-success p-2 text-center">
                    <span className="badge badge-pildora bg-light text-success fw-bold">
                      Producto
                    </span>
                  </div>
                  <div
                    className="card-body p-3 d-flex f-colum"
                    style={{ flex: 1 }}
                  >
                    <h4 className="fw-bold mb-2 text-dark">
                      {producto.nombre}
                    </h4>
                    <hr className="bg-success mt-1 mb-2" />
                    {producto.precioVenta ? (
                      <div className="d-flex j-cont-bet align-item mt-2">
                        <span className="text-dark fw-bold">Precio</span>
                        <span className="fw-bold fs-2 text-accent">
                          ${Number(producto.precioVenta).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-muted mt-2">Precio no disponible</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </section>

      <section className="container p-3">
        <h2 className="text-accent fw-bold mb-1">
          Consejos y recursos para dueños
        </h2>
        <p className="mb-3">
          Información verificada de fuentes veterinarias internacionales para
          que cuides mejor a tu compañero.
        </p>
        <div className="row">
          {consejos.map((c) => (
            <div key={c.id} className="col-md-6 col-lg-4 mb-3">
              <div
                className="card card-light br-3 overflow-hidden d-flex f-colum"
                style={{ height: "100%" }}
              >
                <img
                  src={c.imagen}
                  alt={c.titulo}
                  className="d-block"
                  style={{ height: "200px", width: "100%", objectFit: "cover" }}
                />
                <div
                  className="card-body p-3 d-flex f-colum"
                  style={{ flex: 1 }}
                >
                  <span className={`${categoriaBadge[c.categoria]} badge mb-2`}>
                    {c.categoria}
                  </span>
                  <h4 className="fw-bold mb-2">{c.titulo}</h4>
                  <p className="mb-3">{c.resumen}</p>
                  <div className="mt-auto">
                    <a
                      href={c.enlace}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline-primary btn-sm"
                    >
                      Leer artículo →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="main-footer main-footer-dark">
        <div className="footer-content">
          <p className="fw-bold text-light mb-1">
            La Casa del Perro{" "}
            <span className="badge bg-light text-primary">
              Clínica Veterinaria
            </span>
          </p>
          <p className="mb-2">
            7ª. Av Sur, 803, Barrio San Nicolas, San Miguel · WhatsApp:
            7712-8139
          </p>
          <p className="mb-2">
            Lunes a Viernes: 8:00am – 12:00pm y 1:00pm – 4:00pm · Sábados:
            8:00am – 12:00pm
          </p>
          <p className="mb-2">Email: lacasadelperrosanmiguel@gmail.com</p>
        </div>
        <p className="footer-copy">
          © 2026 La Casa del Perro. Cuidamos a quienes más quieres.
        </p>
      </footer>
    </>
  );
};

export default Inicio;