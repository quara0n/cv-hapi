# Čekor: avgrenset salgspilot

## Beslutning

Gratis CV/PDF beholdes. Betalingshypotesen er 10 NOK én gang for hjelp til en konkret jobbsøknad: faktabasert AI-skriving, tilpasning til annonse og makedonsk/engelsk tekst. Dette er ikke validert betalingsvilje. Gratis konkurrenter tilbyr allerede AI; vår flyt må gi et resultat målgruppen foretrekker.

## Implementert nå

- Engelsk og makedonsk søknadsflyt: annonse som referanse, egne notater om arbeidsgiverens behov, opptil tre ekte eksempler, eget motivasjonsavsnitt og redigerbart brev.
- Et samlet PDF-dokument med CV først og søknadsbrev etterpå. Ingen erfaring fjernes eller diktes opp automatisk.
- Gratis grunnprodukt, og ærlig merking av fast mal, inaktiv AI og inaktiv betaling. Språkvelgeren oversetter ikke kandidatens tekst.
- Egne `/mk/` og `/en/` sider med forhåndsrendret innhold, canonical og hreflang. Indeksering fortsatt av mens siden er privat.
- Hendelser for søknadsstart, valideringsfeil, utkast, PDF og uttrykt interesse for betalt AI. Ingen CV-tekst, annonsetekst eller fritekst sendes til analyse. Ingen øktopptak. GA4 G-JYTW6J3BRZ er opprettet og kobles til ved lansering. Måling lastes bare etter samtykke på produksjonsdomenet. Utvidet automatisk måling er slått av. PostHog er ikke aktivert.

## Før offentlig salg og annonser

1. Koble til AI via server med hemmelig nøkkel, tydelig samtykke til behandling, bruksgrenser og kostnadstak. Ikke legg nøkkelen i nettleseren. OpenAI Developers-pluginen er etterspurt for nøkkeloppsett. Ingen AI-kall finnes i denne prototypen.
2. Test kvalitet mot NoBsResume med samme oppdiktede opplysninger. Få en person som behersker makedonsk til å vurdere språk og tre lokale brukere til å prøve hele flyten. Bevar opplysninger; ikke legg til grader, tall, arbeidsgivere eller ferdigheter kandidaten ikke har oppgitt.
3. Koble til Stripe-konto og en reell engangsbetaling på 10 NOK. Verifiser betaling på server med signert webhook; ikke stol på retur-URL. Avklar lokal prisvisning, virksomhetsinformasjon, vilkår, refusjon, avgifter og kontaktadresse. Brukeren fullfører kontoopprettelse og finansiell aktivering.
4. Koble til PostHog og serverbekreftede kjøpshendelser. Ikke tell PDF eller knappen «ville vurdert å betale» som salg. Samtykkebasert analyse måler bare et utvalg av besøkende; Stripe er kilden for faktiske betalinger.
5. Gjør siden offentlig, aktiver `PUBLIC_LAUNCH=true`, publiser og kontroller at en utlogget besøkende kan fullføre. Privat eieradgang kan ikke brukes som annonsemål. Search Console-verifisering og sitemap-innsending gjenstår.
6. Sett opp Google Ads i brukerens konto med godkjent totalramme. Ingen kampanje er opprettet eller startet.

## Google Ads-utkast

Godkjent læringsbudsjett: maksimalt 300 NOK totalt (brukerens instruks 28. september 2026). Bruk en kampanjetype som støtter sluttdato og totalbudsjett der tilgjengelig; ellers må dagbudsjett, sluttdato og faktisk forbruk følges opp. Et Google Ads-dagbudsjett er ikke et hardt dagstak. Ingen automatisk videreføring eller påfyll.

- Kun Google-søk. Ikke Display, Performance Max eller søkepartnere i første test.
- Nord-Makedonia, lokasjonsvalg «tilstede i eller regelmessig i» området, ikke bare interesse for landet.
- Start med eksakt samsvar og frasesamsvar. Ingen brede søkeord i første test. Makedonsk annonse og landingsside; undersøk språkvalgene i kontoen slik at personer med engelsk nettleser ikke utelukkes unødig.
- Endelig URL: `https://cv-hapi.quara0n.chatgpt.site/mk/?utm_source=google&utm_medium=cpc&utm_campaign=mk-search-cv` først etter offentlig lansering.
- Søkeord: `[изработка на cv]`, `"направи cv"`, `[cv на македонски]`, `"мотивациско писмо"`. Ingen søkevolum eller klikkpriser er verifisert; sjekk Keyword Planner før aktivering. Eksakt samsvar kan også treffe nære varianter.
- Negative ord for betalt pakke: `работни места`, `огласи за работа`, `europass`, `word template`, `download word`. Se faktiske søketermer før listen utvides. «Gratis» må vurderes separat fordi grunnproduktet er gratis.
- Annonseutkast står i `ads-pilot.csv`. De lover ikke AI eller automatisering før funksjonen fungerer. Planlagt produktpris skal fremgå på landingssiden; ikke kjør annonser til en kjøpsflyt som ikke finnes.

## Måling og økonomi

Følg: annonseklikk → besøk → CV-start → søknadsstart → utkast → betalingsstart → serverbekreftet kjøp → levert PDF. Registrer feil separat. Annonseklikk, privat forhåndsvisning, eksempeldata og interesseklikk er ikke kunder.

Ved 10 NOK brutto og illustrativt 7 NOK igjen etter variable kostnader blir maksimal lønnsom klikkpris:

| Kjøp per klikk | Maksimal CPC |
| --- | --- |
| 2 % | 0,14 NOK |
| 5 % | 0,35 NOK |
| 10 % | 0,70 NOK |

Dette er regneeksempler, ikke prognoser. Faktisk bidrag må beregnes med betalingsgebyr, AI, avgifter og refusjoner. Ved 1 NOK per klikk og 7 NOK bidrag kreves over 14 % kjøp per klikk for å dekke annonsene. Google Ads kan derfor være nyttig til læring uten å være en lønnsom salgskanal til denne prisen.

Stopp ved godkjent budsjettgrense eller feil som hindrer betaling/levering. Vurder søketermer og frafall før mer penger brukes. Null salg i en liten test er et varsel, ikke sikkert bevis på null etterspørsel. Fortsett bare hvis kundene foretrekker resultatet og kjøpskostnaden kan forsvares; ikke legg til abonnement eller øk prisen uten brukerens beslutning.
