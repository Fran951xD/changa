"use client";
import { useEffect } from "react";

export function ViewBeacon({ slug }: { slug: string }) {
  useEffect(() => { navigator.sendBeacon?.("/visita", slug); }, [slug]);
  return null;
}
