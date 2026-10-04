# CV Hapi Macedonian video — production record

Prepared 4 October 2026. The original white/slate/blue product-demo video is composed in vertical 1080×1920 and a separately arranged 1080×1350 feed version, 24 fps. Current timeline is 20 seconds, with a final-card extension if the exported narration needs it. Silent previews exist; the final voiced exports are pending a local ElevenLabs audio file. Nothing has been posted or launched as a paid ad.

## Script and storyboard

The voice script deliberately spells CV, PDF and the brand phonetically for Macedonian pronunciation:

> Запознај го Си Ви Хапи. Направи јасно си ви и преземи пе де еф бесплатно. Веќе имаш си ви? Добиј предлози од вештачка интелигенција за две британски фунти, еднократно. Спореди ги верзиите и избери ги измените. Без претплата. Си Ви Хапи. Твојот следен чекор.

| Time | Actual visual | Macedonian headline / offer |
|---|---|---|
| 0–1.7 s | Fictional CV in the real builder | Твоето CV. Појасно. |
| 1.7–5.5 s | Readable CV and builder crop | Направи CV. Преземи PDF. Бесплатно. Без регистрација. |
| 5.5–11.5 s | Real completed AI review and editable fictional profile | Веќе имаш CV? Подобри го. Една AI-проверка — £2 еднократно. |
| 11.5–15 s | Real original/revised wording comparison | Ти ги избираш измените. Спореди. Провери. Зачувај. |
| 15–20 s | Brand card, complete price, URL and action | CV Hapi. Твојот следен чекор. Бесплатно CV + PDF. AI-проверка £2 еднократно. Без претплата. Почни на cvhapi.com. |

Burned-in captions explain the offer with sound off. Every scene says “Скратено демо · измислен пример”. The actual recorded review took about 81 seconds, returned HTTP 200 and delivered one anchored wording edit. It removed vague “Креативна” from the fictional marketing profile; no work experience, qualification or metric was invented. The demo does not portray a real paid checkout or a three-second AI response.

## Audio and production

ElevenLabs: Elena — Playful, Bright, Bouncy; model Eleven v4; Macedonian override; stability 0.5; similarity 0.75; MP3 44.1 kHz / 128 kbps. A generated result with two takes is saved in account history, 257 included credits used, 39,743 remaining. Active Starter displayed commercial speech rights. The owner completed account setup and purchase; the agent did not subscribe or upgrade.

In-app browser download attempts did not produce a local file. Owner-assisted export requested to `marketing/video/voiceover-mk.mp3`. Do not label a silent preview as a voiced final. Pronunciation and exact narration alignment must be checked once audio is available; native-language review is still useful before public publication.

Renderer: `marketing/video/render_video.py`, Pillow typography and actual UI crops, restrained motion, H.264 CRF 20, yuv420p, faststart. Final audio is AAC 192 kbps with −16 LUFS normalization, −1.5 dB true-peak target and a padded end hold. No music or third-party stock footage.

Run after export:

```powershell
python marketing/video/render_video.py --audio marketing/video/voiceover-mk.mp3
python marketing/video/render_video.py --audio marketing/video/voiceover-mk.mp3 --feed
```

Expected final deliverables: `marketing/video/cvhapi-mk-vertical.mp4` and `marketing/video/cvhapi-mk-feed.mp4`. Existing files ending `-silent-preview.mp4` are review drafts. Inspect both final exports at phone size with and without sound; confirm audio streams, duration, unclipped text, readable offer, pronunciation and the destination language. Placement previews remain necessary because Reels/Stories interface overlays vary.

## Distribution preparation

First use: organic Macedonian social demo. Paid Meta is a later separately funded test, not part of the NOK 300 Search pilot. Macedonian is not in Google's current supported advertising-language list; this is not prepared as Macedonian Google ad creative. Use `/mk/` for the free-builder-led organic post and `/mk/review/` for the paid-review destination. Both are published routes.

Macedonian post copy:

> Направи јасно CV и преземи PDF бесплатно. Веќе имаш CV? Добиј AI-предлози за £2 еднократно, спореди ги верзиите и избери ги измените. Без претплата. Почни на cvhapi.com.

Headline: “Твоето CV. Појасно.” CTA: Learn More. No hiring guarantees, invented testimonials or claims about the viewer's private employment status. Compare future hooks against retained delivered reviews and refunds, not views alone. Keep the offer/destination identical across a real creative test.

Sources and placement guidance: [Meta Reels](https://www.facebook.com/business/ads/facebook-instagram-reels-ads), [Meta employment-ad guidance](https://www.facebook.com/business/help/1537759006681893), and the twelve cited research sources in [GROWTH-PLAN-2026-10-04.md](GROWTH-PLAN-2026-10-04.md). Preparation receipts and blockers are in [marketing/READINESS.md](marketing/READINESS.md).
