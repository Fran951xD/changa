"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { AREA_BY_SLUG, areasOf, normalizeText, type Area } from "@/data/areas";
import { PROVINCES, PROVINCE_BY_SLUG } from "@/data/provinces";

type Props = {
  label: string;
  hint?: string;
  name?: string; // si se pasa, envía el slug elegido en un input oculto
  defaultSlug?: string;
  placeholder?: string;
  onPick?: (area: Area) => void;
  clearOnPick?: boolean;
  invalid?: boolean;
};

/**
 * Primero la provincia, después la ciudad o barrio filtrado a esa provincia (patrón combobox de ARIA).
 * Funciona con teclado y sin tildes.
 */
export function AreaCombo({ label, hint, name, defaultSlug, placeholder, onPick, clearOnPick, invalid }: Props) {
  const id = useId();
  const initial = defaultSlug ? AREA_BY_SLUG.get(defaultSlug) : undefined;
  const [province, setProvince] = useState(initial?.province ?? "");
  const [text, setText] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const pool = useMemo(() => (province ? areasOf(province) : []), [province]);

  const options = useMemo(() => {
    const q = normalizeText(text);
    if (!q) return pool.slice(0, 8);
    const starts = pool.filter((a) => normalizeText(a.name).startsWith(q));
    const contains = pool.filter((a) => !starts.includes(a) && normalizeText(a.name).includes(q));
    return [...starts, ...contains].slice(0, 8);
  }, [text, pool]);

  // Lo que se envía: lo elegido de la lista, o lo escrito si coincide exacto ("Flores" aunque exista "Floresta"),
  // o la única sugerencia. Si no se puede resolver, el navegador frena el envío con un aviso en vez de perder la zona.
  const exact = pool.find((a) => normalizeText(a.name) === normalizeText(text));
  const resolved = slug || exact?.slug || (options.length === 1 ? options[0].slug : "");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!name) return;
    inputRef.current?.setCustomValidity(text.trim() && !resolved ? "Elegí tu ciudad o barrio de la lista." : "");
  }, [name, text, resolved]);

  function pick(a: Area) {
    setSlug(a.slug);
    setText(clearOnPick ? "" : a.name);
    setOpen(false);
    onPick?.(a);
  }

  const provinceName = PROVINCE_BY_SLUG.get(province)?.name;
  return (
    <div className="field area-pair">
      <div className="field">
        <label htmlFor={`${id}-prov`}>Provincia</label>
        <select id={`${id}-prov`} value={province} onChange={(e) => {
          setProvince(e.target.value); setText(""); setSlug(""); setActive(0);
          if (e.target.value) setTimeout(() => inputRef.current?.focus(), 0);
        }}>
          <option value="">Elegí tu provincia</option>
          {PROVINCES.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
        </select>
      </div>
      <div className="combo">
        <label htmlFor={id}>{label}{hint && <span className="hint">{hint}</span>}</label>
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          disabled={!province}
          aria-expanded={open && options.length > 0}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${id}-${options[active].slug}` : undefined}
          aria-invalid={invalid || undefined}
          placeholder={province ? placeholder ?? `Ciudad o barrio de ${provinceName}` : "Primero elegí la provincia"}
          value={text}
          onChange={(e) => { setText(e.target.value); setSlug(""); setOpen(true); setActive(0); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, options.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
            else if (e.key === "Enter" && open && options[active]) { e.preventDefault(); pick(options[active]); }
            else if (e.key === "Escape") setOpen(false);
          }}
        />
        {name && <input type="hidden" name={name} value={resolved} />}
        {open && options.length > 0 && (
          <ul id={`${id}-list`} role="listbox" className="combo-list" aria-label="Sugerencias">
            {options.map((a, i) => (
              <li key={a.slug} id={`${id}-${a.slug}`} role="option" aria-selected={i === active}
                onMouseDown={(e) => { e.preventDefault(); pick(a); }}>
                {a.name}{a.region !== provinceName && <span className="region">{a.region}</span>}
              </li>
            ))}
          </ul>
        )}
        {open && text && options.length === 0 && (
          <p className="hint" role="status">No encontramos esa ciudad en {provinceName}. Probá con la más cercana.</p>
        )}
      </div>
    </div>
  );
}
