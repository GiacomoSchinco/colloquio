"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../_components/techList.module.css";

interface Argomento {
  slug: string;
  nome: string;
  ordine: number;
  files: string[];
  totale: number;
  blocchi: number;
  con_follow_up: number;
  priorita: { ALTA: number; MEDIA: number; BASSA: number };
}

interface Indice {
  meta: { totale_domande: number; totale_argomenti: number; aggiornato: string };
  argomenti: Argomento[];
}

export default function ElencoPage() {
  const [indice, setIndice] = useState<Indice | null>(null);
  const [errore, setErrore] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setIndice)
      .catch((e: unknown) => setErrore(e instanceof Error ? e.message : "errore sconosciuto"));
  }, []);

  if (errore) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>⚠️ Impossibile leggere l&apos;elenco: {errore}.</div>
      </div>
    );
  }

  if (!indice) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>Caricamento elenco...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.h1}>📚 Argomenti</h1>
          <p className={styles.subhead}>
            {indice.meta.totale_argomenti} argomenti · {indice.meta.totale_domande} domande ·
            aggiornato {indice.meta.aggiornato}
          </p>
        </div>

        <div className={styles.techNav}>
          {indice.argomenti.map((a) => (
            <Link key={a.slug} href={`/tecnologie/${a.slug}`} className={styles.techCard}>
              <span className={styles.techCardName}>
                {String(a.ordine).padStart(2, "0")}. {a.nome}
              </span>
              <span className={styles.techCardMeta}>
                {a.totale} domande · {a.blocchi} blocchi
                {a.files.length > 1 ? ` · ${a.files.length} file` : ""}
              </span>
              <span className={styles.techCardMeta}>
                🔴 {a.priorita.ALTA ?? 0} · 🟠 {a.priorita.MEDIA ?? 0} · 🟢 {a.priorita.BASSA ?? 0} ·
                💬 {a.con_follow_up}
              </span>
            </Link>
          ))}
        </div>

        <hr className={styles.hr} />
        <div className={styles.footer}>
          Apri un argomento e usa 🖨️ Stampa / PDF per stamparlo da solo.
        </div>
      </div>
    </div>
  );
}
