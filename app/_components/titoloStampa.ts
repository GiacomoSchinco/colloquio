/**
 * Il nome proposto quando si salva il PDF e' il titolo del documento: senza
 * questo il file uscirebbe con il titolo generico del sito invece che con
 * l'argomento aperto.
 */
export function impostaTitoloStampa(argomento: string): void {
  const pulito = argomento.replace(/[\\/:*?"<>|]/g, "-");
  document.title = `Colloquio - ${pulito}`;
}
