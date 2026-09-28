# Måling og markedsføring

## Nåværende status

CV-byggeren er et fungerende produktutkast med PDF-eksport. PostHog-integrasjonen er implementert, men **sender ingenting før en ekte prosjektkobling er konfigurert og brukeren samtykker**. Det finnes ingen fabrikkerte besøkstall, opptak eller salg. Stripe og Google Search Console er ikke tilkoblet.

## Analyseverktøy

PostHog EU er valgt som et enkelt utgangspunkt for hendelser og traktanalyse. Opprett et prosjekt i brukerens konto, bruk den offentlige prosjekt­nøkkelen `phc_...` (ikke personlig API-nøkkel), og sett `VITE_POSTHOG_KEY` og `VITE_POSTHOG_HOST=https://eu.i.posthog.com` ved bygging. Start med gratisnivået dersom dagens grenser passer; sjekk gjeldende vilkår og databehandleroppsett i kontoen. Kontoopprettelse og aksept av vilkår må eieren gjøre.

Koden bruker et lite, eksplisitt HTTP-oppsett. Automatisk skjemafangst, session replay, heatmaps og innsamling av unntakstekst er ikke aktivert. Brukernes CV-er er særlig uegnet for opptak av skjermen. Feil registreres som kategorier, uten innholdet i feilen.

Det sendes ingen CV-tekst, navn, e-post, telefon, stillingstitler, full URL, rå UTM-tekst eller rå referrer. Session-ID er tilfeldig, begrenset til fanens sesjon og opprettes først etter samtykke. Det er ikke et mål på unike personer på tvers av enheter. IP-geolokalisering er slått av i hendelsene; leverandøren mottar likevel nettverkstrafikk og må vurderes som databehandler. Global Privacy Control og Do Not Track respekteres. Samtykke kan trekkes tilbake i bunnteksten.

## Hendelser

Alle navn har prefikset `cekor_`.

| Hendelse | Hva den faktisk betyr |
|---|---|
| page_view | Samtykkende besøk åpnet siden / aktiverte samtykke |
| builder_started | Første faktiske feltendring i denne sideøkten |
| step_view | Et av de fem stegene åpnes |
| step_continue | Brukeren går videre til neste steg; ikke bevis på at alle felter er fullført |
| example_loaded | Eksempeldata er lastet; filtrer dette bort fra reell bruksanalyse |
| design_changed | Brukeren velger mal eller farge |
| export_clicked | Eksportknappen trykkes |
| validation_error | Eksport stanses fordi navn mangler |
| pdf_started | Brukeren bekrefter nedlasting |
| pdf_generated | PDF ble generert og nettlesernedlasting startet; ikke bevis på at filen ble lagret |
| pdf_error | PDF-genereringen feilet |
| storage_error | Valgfri lokal lagring feilet |
| app_error | En ubehandlet teknisk feil oppstod, uten rå feilmelding |

Tillatte egenskaper: steg 0–4, mal (modern/classic/compact), mobil/desktop, en kort tillatt kanalliste og en kort kampanjeliste. Analysen omfatter bare samtykkende brukere og kan derfor være skjev. Ikke presenter den som alle besøkende.

## Dashboard som skal opprettes etter kobling

1. **Bruk:** antall sesjoner med page_view, builder_started og pdf_generated siste 7/30 dager. Filtrer bort egne tester og example_loaded-sesjoner.
2. **Trakt:** page_view → builder_started → export_clicked → pdf_started → pdf_generated, samme session-ID, 1 times konverteringsvindu. Vis frafall per steg og del etter device/channel.
3. **Skjemaflyt:** step_view og step_continue per steg. Hopp over steg er tillatt, så dette er diagnostikk, ikke en obligatorisk sekvens.
4. **Feil:** pdf_error / pdf_started, validation_error / export_clicked og app_error per dag. Undersøk hendelser først når utvalget er stort nok til å være meningsfullt.
5. **Anskaffelse:** fullføringsgrad per kanal og kampanje, ikke bare besøkstall.

Ved Stripe-lansering skal kjøpshendelser komme fra en signaturverifisert, idempotent webhook på serveren. Ikke regn besøket på en «takk»-side som bevis på betaling. Legg til checkout_started, payment_succeeded og payment_failed først når den reelle flyten finnes. Hold omsetning, refusjoner, avgift og netto bidrag adskilt.

## SEO

Bygget forhåndsrenderer faktisk makedonsk innhold i HTML og inneholder beskrivende title/description, canonical, Open Graph-tekst, WebApplication-data, favicon, robots.txt og sitemap.xml. PDF-biblioteket lastes først ved eksport; skrifter ligger lokalt i pakken.

Privat testversjon har noindex og blokkert robots.txt med tomt sitemap. Det gir **ingen organisk Google-trafikk ennå**. For offentlig lansering: avklar endelig domene, oppdater origin i scripts/seo.mjs, gjør siden offentlig, bygg med PUBLIC_LAUNCH=true, koble Search Console og send sitemap. Ikke skru på indeksering av en privat eller uferdig betalingstjeneste.

Search Console krever tilgang til den virkelige domeneeierens eiendom. Bruk den til å følge søkefraser, visninger, klikk, CTR og indekseringsfeil. Den viser ikke automatisk kjøp. Koble ikke tilfeldige konti eller oppdiktede verifikasjonstagger.

## Første markedstest

- Primær intensjon: «CV на македонски», «CV за работа», «креирај CV». Tilby hjelp for førstegangsjobbsøkere. Vær ærlig om at malene ikke er Europass.
- Første trafikk: relevante karrieresentre, studentmiljøer og jobbsøkerfellesskap, med tillatelse til å dele. Ingen meldinger eller innlegg er sendt.
- Tilpass innhold etter faktiske Search Console-søk. Ikke masseproduser tynne by- eller yrkessider.
- Bruk `utm_source` fra google/bing/facebook/instagram/linkedin/newsletter og kampanje fra mk-search-cv/mk-students/mk-jobs/mk-organic-guide. Andre fritekstverdier lagres ikke.
- Ikke start betalte annonser før et utgiftsbudsjett er avtalt og lønnsomhetsgrensen er beregnet. Ingen annonser er bestilt.

Eksempel på sporbart testlink: `/?utm_source=facebook&utm_campaign=mk-students`. Del først etter offentlig lansering.

## Beslutningsregler

Arbeid først med feil som hindrer nedlasting. Deretter det største dokumenterte frafallet. Endre én viktig ting om gangen. Med lite trafikk er direkte brukertesting ofte mer verdifullt enn A/B-testing. Betalt skalering krever observert positivt bidrag etter gebyrer, refusjoner og anskaffelse. Gratis PDF-fullføring dokumenterer produktbruk, ikke betalingsvilje.
