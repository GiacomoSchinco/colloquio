"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./techList.module.css";
import { impostaTitoloStampa } from "./titoloStampa";

type Priorita = "ALTA" | "MEDIA" | "BASSA";

interface DomandaV2 {
  id: string;
  priorita: Priorita;
  domanda: string;
  risposta: string;
  parole_chiave: string[];
  follow_up?: { domanda: string; risposta: string };
}

interface BloccoV2 {
  nome: string;
  domande: DomandaV2[];
}

interface FileTecnologiaV2 {
  meta: { tecnologia: string; slug: string; schema: number; aggiornato: string; totale_domande: number };
  argomenti: BloccoV2[];
}

interface Riga extends DomandaV2 {
  blocco: string;
  tecnologia: string;
  tecnologiaSlug: string;
  numero: number;
}

const PRIORITA_ORDER: Priorita[] = ["ALTA", "MEDIA", "BASSA"];

const PRIORITA_META: Record<Priorita, { label: string; emoji: string }> = {
  ALTA: { label: "Alta", emoji: "🔴" },
  MEDIA: { label: "Media", emoji: "🟠" },
  BASSA: { label: "Bassa", emoji: "🟢" },
};

function classePriorita(p: Priorita) {
  return styles[`badge${p}` as keyof typeof styles] ?? styles.badge;
}

/**
 * Una pagina per argomento. L'argomento e' definito in index.json e puo' unire
 * piu' file (es. HTML + JavaScript + TypeScript): qui si caricano tutti i suoi
 * JSON e si mostrano in sequenza, con l'etichetta della tecnologia su ogni blocco.
 * Gli indirizzi vecchi per singolo file vengono reindirizzati all'argomento.
 */
export default function TechList({ slug }: { slug: string }) {
  const router = useRouter();
  const storageKey = `colloquio_studiate_${slug}`;

  const [files, setFiles] = useState<FileTecnologiaV2[] | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [nomeArgomento, setNomeArgomento] = useState<string | null>(null);

  const [filtroPriorita, setFiltroPriorita] = useState<"tutte" | Priorita>("tutte");
  const [filtroBlocco, setFiltroBlocco] = useState<string>("tutti");
  const [mostraSoloNonStudiate, setMostraSoloNonStudiate] = useState(false);
  const [followUpAperti, setFollowUpAperti] = useState<Set<string>>(new Set());
  const [showTop, setShowTop] = useState(false);
  const [studiate, setStudiate] = useState<Set<string>>(() => {
    try {
      const salvato = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
      return salvato ? new Set<string>(JSON.parse(salvato)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  useEffect(() => {
    let annullato = false;

    (async () => {
      try {
        const resIndice = await fetch("/data/index.json");
        if (!resIndice.ok) throw new Error(`index.json non disponibile (HTTP ${resIndice.status})`);
        const idx = await resIndice.json();

        const argomento = (idx.argomenti ?? []).find((a: { slug: string }) => a.slug === slug);
        let daCaricare: string[];

        if (argomento) {
          daCaricare = argomento.files;
          if (!annullato) setNomeArgomento(argomento.nome);
        } else {
          const singolo = (idx.tecnologie ?? []).find((t: { slug: string }) => t.slug === slug);
          if (singolo?.argomento) {
            router.replace(`/tecnologie/${singolo.argomento}`);
            return;
          }
          throw new Error(`argomento "${slug}" non trovato`);
        }

        const caricati = await Promise.all(
          daCaricare.map(async (s) => {
            const res = await fetch(`/data/${s}.json`);
            if (!res.ok) throw new Error(`${s}.json non disponibile (HTTP ${res.status})`);
            return (await res.json()) as FileTecnologiaV2;
          }),
        );
        if (!annullato) setFiles(caricati);
      } catch (e: unknown) {
        if (!annullato) setErrore(e instanceof Error ? e.message : "errore sconosciuto");
      }
    })();

    return () => {
      annullato = true;
    };
  }, [slug, router]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (nomeArgomento) impostaTitoloStampa(nomeArgomento);
  }, [nomeArgomento]);

  const toggleStudiata = useCallback(
    (id: string) => {
      setStudiate((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        try {
          localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch {}
        return next;
      });
    },
    [storageKey],
  );

  const toggleFollowUp = useCallback((id: string) => {
    setFollowUpAperti((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const resetStudiate = useCallback(() => {
    setStudiate(new Set());
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  const righe = useMemo<Riga[]>(() => {
    const out: Riga[] = [];
    let n = 0;
    for (const f of files ?? []) {
      for (const b of f.argomenti) {
        for (const d of b.domande) {
          out.push({
            ...d,
            blocco: b.nome,
            tecnologia: f.meta.tecnologia,
            tecnologiaSlug: f.meta.slug,
            numero: ++n,
          });
        }
      }
    }
    return out;
  }, [files]);

  const gruppi = useMemo(() => {
    const multi = (files?.length ?? 0) > 1;
    return (files ?? [])
      .flatMap((f) =>
        f.argomenti.map((b) => {
          const key = `${f.meta.slug}::${b.nome}`;
          const label = multi ? `${f.meta.tecnologia} · ${b.nome}` : b.nome;
          const righeBlocco = righe
            .filter((r) => r.tecnologiaSlug === f.meta.slug && r.blocco === b.nome)
            .filter((r) => filtroPriorita === "tutte" || r.priorita === filtroPriorita)
            .filter((r) => !mostraSoloNonStudiate || !studiate.has(r.id))
            .sort((a, c) => {
              const pa = PRIORITA_ORDER.indexOf(a.priorita);
              const pc = PRIORITA_ORDER.indexOf(c.priorita);
              if (pa !== pc) return pa - pc;
              return a.numero - c.numero;
            });
          return { key, label, righe: righeBlocco };
        }),
      )
      .filter((g) => g.righe.length > 0)
      .filter((g) => filtroBlocco === "tutti" || g.key === filtroBlocco);
  }, [files, righe, filtroPriorita, filtroBlocco, mostraSoloNonStudiate, studiate]);

  if (!files && !errore) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>Caricamento domande...</div>
      </div>
    );
  }

  if (errore) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <p>⚠️ Impossibile caricare le domande: {errore}.</p>
          <p>
            <Link href="/tecnologie" className={styles.homeLink}>
              ← Torna all&apos;elenco
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const caricati = files as FileTecnologiaV2[];
  const titolo = caricati.map((f) => f.meta.tecnologia).join(" · ");
  const sottotitolo =
    caricati.length === 1
      ? `${caricati[0].meta.totale_domande} domande · ${caricati[0].argomenti.length} blocchi · aggiornato ${caricati[0].meta.aggiornato}`
      : caricati.map((f) => `${f.meta.tecnologia} (${f.meta.totale_domande})`).join(" · ");

  const totale = righe.length;
  const percentuale = totale > 0 ? Math.round((studiate.size / totale) * 100) : 0;
  const visibili = gruppi.reduce((acc, g) => acc + g.righe.length, 0);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <Link href="/tecnologie" className={styles.homeLink}>
              ← Elenco argomenti
            </Link>
            <button className={styles.printBtn} onClick={() => window.print()}>
              🖨️ Stampa / PDF
            </button>
          </div>
          <h1 className={styles.h1}>📘 {titolo}</h1>
          <p className={styles.subhead}>{sottotitolo}</p>
        </div>

        <div className={styles.stats}>
          {PRIORITA_ORDER.map((p) => {
            const count = righe.filter((r) => r.priorita === p).length;
            const done = righe.filter((r) => r.priorita === p && studiate.has(r.id)).length;
            return (
              <button
                key={p}
                className={`${styles.statCard} ${filtroPriorita === p ? styles.statCardActive : ""}`}
                onClick={() => setFiltroPriorita(filtroPriorita === p ? "tutte" : p)}
                title={`Filtra per priorità ${PRIORITA_META[p].label}`}
              >
                <span className={styles.statEmoji}>{PRIORITA_META[p].emoji}</span>
                <span className={styles.statLabel}>{PRIORITA_META[p].label}</span>
                <span className={styles.statCount}>
                  {done}/{count}
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.progressBar}>
          <div className={styles.progressInfo}>
            <span>
              📚 Studiate: <strong>{studiate.size}</strong> / {totale}
            </span>
            <span className={styles.progressPercent}>{percentuale}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${percentuale}%` }} />
          </div>
          {studiate.size > 0 && (
            <button className={styles.resetBtn} onClick={resetStudiate}>
              Azzera progresso
            </button>
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>🎚️ Blocco</label>
            <div className={styles.filterPills}>
              <button
                className={filtroBlocco === "tutti" ? styles.pillActive : styles.pill}
                onClick={() => setFiltroBlocco("tutti")}
              >
                Tutti
              </button>
              {gruppi.map((g) => (
                <button
                  key={g.key}
                  className={filtroBlocco === g.key ? styles.pillActive : styles.pill}
                  onClick={() => setFiltroBlocco(g.key)}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlGroup}>
            <label className={`${styles.controlLabel} ${styles.checkLabel}`}>
              <input
                type="checkbox"
                checked={mostraSoloNonStudiate}
                onChange={(e) => setMostraSoloNonStudiate(e.target.checked)}
                className={styles.checkbox}
              />
              Solo non studiate
            </label>
          </div>
        </div>

        {visibili === 0 && (
          <div className={styles.emptyState}>Nessuna domanda corrisponde ai filtri selezionati.</div>
        )}

        {gruppi.map((g) => (
          <div key={g.key} className={styles.blockGroup}>
            <h2 className={styles.blockTitle}>
              {g.label}
              <span className={styles.blockTitleCount}>({g.righe.length} domande)</span>
            </h2>

            <div className={styles.cardList}>
              {g.righe.map((d) => {
                const isStudiata = studiate.has(d.id);
                const followUpAperto = followUpAperti.has(d.id);
                const badge = PRIORITA_META[d.priorita];

                return (
                  <article
                    key={d.id}
                    className={`${styles.card} ${isStudiata ? styles.cardDone : ""}`}
                  >
                    <div className={styles.printCategoryLabel}>
                      {badge.emoji} {badge.label} · {d.tecnologia} · {d.blocco} &nbsp;·&nbsp; {d.id}
                    </div>

                    <div className={styles.cardHeader}>
                      <div className={styles.cardBadges}>
                        <span className={`${styles.badge} ${classePriorita(d.priorita)}`}>
                          {badge.emoji} {badge.label}
                        </span>
                        <span className={styles.badgeArgomento}>{d.blocco}</span>
                      </div>
                      <div className={styles.cardRight}>
                        <span className={styles.cardNum}>#{d.numero}</span>
                        <button
                          className={`${styles.checkBtn} ${isStudiata ? styles.checkBtnDone : ""}`}
                          onClick={() => toggleStudiata(d.id)}
                          title={isStudiata ? "Segna come non studiata" : "Segna come studiata"}
                        >
                          {isStudiata ? "✓ Studiata" : "○ Da studiare"}
                        </button>
                      </div>
                    </div>

                    <div className={styles.questionText}>❓ {d.domanda}</div>

                    <div className={styles.definition}>
                      <span className={styles.definitionLabel}>📖 Risposta</span>
                      <p className={styles.definitionText}>{d.risposta}</p>
                    </div>

                    {d.parole_chiave.length > 0 && (
                      <div className={styles.keywords}>
                        <span className={styles.keywordsLabel}>🔑 Parole chiave</span>
                        <div className={styles.keywordChips}>
                          {d.parole_chiave.map((k) => (
                            <span key={k} className={styles.keywordChip}>
                              {k}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {d.follow_up && (
                      <div className={styles.followUp}>
                        <button
                          className={styles.followUpToggle}
                          onClick={() => toggleFollowUp(d.id)}
                          aria-expanded={followUpAperto}
                        >
                          {followUpAperto ? "🙈 Nascondi follow-up" : "💬 Mostra follow-up probabile"}
                        </button>
                        <div
                          className={`${styles.followUpContent} ${
                            !followUpAperto ? styles.followUpHidden : ""
                          }`}
                        >
                          <p className={styles.followUpQuestion}>{d.follow_up.domanda}</p>
                          <p className={styles.followUpAnswer}>→ {d.follow_up.risposta}</p>
                        </div>
                      </div>
                    )}

                    <div className={styles.printNotes}>
                      <div className={styles.printNotesLabel}>📝 Appunti</div>
                      <div className={styles.printNotesLines} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}

        <hr className={styles.hr} />
        <div className={styles.footer}>
          {totale} domande · {titolo} · schema 2
        </div>
      </div>

      {showTop && (
        <button
          className={styles.backToTopBtn}
          aria-label="Torna all'inizio"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ↑
        </button>
      )}
    </div>
  );
}
