"use client";
import { useId, useMemo, useState } from "react";
import { AREAS, AREA_BY_SLUG, normalizeText, type Area } from "@/data/areas";

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

/** Autocompletado de barrios (patrón combobox de ARIA). Funciona con teclado y sin tildes. */
export function AreaCombo({ label, hint, name, defaultSlug, placeholder, onPick, clearOnPick, invalid }: Props) {
  const id = useId();
  const initial = defaultSlug ? AREA_BY_SLUG.get(defaultSlug) : undefined;
  const [text, setText] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const options = useMemo(() => {
    const q = normalizeText(text);
    if (!q) return AREAS.slice(0, 8);
    const starts = AREAS.filter((a) => normalizeText(a.name).startsWith(q));
    const contains = AREAS.filter((a) => !starts.includes(a) && normalizeText(a.name).includes(q));
    return [...starts, ...contains].slice(0, 8);
  }, [text]);

  function pick(a: Area) {
    setSlug(a.slug);
    setText(clearOnPick ? "" : a.name);
    setOpen(false);
    onPick?.(a);
  }

  return (
    <div className="field combo">
      <label htmlFor={id}>{label}{hint && <span className="hint">{hint}</span>}</label>
      <input
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        aria-expanded={open && options.length > 0}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${id}-${options[active].slug}` : undefined}
        aria-invalid={invalid || undefined}
        placeholder={placeholder}
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
      {name && <input type="hidden" name={name} value={slug || (options.length === 1 ? options[0].slug : "")} />}
      {open && options.length > 0 && (
        <ul id={`${id}-list`} role="listbox" className="combo-list" aria-label={label}>
          {options.map((a, i) => (
            <li key={a.slug} id={`${id}-${a.slug}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(a); }}>
              {a.name}<span className="region">{a.region}</span>
            </li>
          ))}
        </ul>
      )}
      {open && text && options.length === 0 && (
        <p className="hint" role="status">No encontramos ese barrio. Probá con la localidad más cercana.</p>
      )}
    </div>
  );
}
