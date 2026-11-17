"use client";

/** Formulario GET que se aplica solo al cambiar un filtro. Sin JS, queda el botón "Aplicar". */
export function AutoSubmitForm({ children, ...props }: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form {...props} onChange={(e) => e.currentTarget.requestSubmit()}>
      {children}
    </form>
  );
}
