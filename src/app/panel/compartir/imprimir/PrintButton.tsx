"use client";

export function PrintButton() {
  return <button type="button" className="btn btn-azul" onClick={() => window.print()}>Imprimir</button>;
}
