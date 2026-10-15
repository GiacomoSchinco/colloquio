# Colloquio — domande per colloqui tecnici

Raccolta di domande e risposte per preparare colloqui da sviluppatore, con un'app per studiarle e stamparle in PDF.

## Come è organizzato

```
public/data/
  index.json          catalogo: argomenti, ordine di studio, conteggi
  angular.json        un file per argomento
  csharp.json
  dotnet.json
  java.json
  react.json
  ...
app/
  tecnologie/page.tsx         elenco degli argomenti (l'unica pagina di ingresso)
  tecnologie/[slug]/page.tsx  la pagina del singolo argomento (stampabile)
  _components/TechList.tsx    la vista riusata dalle pagine
```

`/` rimanda a `/tecnologie` e `/tecnologia/<slug>` rimanda a `/tecnologie/<slug>`, così i vecchi link continuano a funzionare (vedi `next.config.ts`).

L'ordine di studio e la suddivisione in argomenti stanno in `index.json`: le pagine lo leggono, quindi **aggiungere un file in `public/data` non richiede modifiche al codice**.

## Formato di un file

```json
{
  "meta": { "tecnologia": "Java", "slug": "java", "schema": 2, "versione": 1,
            "aggiornato": "2026-10-14", "totale_domande": 54 },
  "argomenti": [
    {
      "nome": "Fondamentali",
      "domande": [
        {
          "id": "java-001",
          "priorita": "ALTA",
          "domanda": "…",
          "risposta": "…",
          "parole_chiave": ["…"],
          "follow_up": { "domanda": "…", "risposta": "…" }
        }
      ]
    }
  ]
}
```

- `priorita` vale `ALTA`, `MEDIA` o `BASSA`
- gli id sono progressivi per file (`java-001`) e vengono rinumerati dagli script di manutenzione
- il follow-up è opzionale ma tutte le domande attuali lo hanno

## Comandi

```bash
npm install
npm run dev      # sviluppo su http://localhost:3000
npm run build    # build di produzione
npm run start    # avvia la build
npm run lint
```

## La stampa

Ogni argomento è una pagina: apri l'argomento, premi **🖨️ Stampa / PDF** e salvi il PDF.

La stampa è tarata su A4 — una domanda per foglio, con lo spazio per gli appunti — e il follow-up viene mostrato sempre, anche se a schermo era chiuso.

## Aggiungere o unire argomenti

- **Un argomento nuovo**: aggiungi il JSON in `public/data` e la voce corrispondente nella lista degli argomenti dello script che genera `index.json`.
- **Unire più temi in una pagina sola**: nella stessa lista, un argomento può elencare più file (per esempio `HTML, JavaScript e TypeScript` unisce `html-css`, `javascript` e `typescript`).
- Ogni file deve comparire in **un solo** argomento: così studiando non ripeti lo stesso tema in due pagine.
