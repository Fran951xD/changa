"use client";
import dynamic from "next/dynamic";
import type { Pin } from "./ResultsMap";

const ResultsMap = dynamic(() => import("./ResultsMap"), {
  ssr: false,
  loading: () => <div className="mapa" role="status" style={{ display: "grid", placeItems: "center" }}>Cargando mapa…</div>,
});

export function MapLoader(props: { pins: Pin[]; center: { lat: number; lng: number } }) {
  return <ResultsMap {...props} />;
}
