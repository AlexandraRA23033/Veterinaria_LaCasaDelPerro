import { useState } from "react";

export const MASCOTA_INICIAL = {
  nombre: "",
  especie: "",
  raza: "",
  sexo: "",
  edad: "",
  color: "",
  peso: "",
  estaVacunado: false,
  alergias: "",
  enfermedadesPrevias: "",
  vacunas: "",
  observaciones: "",
};

export default function useMascotaForm(valorInicial = MASCOTA_INICIAL) {
  const [form, setForm] = useState(valorInicial);
  const [error, setError] = useState("");

  function handleCampo(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  }

  function resetForm(valores = MASCOTA_INICIAL) {
    setForm(valores);
    setError("");
  }

  function validar() {
    if (!form.nombre?.trim()) { setError("El nombre de la mascota es obligatorio."); return false; }
    if (!form.especie)        { setError("Selecciona la especie."); return false; }
    if (!form.sexo)           { setError("Selecciona el sexo."); return false; }
    return true;
  }

  // Normaliza los datos antes de guardar en IndexedDB
  function getDatosNormalizados() {
    return {
      ...form,
      nombre:   form.nombre.trim(),
      especie:  form.especie.toLowerCase(),
      raza:     form.raza?.trim() || "Mixto",
      color:    form.color?.trim() || "",
      peso:     form.peso ? parseFloat(form.peso) : null,
      edad:     form.edad ? parseInt(form.edad) : null,
    };
  }

  return { form, setForm, error, setError, handleCampo, resetForm, validar, getDatosNormalizados };
}