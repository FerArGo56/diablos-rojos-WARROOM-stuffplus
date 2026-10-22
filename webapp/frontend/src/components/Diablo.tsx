/** Mascota de los Diablos Rojos del México (uso autorizado por el club), a partir de un PNG sin fondo.
 *  Por defecto solo la cabeza (logo de la barra y botones); `full` = cuerpo completo (ilustración de Hoy). */
export function Diablo({ size = 80, full = false }: { size?: number; full?: boolean }) {
  return full
    ? <img src="/mascota-cuerpo.png" height={size} alt="" aria-hidden="true" className="mascota mascota-cuerpo" />
    : <img src="/mascota-cabeza.png" width={size} height={size} alt="" aria-hidden="true" className="mascota" />;
}
