"use client";
import { useActionState } from "react";
import { addWorkPhoto, removeWorkPhoto, uploadProfilePhoto, type FormState } from "../actions";

function Upload({ action, label, hint }: { action: (s: FormState, f: FormData) => Promise<FormState>; label: string; hint: string }) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, {});
  return (
    <form action={run}>
      <div className="field">
        <label htmlFor={label}>{label}<span className="hint">{hint}</span></label>
        <input id={label} name="photo" type="file" accept="image/*" required
          onChange={(e) => e.currentTarget.form?.requestSubmit()} aria-describedby={`${label}-msg`} />
      </div>
      <noscript><button className="btn btn-chico">Subir</button></noscript>
      <p id={`${label}-msg`} role="status" className={state.error ? "error" : "small"}>
        {pending ? "Subiendo y achicando la foto…" : state.error ?? state.ok ?? ""}
      </p>
    </form>
  );
}

export function Photos({ photoId, photos }: { photoId: string | null; photos: string[] }) {
  return (
    <section className="panel stack" aria-labelledby="fotos" style={{ marginTop: 20 }}>
      <h2 id="fotos">Fotos</h2>
      <div className="row" style={{ alignItems: "flex-start" }}>
        {photoId
          ? <img src={`/api/img/${photoId}?t=1`} alt="Tu foto de perfil" width={96} height={96} className="iman-foto" style={{ width: 96, height: 96 }} />
          : <div className="iman-foto" style={{ width: 96, height: 96 }} aria-hidden="true" />}
        <div style={{ flex: 1, minWidth: 220 }}>
          <Upload action={uploadProfilePhoto} label="Foto de perfil" hint="Una foto tuya, de frente y con buena luz, genera más confianza." />
        </div>
      </div>
      <h3>Trabajos realizados ({photos.length} de 8)</h3>
      {photos.length > 0 ? (
        <ul className="galeria">
          {photos.map((id) => (
            <li key={id}>
              <img src={`/api/img/${id}?t=1`} alt="Trabajo realizado" loading="lazy" width={200} height={200} />
              <form action={removeWorkPhoto}>
                <input type="hidden" name="imageId" value={id} />
                <button className="linkbtn small">Borrar foto</button>
              </form>
            </li>
          ))}
        </ul>
      ) : <p className="muted">Subí fotos de trabajos que hiciste: un antes y después convence más que cualquier descripción.</p>}
      {photos.length < 8 && <Upload action={addWorkPhoto} label="Agregar foto de un trabajo" hint="JPG o PNG de hasta 8 MB. La achicamos sola para que cargue rápido." />}
    </section>
  );
}
