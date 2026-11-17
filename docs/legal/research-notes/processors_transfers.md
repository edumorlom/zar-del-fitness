# Third-party providers, international data transfers, and foreign privacy laws for Zar del Fitness (as of 17 Nov 2026)

> Method caveat for the report writer: in this research session WebFetch was blocked by the sandbox network allowlist for railway.com and digui.ai (DNS "ENOTFOUND"), so no provider page was opened directly. Everything below comes from search-engine extracts of the cited pages (mostly official provider pages, InfoLEG/argentina.gob.ar, EUR-Lex/EDPB, plus law-firm analyses). Items I could only state from background knowledge are labelled "(background knowledge, not verified in this session)" and the URL is given so it can be checked. Provider terms change often. Every provider row should carry a note like "verified against the provider's page on [date]; terms may have changed".

## 1. Argentina's international transfer regime (Ley 25.326 art. 12, Decreto 1558/2001, Disp. 60-E/2016, Res. AAIP 34/2019, Res. AAIP 198/2023): what must a small company using US cloud providers do?

### Takeaway
Argentina prohibits transfers to countries without "adequate" protection. The United States is NOT on the AAIP adequacy list. Transfers to the US are lawful if (a) the data subject gives express consent (Decreto 1558/2001 art. 12), or (b) the parties sign contractual clauses: the AAIP models in Disp. 60-E/2016 (cesión or prestación de servicios), or since Oct 2023 the Ibero-American (RIPD) model clauses adopted by Res. AAIP 198/2023. Any non-model contract must be submitted to the AAIP within 30 days unless it reflects the models' essential protections. The law requires only one route, consent OR clauses. But large US vendors offer GDPR-SCC-based DPAs, not Argentine model clauses. The prudent, common practice for a small company is therefore both: accept each provider's DPA and get express, informed consent to the US transfer in the sign-up flow (especially for health data). The privacy policy should disclose the recipients, the countries and the mechanism.

### Cited Findings
- Ley 25.326 art. 12 prohibits transferring personal data to countries or international/supranational bodies that do not provide adequate protection. Exceptions: international judicial cooperation; exchange of medical data when the data subject's treatment or an epidemiological investigation requires it; bank or stock-exchange transfers under applicable law; international treaties; and intelligence cooperation against organized crime, terrorism and drug trafficking. — [Ley 25.326 texto actualizado, InfoLEG](https://servicios.infoleg.gob.ar/infolegInternet/anexos/60000-64999/64790/texact.htm); [Ley 25.326 PDF, UNC](https://www.unc.edu.ar/sites/default/files/Ley-de-Proteccion-de-Datos-Personales-Nro-25326.pdf)
- Decreto 1558/2001 (Anexo I, art. 12): the prohibition "no rige cuando el titular de los datos hubiera consentido expresamente la cesión". Consent is not needed for transfers from a public registry open to the public or to anyone with a legitimate interest. — [Decreto 1558/2001 (Justia PDF)](https://docs.argentina.justia.com/federales/decretos/decreto-n-1558-2001-nov-3-2001.pdf); [CEIC cuadro integrador Ley 25.326/Decreto 1558](https://ceic.org.ar/cuadro_integrador_ley25326.pdf)
- The official AAIP page says flows to non-adequate countries can rely on the art. 12 exceptions or the data subject's express consent, and it describes the contractual-clause route. — [AAIP – Transferencias internacionales](https://www.argentina.gob.ar/transferencias-internacionales)
- An academic source says the decree also accepts contractual clauses as a source of adequate protection. — [CPDP LatAm 2023 discussion paper](https://cpdp.lat/wp-content/uploads/2023/07/doc-discusion-cpdplatam23-2.3.pdf); [Estudio Lexar](https://estudiolexar.com/transferencia-internacional-de-datos-personales-desde-argentina/)
- Adequacy list (Disp. 60-E/2016 art. 3, as updated): EU and EEA member states, Switzerland, Guernsey, Jersey, Isle of Man, Faroe Islands, Canada (private sector only), Andorra, New Zealand, Uruguay and Israel (automated processing only). Res. AAIP 34/2019 confirmed the UK's inclusion. — [Disp. 60-E/2016 texto actualizado](https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-60-2016-267922/actualizacion); [Disp. 60-E/2016 InfoLEG](https://servicios.infoleg.gob.ar/infolegInternet/anexos/265000-269999/267922/norma.htm); [Res. AAIP 34/2019](https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-34-2019-320275/texto); [IAPP – UK added](https://iapp.org/news/a/el-reino-unido-se-incorpora-a-la-lista-argentina-de-paises-adecuados-para-la-transferencia-internacional-de-datos-personales)
- The United States is not on the list of countries with adequate legislation under Disp. 60-E/2016 and Res. AAIP 34/2019. — [Legal Core Group](https://legalcoregroup.com.ar/en/international-personal-data-transfers-in-argentina/); consistent with the list text in [Disp. 60-E/2016](https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-60-2016-267922/actualizacion)
- Disp. 60-E/2016 approved two model contracts: one for "cesión" (controller to controller) and one for "prestación de servicios" (transfer to a processor/encargado abroad). — [Disp. 60-E/2016 texto original](https://www.argentina.gob.ar/normativa/nacional/disposici%C3%B3n-60-2016-267922/texto)
- In the Argentine controller-to-processor model clauses, the importer is a service provider outside Argentina, and data subjects get third-party-beneficiary rights to require the importer to comply with Ley 25.326. — [Law Insider copy of Argentina SCC (controller to processor)](https://lawinsider.com/es/contracts/hvJ27oBeMjR)
- Res. AAIP 198/2023 (Oct 2023) approved the RIPD (Red Iberoamericana de Protección de Datos) model contractual clauses and their implementation guide. They cover controller-to-processor and controller-to-controller transfers. They complement, and do not replace or expressly repeal, the Disp. 60-E/2016 models. Annex B must identify the data transferred and the purposes. Using them does not exempt the parties from local law. Sources differ on the date: 13 vs 18 Oct 2023. — [Res. 198/2023 InfoLEG](https://servicios.infoleg.gob.ar/infolegInternet/anexos/390000-394999/391538/norma.htm); [Res. 198/2023 texto original](https://www.argentina.gob.ar/normativa/nacional/resoluci%C3%B3n-198-2023-391538/texto); [EY Law alert](https://www.ey.com/es_ar/technical/law/ey-law-alerts-argentina/datos-personales-aprobacion-clausulas-contractuales-modelo); [Allende & Brea](https://allende.com/privacidad-y-ciberseguridad/la-agencia-de-acceso-a-la-informacion-publica-aaip-aprueba-nuevas-clausulas-contractuales-modelo-ccm-para-transferencias-internacionales-10-19-2023/); [IAPP](https://iapp.org/news/a/argentina-implementa-nuevas-clausulas-contractuales-modelo-para-la-transferencia-internacional-de-datos)
- A non-model agreement for transfers to non-adequate countries must be submitted to the AAIP for approval within 30 days of signing, unless it reflects the essential protections of the model clauses. — [Linklaters – Data Protected Argentina](https://www.linklaters.com/en/insights/data-protected/data-protected---argentina)
- Reform status: Ley 25.326 remains fully in force. At least three comprehensive reform bills are pending in Diputados in 2026: 3397-D-2026 (Rossi, filed 16 Jul 2026, substantially the 2023 AAIP bill), 1751-D-2026 (Yeza) and one more. None had a half-sanction as of the sources found. — [HCDN 3397-D-2026](https://www2.hcdn.gob.ar/proyectos/proyecto.jsp?exp=3397-D-2026); [IAPP](https://iapp.org/news/a/se-impulsa-un-nuevo-proyecto-de-reforma-del-r-gimen-de-protecci-n-de-datos-en-argentina); [abogados.com.ar](https://abogados.com.ar/nuevo-proyecto-de-ley-de-proteccion-de-datos-personales/39762)
- The EU's 2024 review notes that Argentina has acceded to Council of Europe Convention 108 and ratified the Protocol creating Convention 108+. — [EC report COM(2024) 7 final (via IPEX)](https://secure.ipex.eu/IPEXL-WEB/download/file/082d29088cfe1ebd018d0c85a98508b4)

### Inferences
- **What a small company should do:**
  1. Map each provider and its country (table in section 2).
  2. Accept or sign each provider's DPA. These are GDPR-SCC- or DPF-based and impose confidentiality, security and subprocessor duties. They are not AAIP model clauses, and whether they "reflect the essential protections" of the Argentine models is untested. So the contract alone may not cleanly satisfy art. 12 without AAIP filing.
  3. Therefore also obtain express, informed, documented consent to the international transfer at account creation. Use a separate checkbox, not pre-ticked, naming the US as the main destination and the purpose (hosting, authentication, email, analytics, AI chat). Make the health-data consent separate and explicit.
  4. Disclose in the privacy policy: each provider or category, its role, the destination countries, the legal mechanism (consent plus contractual clauses/DPA), and how to get more information.
  - Consent is the only practical route a micro-business can implement unilaterally with US SaaS vendors. Its weakness is that it must be freely given and is revocable, so where possible pair it with the DPA.
- Res. 198/2023 RIPD clauses are a realistic option only for smaller vendors willing to sign custom paper. Digui is the most likely candidate, if it is a LatAm company. Big US vendors (Google, Cloudflare, Clerk) will not sign them.
- For Cloudflare (pass-through proxy/CDN), the transfer is the visitor's own request being routed. It is still processing by a US provider and should be disclosed.
- For Mercado Pago (Argentine controller for its own users' data), no international transfer by Zar is involved for payment data. Mercado Libre handles its own transfers under its policy (see section 4).

### Gaps
- I could not open the full text of Decreto 1558 art. 12 to quote the exact sentence on contractual clauses and self-regulation as sources of adequacy. Only the consent sentence was confirmed verbatim.
- I found no AAIP statement on whether GDPR SCCs or EU-US DPF certification, used by a US processor, count as "reflecting the essential protections" of the Argentine models (which would avoid the 30-day filing).
- I found no AAIP resolution after Res. 198/2023 (2024–Nov 2026) amending the adequacy list or approving further clauses. Absence in search results is not proof.
- I did not confirm whether Convention 108+ (amending protocol) has entered into force internationally as of Nov 2026.

## 2. Provider-by-provider: processing, location, DPA/transfer mechanism, Argentina coverage, links

### Takeaway
All core infrastructure except Mercado Pago is US-based or US-controlled. Railway: US company, regions US/EU/Singapore, no EU-only lock. Clerk: US only, no region choice. Resend: account data stored in the US whatever the sending region. Cloudflare: global edge, US company. Google: US/global. The DPAs found are GDPR/UK-oriented (EU SCCs, UK Addendum, EU-US DPF). None found expressly incorporates Argentine model clauses. Cloudflare's and Google's terms use a broad "applicable data protection law" concept that can extend to non-European laws. Railway's DPA Exhibit A lists "sensitive data: none", which matters for health data. I found no public information at all on Digui (digui.ai). Mercado Pago acts as its own controller (Mercado Libre S.R.L. in Argentina).

### Cited Findings

**Summary table** ("Role" uses Ley 25.326 terms: "encargado/prestador de servicios" = processor (art. 25); "responsable independiente" = independent controller)

| Provider | What it processes for Zar | Where stored/processed | DPA and transfer mechanism | Covers Argentina expressly? | Key URLs |
|---|---|---|---|---|---|
| **Railway** (Railway Corporation, US) – hosting: Postgres DB plus S3-compatible bucket | Everything in the portal: health data, measurements, photos, DNI, contact, bookings, payment records | Regions: US West (California), US East (Virginia), EU West (Amsterdam), Southeast Asia (Singapore). Customer picks the region per service. Railway staff say there is no contractual EU-only processing commitment on any plan. The public DPA names the US as the primary processing location. Subprocessors named by staff: Google Cloud, AWS, DataPacket.com. Buckets may involve Tigris, and staff gave no EU-only assurance | Public DPA (Railway Corporation to customer, supplements the ToS) is the only DPA offered. DPA Exhibit A lists sensitive data as "none". Health-data use was asked on the forum and left unresolved | Not found. GDPR-oriented | DPA [railway.com/legal/dpa](https://railway.com/legal/dpa); subprocessors trust.railway.com (subprocessor item, per staff); regions [docs.railway.com/reference/regions](https://docs.railway.com/reference/regions) |
| **Cloudflare** (Cloudflare, Inc., US) – DNS/proxy/CDN/WAF | IP addresses, request metadata and headers, and all traffic incl. portal content in transit (TLS terminated at the edge if proxied), plus cookies such as __cf_bm/cf_clearance | Global anycast edge network. US company | Customer DPA v6.3 (20 Jun 2025), v6.4 reportedly effective 3 Apr 2026. Incorporates SCCs plus supplementary measures as contractual commitments. Global CBPR (processor) certification covers processing under the DPA. A third-party summary says the DPA warrants DPF certification and 30-day subprocessor notice | Not confirmed for Argentina. The DPA has a broad "applicable data protection law" concept (unverified) | DPA [cloudflare.com/cloudflare-customer-dpa](https://www.cloudflare.com/cloudflare-customer-dpa/); [DPA v6.3 PDF](https://cf-assets.www.cloudflare.com/slt3lc6tev37/3LmXORq5FW5EuJ0OT1B871/f466268011407efbc07f4fadbd1af466/Cloudflare_Customer_DPA_v6.3_June_20__2025.pdf); subprocessors cloudflare.com/gdpr/subprocessors/; cookies [developers.cloudflare.com cookies](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/); [GDPR FAQ](https://www.cloudflare.com/trust-hub/gdpr/) |
| **Clerk** (Clerk, Inc., US) – auth incl. Google sign-in | Name, email, password hash, OAuth profile from Google (name, email, avatar), session tokens, IP and device/user-agent, auth logs | US infrastructure only (Google Cloud and Cloudflare). All subprocessors in the US. No regional residency or region selection | DPA (customers grant general authorization for listed subprocessors). Self-certified under EU-US DPF, effective 22 Feb 2024. Third-party list of 9 US subprocessors incl. Google Cloud, Datadog, Sentry, Stripe, Twilio, Svix, Vercel | Not found | [clerk.com/security](https://clerk.com/security); DPA clerk.com/legal/dpa; subprocessors clerk.com/legal/subprocessors; cookies [clerk.com/docs/.../cookies](https://clerk.com/docs/guides/how-clerk-works/cookies); third-party [sub-processors.com/company/clerk.com](https://sub-processors.com/company/clerk.com) |
| **Google Analytics 4** (Google LLC/Google Ireland) – website analytics | Pseudonymous client ID cookie, page views/events, device/browser, coarse geo derived from IP (IP not logged/stored) | Google global/US infrastructure. EU-user IPs dropped before logging on EU servers | Google Ads Data Processing Terms (processor) apply to GA. Current version uses "Applicable Data Protection Legislation" = any national, federal, state, provincial or other privacy law. Older versions limited processor duties to European law, with separate "Additional Terms for Non-European Data Protection Legislation" | Broad definition would include Ley 25.326 (inference). Not named | GA Terms [support.google.com/analytics/answer/7124332](https://support.google.com/analytics/answer/7124332?hl=en-uk); [Google Ads Data Processing Terms](https://business.safety.google/adsprocessorterms); EU privacy [support.google.com/analytics/answer/12017362](https://support.google.com/analytics/answer/12017362) |
| **Google Calendar API** – appointment events | Event title/time, attendee name/email if included | Google global/US | Depends on account type. Workspace: Cloud Data Processing Addendum. Consumer Gmail calendar: Google consumer terms (background knowledge, not verified) | Not verified | Google APIs ToS developers.google.com/terms; Workspace DPA workspace.google.com/terms/dpa_terms.html (background knowledge, not verified) |
| **Resend** (US) – transactional and broadcast email | Recipient email/name, email content (may include booking, payment or plan details), opens/clicks, logs | Sending regions include us-east-1, eu-west-1 (Ireland), sa-east-1 (São Paulo) and Tokyo. All account data, incl. email metadata, logs and API records, is stored in the US whatever the sending region | DPA with EU SCCs (Commission Decision 2021/914) and UK Addendum. Signed copy "updated 12/31/2025". DPF status not found | Not found | DPA [resend.com/legal/dpa](https://resend.com/legal/dpa); [signed DPA PDF](https://resend.com/static/documents/resend-dpa-signed.pdf); regions [resend.com/docs/dashboard/domains/regions](https://resend.com/docs/dashboard/domains/regions); subprocessors resend.com/legal/subprocessors (per third party) |
| **Mercado Pago Checkout Pro** (Mercado Libre S.R.L., Argentina) | Payer name, email, DNI/ID, phone, address (payer object), payment status. Card data stays with MP | Argentina controller. Infrastructure may be in other countries. Transfers protected by contractual clauses or BCRs | MP is the controller of its users' data under its own Privacy Declaration. No processor DPA needed for payment processing (inference) | Yes: Argentine entity under Ley 25.326 | [Privacy Declaration](https://www.mercadopago.com.ar/privacidad/declaracion-privacidad/30988); [International transfers](https://www.mercadopago.com.ar/privacidad/declaracion-privacidad/proteccion-datos-transferencia-internacional_31241); [Resumen](https://www.mercadopago.com.ar/privacidad/resumen); [T&C](https://www.mercadopago.com.ar/ayuda/terminos-y-condiciones_715); [Buyer protection](https://www.mercadopago.com.ar/ayuda/protecci%C3%B3n-a-compradores_283) |
| **Digui (digui.ai)** – AI chat receptionist with MCP/SQL connector | Chat transcripts, visitor identifiers; for logged-in clients: profile (no health data or DNI), bookings, evaluations, payments | Unknown | Unknown | Unknown | No public information found. digui.ai unreachable from this session |
| **YouTube embeds** (Google) | IP, cookies/local storage (unless privacy-enhanced youtube-nocookie.com), viewing data | Google global | Google acts as independent controller for YouTube (background knowledge, not verified) | — | Google Privacy Policy policies.google.com/privacy (background knowledge, not verified) |
| **Social media links** | Plain links transfer nothing until clicked. Embedded widgets/pixels would | — | — | — | — |

**Railway details**
- Railway support points to railway.com/legal/dpa and a subprocessor list on trust.railway.com as authoritative. They name Google Cloud, AWS and DataPacket.com as active subprocessors. — [Railway Station: processing countries](https://station.railway.com/questions/processing-countries-and-remote-support-a54ea717); [Railway Station: complete processing countries](https://station.railway.com/questions/complete-processing-and-remote-access-co-7cc44af3)
- The DPA is between Railway Corporation and the customer. Staff say Railway offers no contractual EU-only processing commitment on any plan and the public DPA is the only DPA offered. — [Railway Station: data residency](https://station.railway.com/questions/data-residency-88129d64); [GDPR DPA request](https://station.railway.com/feedback/gdpr-data-processing-agreement-dpa-req-7814c39b)
- A user notes the public DPA identifies primary processing in the United States, while the Trust Center labels some locations "Global", "EEA/EU" or "Selected Railway Region". — [Railway Station](https://station.railway.com/questions/complete-processing-and-remote-access-co-7cc44af3)
- Storage buckets: a user asked whether Tigris is a subprocessor and whether EU West bucket data stays in the EU. Staff pointed to the subprocessor list and gave no EU-only assurance. — [Railway Station: Storage Buckets (EU West) and Tigris](https://station.railway.com/questions/storage-buckets-eu-west-and-tigris-as-67a8d930)
- Railway's DPA Exhibit A lists sensitive data as "none". A user asked whether health data may be processed, and the reply only restated that the DPA is the only agreement offered. — [Railway Station: health-related data](https://station.railway.com/questions/does-railway-s-standard-dpa-allow-proces-94437f26)
- Current regions: US West Metal (California, us-west2), US East Metal (Virginia), EU West Metal (Amsterdam), Southeast Asia Metal (Singapore). Older docs listed us-west1 Oregon as the default. — [Railway docs: regions](https://docs.railway.com/reference/regions); [Railway multi-region guide](https://docs.railway.com/guides/multi-region-api-failover)

**Cloudflare details**
- Cloudflare's DPA defines "SCCs" for transfers to third-country processors and incorporates supplementary measures as contractual commitments. — [Cloudflare GDPR FAQ](https://www.cloudflare.com/trust-hub/gdpr/); [Cloudflare DPA v6.2 (Nov 2023)](https://cf-assets.www.cloudflare.com/slt3lc6tev37/33zd4ZHJyP8tADGLBSUGB7/8cb20da3929645487342eed96bedd898/Cloudflare_Customer_DPA_v6.2_Nov_9_2023.pdf)
- Latest versions seen: v6.3 dated 20 Jun 2025; v6.4 reportedly effective 3 Apr 2026. — [Cloudflare DPA v6.3 PDF](https://cf-assets.www.cloudflare.com/slt3lc6tev37/3LmXORq5FW5EuJ0OT1B871/f466268011407efbc07f4fadbd1af466/Cloudflare_Customer_DPA_v6.3_June_20__2025.pdf); [Cloudflare DPA page](https://www.cloudflare.com/cloudflare-customer-dpa/)
- Cloudflare holds Global CBPR certification. Its processor certification covers processing under the customer DPA. — [Cloudflare blog (es)](https://blog.cloudflare.com/es-es/cloudflare-cbpr-a-global-privacy-first/); [SecurityBrief UK, Jun 2025](https://securitybrief.co.uk/story/cloudflare-earns-global-cross-border-data-privacy-certification)
- A secondary source (Aug 2026) says the DPA warrants Cloudflare will maintain DPF certification and give at least 30 days' notice of new subprocessors. Not verified against the DPA text. — [ComplyDog](https://complydog.com/blog/is-cloudflare-gdpr-compliant)

**Clerk details**
- Data is hosted on US infrastructure (Google Cloud and Cloudflare) and all subprocessors are in the US. Clerk does not offer regional data residency or region selection. Clerk is self-certified under the EU-US DPF (effective 22 Feb 2024). — [Clerk Security & Compliance](https://clerk.com/security)
- Under the DPA, customers grant Clerk general authorization to engage subprocessors from the published list. — [StackLégal summary](https://stacklegal.eu/en/gdpr/clerk)
- A third-party listing shows 9 subprocessors, all US: Google Cloud, Datadog, Sentry, Stripe, Twilio, Svix, Vercel, etc. It may be outdated. — [Sub-processors.com](https://sub-processors.com/company/clerk.com)

**Resend details**
- The region setting controls only where emails are sent from. All account data (email metadata, logs, API records) is stored in the US regardless of the sending region. — [Resend docs: Choosing a Region](https://resend.com/docs/dashboard/domains/regions)
- The DPA defines "Standard Contractual Clauses" as the EU SCCs (Decision 2021/914) plus the UK SCCs (EU SCCs as amended by the UK Addendum). Signed copy dated 12/31/2025. — [Resend DPA](https://resend.com/legal/dpa); [Resend signed DPA PDF](https://resend.com/static/documents/resend-dpa-signed.pdf)
- A third-party source lists Resend's subprocessors as US-based (e.g., Svix, Vercel). A vendor guide lists data locations as US plus Ireland, São Paulo and Japan (sending). — [GDPRStack – Resend](https://gdprstack.com/vendors/resend); [Nuntly comparison](https://nuntly.com/blog/email-api-eu-data-residency)

**Google (GA4/Calendar) processor terms**
- The current Google Ads Data Processing Terms use "Applicable Data Protection Legislation", which covers any national, federal, EU, state, provincial or other privacy, data security or data protection law. Earlier versions (2020–2021) applied the operative sections only where European law applied and handled non-European law through "Additional Terms for Non-European Data Protection Legislation". — [Google Ads Data Processing Terms (current)](https://business.safety.google/adsprocessorterms); [2021 version PDF](https://business.safety.google/static/assets/pdf/adsprocessorterms-20210927.pdf); [2020 version](https://business.safety.google/adsprocessorterms-20200816)

**Mercado Pago details**
- The Argentina annex names Mercado Libre S.R.L. as the entity responsible for the database collected in Argentina. — [Mercado Pago Declaración de Privacidad](https://www.mercadopago.com.ar/privacidad/declaracion-privacidad/30988)
- Mercado Libre says receiving countries may not offer adequate protection and that it protects transfers with contractual clauses or binding corporate rules. Infrastructure (own or third-party servers/cloud) may be in another country. — [MP: ¿Cómo cuidamos tus datos cuando se transfieren a otro país?](https://www.mercadopago.com.ar/privacidad/declaracion-privacidad/proteccion-datos-transferencia-internacional_31241)
- Sellers receive only the payment and the buyer's email. Buyers' financial data is not shared with sellers. — [MP Buyer protection](https://www.mercadopago.com.ar/ayuda/protecci%C3%B3n-a-compradores_283)
- An older ML declaration said a seller who receives buyers' personal data becomes responsible for processing it. — [MP Declaración legacy 1.1](https://www.mercadopago.com.ar/privacidad/declaracion-privacidad/legacy/1.1)
- Checkout Pro developer docs list optional "payer" fields the integrator can send: name, surname, identification document, phone, address, registration date, etc. — [MP developers: industry data (UY)](https://mercadopago.com.uy/developers/es/docs/checkout-pro/additional-content/industry-data)

**Digui**
- Searches for "digui.ai" and "Digui" (AI receptionist / chat / Argentina) returned no page or company information. A direct fetch of digui.ai failed (host not resolvable from the sandbox). — searches performed 17 Nov 2026; no source available

### Inferences
- **Railway is the critical vendor.** It holds health data, a "sensitive" category under Ley 25.326 art. 2 and GDPR art. 9, yet its standard DPA Exhibit A says "sensitive data: none" and Railway offers no other DPA. Zar should:
  - pick a region deliberately (US East/West vs EU West Amsterdam). Amsterdam would put data in an AAIP-"adequate" jurisdiction, but Railway is a US company with US subprocessors, so a US transfer still exists;
  - document the choice;
  - ask Railway in writing whether health data is permitted;
  - encrypt sensitive fields and photos at rest at the application level.
- None of the US vendors' DPAs found mention Argentina or the AAIP models. The Argentine "contractual clauses" route is therefore imperfect, and express consent should back it up (section 1).
- Mercado Pago should be described as an independent controller (responsable independiente) for payment data, with a link to its privacy declaration. Zar remains controller of what it receives (payment status, email, amount). Zar should send only the payer fields it needs; DNI is optional in Checkout Pro preferences.
- **Digui must be treated as an encargado.** It reads client profile, bookings, evaluations and payments, and its chats can capture anything a user types, including health data. Before going live Zar needs:
  - the legal operator and its country;
  - a DPA (Res. 198/2023 RIPD clauses if foreign and willing);
  - the underlying LLM provider(s) and their regions; these are likely US AI labs (inference, unverified);
  - transcript retention, and confirmation that data is not used for training;
  - a read-only, least-privilege SQL role/views limited to the stated tables.
  The policy should disclose that an AI assistant answers chats, that it can access these categories for logged-in users, and that it does not make decisions with legal or similarly significant effects.
- YouTube embeds should use privacy-enhanced mode (youtube-nocookie.com) or click-to-load, to avoid Google cookies before consent (background knowledge, not verified).

### Gaps
- Primary DPA text for Railway, Clerk, Cloudflare (v6.4) and Resend was not opened (fetch blocked). The exact transfer clauses, governing law, breach-notice windows and any "other jurisdictions" clauses are unverified.
- Exact subprocessor lists and URLs for Railway (trust.railway.com) and Resend were not confirmed from the primary pages.
- Clerk's DPA URL (clerk.com/legal/dpa) and subprocessor URL come from third-party summaries.
- Resend's DPF certification status is unknown.
- Google Calendar: whether Zar uses a Workspace (DPA available) or consumer Google account is unknown and determines the applicable terms.
- Digui: operator, location, DPA, LLM subprocessors and retention are all unknown. This is the largest gap.
- Mercado Pago: I found no explicit statement that the merchant and MP are independent controllers in Checkout Pro. That is an inference from MP's own privacy declaration naming itself responsible.

## 3. Google Analytics 4 specifics: data collected, IP handling, retention, Google's disclosure/consent requirements, consent mode

### Takeaway
GA4 sets first-party cookies with a pseudonymous client ID and collects events. Google says GA4 does not log or store IP addresses. It derives only coarse geo, and EU-user IPs are dropped on EU servers. Event/user-level retention can be 2 or 14 months; 2 months is the better-supported default, so check the property. Google's GA Terms (§7 Privacy) require the site to post a privacy policy disclosing GA use, cookies/identifiers and how data is collected and processed. Where law requires it, the site must obtain visitor consent for cookies. Consent mode makes GA4 send cookieless pings when analytics_storage is denied.

### Cited Findings
- "When collecting data, Google Analytics 4 does not log or store IP addresses. Analytics drops any IP addresses that it collects from EU users before logging that data via EU domains and servers." GA still derives coarse geolocation (city, region, country, continent) from the IP. — [Google Analytics Help – EU-focused data and privacy (answer 12017362)](https://support.google.com/analytics/answer/12017362)
- Some EU regulators (e.g., Austria) treated earlier Universal Analytics deployments with IP anonymization as unlawful. A 2022 report said Google moved to stop logging IPs in GA4 in response. — [AdExchanger](https://www.adexchanger.com/online-advertising/google-analytics-to-stop-logging-ip-addresses-and-sunset-old-versions-in-privacy-standards-overhaul/); [Cookiebot](https://cookiebot.com/en/google-analytics-gdpr)
- GA4 standard properties offer event and user data retention of 2 or 14 months; GA4 360 adds 26, 38 or 50 months. Retention affects Explorations, not aggregated standard reports. Changes are not retroactive. Most sources say the default is 2 months; Usercentrics says 14. — [InfoTrust](https://infotrust.com/articles/google-analytics-4-data-retention-settings-101/); [Analytics Mania](https://www.analyticsmania.com/post/2-month-data-in-google-analytics-4); contradicted on default by [Usercentrics](https://usercentrics.com/knowledge/ga4-data-retention/)
- GA Terms §7 (Privacy) require a posted privacy policy that gives notice of cookies, mobile identifiers or similar technology used to collect data. The policy must disclose the use of Google Analytics and how it collects and processes data. Where providing such information and obtaining consent is required by law, visitors must get clear and comprehensive information about, and consent to, storing and accessing cookies in connection with GA. The quoted text is from archived and third-party copies, so check the current wording. — [Google Analytics Terms of Service (support page)](https://support.google.com/analytics/answer/7124332?hl=en-uk); [archived 2019 GA ToS](https://open.windriver.com/info/uni-license-list/licenses/google-analytics-tos-2019.html); [ConductAtlas provision record](https://conductatlas.com/platform/google/google-analytics-terms-of-service/provision/CA-P-067777/privacy-policy-must-disclose-cookie-and-identifier-use/); [iubenda](https://www.iubenda.com/en/help/11994-privacy-policy-for-google-analytics)
- With consent mode, GA4 sends cookieless pings instead of setting cookies when analytics storage is denied. — [Usercentrics GA4 data retention guide](https://usercentrics.com/guides/privacy-led-marketing/ga4-data-retention/)
- GA processing is governed by the Google Ads Data Processing Terms (processor terms), see section 2. — [Google Ads Data Processing Terms](https://business.safety.google/adsprocessorterms)

### Inferences
- Policy text for GA4 should say:
  - Zar uses Google Analytics 4 (Google LLC, US) for aggregated website statistics;
  - it sets cookies (_ga, _ga_<ID>; background knowledge, verify on developers.google.com/analytics/devguides/collection/ga4/cookie-usage) storing a random identifier;
  - Google uses the IP only for approximate location and does not store it;
  - the retention period configured (recommend 2 months);
  - Google signals and ads data sharing are off, if so (verify in the property);
  - how to opt out (cookie banner, Google's opt-out add-on);
  - a link to "How Google uses information from sites or apps that use our services" (policies.google.com/technologies/partner-sites; background knowledge, not verified).
- GA should not load on authenticated portal pages that show health data, or should strip URLs/titles containing personal data. Sending personal data to GA is prohibited by GA policies (background knowledge, not verified).
- For Argentine law alone, analytics cookies do not have an explicit opt-in cookie rule. For EU/Brazil-located visitors, a consent banner with consent mode (analytics_storage default "denied" until accepted) is the safer configuration.

### Gaps
- Current GA Terms text and section numbering were not opened directly.
- The official Google Help page on GA4 data retention (default value) was not retrieved, so the sources conflict on the default.
- Google's EU User Consent Policy and consent mode v2 requirements (EEA) were not retrieved in this session.

## 4. Cookies (Clerk, Cloudflare) and Mercado Pago's controller role

### Takeaway
Clerk's `__session`, `__client` and `__client_uat` cookies are first-party and essential to authentication. Clerk says they cannot be disabled and hold no PII by default. Cloudflare's `__cf_bm` (Bot Management/Bot Fight Mode) and `cf_clearance` (challenge passed) are classed by Cloudflare as strictly necessary. Both groups can be described as strictly necessary cookies needing no consent under EU-style rules. Mercado Pago (Mercado Libre S.R.L.) is the controller of its users' payment data under its own privacy declaration, so it should be presented as an independent controller rather than a processor.

### Cited Findings
- Clerk's cookies (`__session`, `__client_uat` first-party; `__client` HttpOnly, set by Clerk's Frontend API) are required for Clerk to function. They are set during sign-in/sign-up and this cannot be disabled. By default they hold no personally identifiable information. — [Clerk docs – How Clerk works: cookies](https://clerk.com/docs/guides/how-clerk-works/cookies); [Clerk cookies (older docs)](https://clerk.com/docs/deployments/clerk-cookies)
- `__session` holds a short-lived session JWT (about 60 seconds by design; third parties report 1–2 minutes). It is set on the root domain and not HttpOnly so client SDKs can read it. `__client` is long-lived and HttpOnly and is used to mint session JWTs. `__client_uat` records the client "updated at" time. — [Clerk XSS leak protection](https://clerk.com/docs/guides/secure/best-practices/xss-leak-protection); [ConsentStack – Clerk](https://www.consentstack.io/vendors/clerk); [Triptease cookie table](https://www.triptease.com/en/triptease-customer-platform-cookies)
- Cloudflare lists `__cf_bm` among cookies "strictly necessary to provide the services requested by our customers". It is set for sites using Bot Management or Bot Fight Mode, generated per site visited, and can be disabled via the bot management API (`bm_cookie_enabled`). — [Cloudflare Cookies](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/)
- `cf_clearance` stores proof that a visitor passed a challenge. Its validity follows the zone's Challenge Passage setting. It is set with SameSite=None; Secure; Partitioned. — [Cloudflare Challenges – clearance](https://developers.cloudflare.com/cloudflare-challenges/concepts/clearance/)
- Mercado Libre S.R.L. is responsible for the database collected in Argentina. Sellers receive only the payment and the buyer's email. — [MP Declaración de Privacidad](https://www.mercadopago.com.ar/privacidad/declaracion-privacidad/30988); [MP Buyer protection](https://www.mercadopago.com.ar/ayuda/protecci%C3%B3n-a-compradores_283)

### Inferences
- Suggested cookie table rows:
  - Clerk `__session`, `__client`, `__client_uat`, `__clerk_db_jwt` (dev only; background knowledge): authentication, strictly necessary, first party (Clerk US).
  - Cloudflare `__cf_bm`, `cf_clearance` (only if Bot Fight Mode or challenges are enabled): security, strictly necessary.
  - GA `_ga`, `_ga_<ID>`: analytics, consent where required.
  - YouTube/Google cookies if standard embeds: third party, consent where required.
  - Mercado Pago cookies are set on MP's own domain during checkout and governed by MP's policy.
- Google sign-in via Clerk: Google receives the fact of the sign-in (Google acts as identity provider and independent controller). Clerk receives the OAuth profile. Disclose both.

### Gaps
- Exact `__cf_bm` lifetime was not confirmed (commonly cited as 30 minutes; not found in the extracts).
- Clerk cookie lifetimes for `__client`/`__client_uat` were not confirmed.
- No Mercado Pago document found that expressly allocates controller roles between merchant and MP in Checkout Pro.

## 5. Foreign laws that may apply to international online clients (GDPR incl. Spain, US/CCPA/Washington MHMDA, Brazil LGPD, Uruguay, Mexico, Chile) and the relevance of Argentina's EU adequacy

### Takeaway
- **GDPR:** selling online coaching worldwide in USD does not by itself trigger GDPR art. 3(2)(a). Mere accessibility, a currency that is not an EU currency, and the controller's own language are not enough. But once Zar knowingly coaches someone located in the EU (e.g., Spain), tracking their weight, body fat, measurements and progress photos over time, it very likely "monitors behaviour" in the EU under art. 3(2)(b). The EDPB lists personalised diet/health analytics and regular health-status reporting as monitoring. GDPR then applies to those clients' data, including art. 9 explicit consent for health data and, arguably, an art. 27 EU representative.
- **Argentina's EU adequacy** (Decision 2003/490/EC, confirmed in the Jan 2024 review) makes EU-to-Argentina transfers easy. It does not exempt an Argentine controller caught by art. 3(2) from GDPR.
- **US:** CCPA thresholds ($26.625M revenue / 100k consumers) are not met. Washington's My Health My Data Act has no size threshold but applies only if Zar targets Washington residents. The risk is low but it is a health-data law.
- **Brazil:** LGPD applies extraterritorially when offering services to, or processing data of, individuals in Brazil. A single Brazilian client brings that data into scope.
- **Uruguay:** Ley 18.331 (as amended by Ley 19.670 art. 37) applies to non-established controllers offering goods/services to Uruguayan inhabitants.
- **Chile:** Ley 21.719 has extraterritorial reach and enters into force 1 Dec 2026, unless a postponement bill (Senate-approved 28 Oct 2026) is enacted first.
- **Mexico:** the 2025 LFPDPPP is in force, but I found no clear extraterritorial clause.

### Cited Findings
**GDPR scope and Argentina adequacy**
- EDPB Guidelines 3/2018 on territorial scope (v2.0 adopted 12 Nov 2019) cover art. 3(2) targeting and monitoring and the art. 27 representative. The GDPR's reference to data subjects "in the Union" does not depend on citizenship or residence. — [EDPB Guidelines 3/2018 (PDF)](https://edpb.europa.eu/sites/edpb/files/files/file1/edpb_guidelines_3_2018_territorial_scope_en.pdf); [NatLawReview summary](https://natlawreview.com/article/new-guidelines-gdpr-s-territorial-scope?amp)
- GDPR recital 23: mere accessibility of the website, an email address, or use of a language generally used in the controller's third country is insufficient to show intent to offer services. Use of a language or currency generally used in one or more Member States with the possibility of ordering in it, or mentioning customers in the Union, may make the intent apparent. — [GDPR, EUR-Lex (Regulation 2016/679), recital 23](https://eur-lex.europa.eu/eli/reg/2016/679/oj) (text from background knowledge; recital is primary law at this URL)
- The EDPB Guidelines 3/2018 list of monitoring activities includes "personalised diet and health analytics services online" and "monitoring or regular reporting on an individual's health status". — [EDPB Guidelines 3/2018, section 2(b)](https://edpb.europa.eu/sites/edpb/files/files/file1/edpb_guidelines_3_2018_territorial_scope_en.pdf) (background knowledge of the list; search extract did not show this passage. Verify)
- GDPR art. 27(2)(a) exempts from the representative duty processing that is occasional, does not include large-scale special-category processing, and is unlikely to result in risk. — [GDPR art. 27, EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj) (text from background knowledge)
- Commission report COM(2024) 7 final of 15 Jan 2024 (first review of the 11 adequacy decisions adopted under Directive 95/46) concluded Argentina continues to ensure adequate protection. It took into account Argentina's accession to Convention 108, ratification of the 108+ protocol, and the independence of its supervisory authority. — [EC COM(2024) 7 final via IPEX](https://secure.ipex.eu/IPEXL-WEB/download/file/082d29088cfe1ebd018d0c85a98508b4); [Marval](https://www.marval.com/publicacion/la-comision-europea-ratifica-que-la-argentina-tiene-legislacion-adecuada-para-la-transferencia-internacional-de-datos-personales-15760?lang=en); [Allende & Brea](https://allende.com/privacidad-y-ciberseguridad/la-comision-europea-ratifico-la-adecuacion-de-11-terceros-paises-y-territorios-para-el-flujo-internacional-de-datos-personales-01-18-2024/); [Beccar Varela](https://beccarvarela.com/novedades/revalidacion-de-argentina-como-pais-adecuado-por-la-ue-para-la-transferencia-de-datos-personales/)
- The review reportedly encouraged Argentina to complete its legislative reform. — [RecordingLaw (secondary)](https://www.recordinglaw.com/es/world-laws/world-data-privacy-laws/eu-adequacy-decisions/)
- The underlying adequacy decision is Commission Decision 2003/490/EC of 30 June 2003. — [EUR-Lex CELEX 32003D0490](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32003D0490) (background knowledge of the citation)
- EDPB Guidelines 05/2021 on the interplay between art. 3 and Chapter V: data disclosed directly by an EU data subject to a third-country controller is not a "transfer". Disclosures by a controller subject to GDPR (incl. via art. 3(2)) to another third-country entity are transfers. — [EDPB Guidelines 05/2021](https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2021/guidelines-052021-interplay-between-application_en) (background knowledge, not verified in this session)

**Spain**
- Spain applies GDPR plus the LOPDGDD (Ley Orgánica 3/2018). Art. 7 sets the age of consent at 14; art. 11 allows layered information. — [LOPDGDD, BOE consolidated](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673) (background knowledge of article content, not verified in this session)

**United States**
- CCPA applies to for-profit businesses doing business in California that meet one of three tests: annual gross revenue above $26,625,000 (CPI-adjusted from 1 Jan 2025; next adjustment 1 Jan 2027); buying, selling or sharing PI of 100,000+ California consumers/households; or deriving 50%+ of revenue from selling/sharing PI. — [Jackson Lewis CCPA FAQs](https://www.jacksonlewis.com/insights/navigating-california-consumer-privacy-act-30-essential-faqs-covered-businesses-including-clarifying-regulations-effective-1126); [SecurePrivacy 2026 guide](https://secureprivacy.ai/blog/ccpa-requirements-2026-complete-compliance-guide); [Feroot](https://feroot.com/blog/ccpa-applicability-website-california-law/)
- Washington My Health My Data Act (RCW 19.373) has no revenue or consumer-count thresholds; small businesses only got a later compliance date. It applies to any legal entity that conducts business in Washington or targets products or services to Washington consumers, and protects WA residents and anyone whose health data is collected in WA. It is enforced by the WA AG under the Consumer Protection Act (up to $7,500 per violation) and includes a private right of action. — [Holland & Knight](https://www.hklaw.com/en/insights/publications/2023/05/washington-state-imposes-far-reaching-privacy-obligations); [Morgan Lewis](https://www.morganlewis.com/ru/pubs/2023/07/the-broad-reach-of-washington-states-my-health-my-data-act); [ZwillGen](https://www.zwillgen.com/privacy/washington-my-health-my-data-act/); [Baker McKenzie](https://connectontech.bakermckenzie.com/my-health-my-data-exceptions-and-exemptions-examined/)

**Brazil**
- LGPD art. 3 has three independent triggers: processing in Brazil; processing aimed at offering or supplying goods/services to, or processing data of, individuals located in Brazil; or data collected in Brazil. It applies regardless of the controller's country or where the data is stored. A US company running a Portuguese-language store for Brazilian customers must comply. — [Barbieri Advogados (2026 guide)](https://barbieriadvogados.com/en/?p=8824); [Confidata – LGPD comentada](https://confidata.com.br/blog/lgpd-comentada-02-aplicacao-territorial-excecoes); [LGPD text, Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- The ANPD has been receiving complaints from Brazilian data subjects against foreign companies with no Brazilian representative. — [Barbieri Advogados](https://barbieriadvogados.com/?p=6617)

**Uruguay**
- Art. 37 of Ley 19.670 sets the territorial scope of Ley 18.331. Besides controllers established in Uruguay, it covers three cases of non-established controllers. Decreto 64/020 regulates these and uses "habitantes" for cases of goods/services directed to inhabitants of the Republic or analysis of their behaviour (Dictamen 19/021). The URCDP publishes a compliance guide for foreign entities. — [URCDP Guía para entidades extranjeras](https://www.gub.uy/unidad-reguladora-control-datos-personales/comunicacion/publicaciones/guia-para-cumplimiento-obligaciones-entidades-extranjeras/guia-para-1); [Decreto 64/020, IMPO](https://www.impo.com.uy/bases/decretos/64-2020/1); [URCDP Dictamen 19/021](https://www.gub.uy/unidad-reguladora-control-datos-personales/institucional/normativa/dictamen-n-19021)

**Mexico**
- The new LFPDPPP was published in the DOF on 20 Mar 2025 and in force from 21 Mar 2025, abrogating the 2010 law. Art. 1 makes it "de observancia general en todo el territorio nacional". The Secretaría Anticorrupción y Buen Gobierno replaced INAI as authority. Last reform reported: DOF 14-11-2025. — [LFPDPPP, Cámara de Diputados PDF](https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf); [Garrigues](https://www.garrigues.com/es_ES/noticia/mexico-nueva-ley-federal-proteccion-datos-personales-posesion-particulares-introduce); [Littler](https://www.littler.com/es/news-analysis/asap/mexico-tiene-nueva-ley-en-materia-de-proteccion-de-datos-personales)

**Chile**
- Ley 21.719 was published 13 Dec 2024 with entry into force 1 Dec 2026. It reaches controllers outside Chile that offer goods/services to data subjects in Chile or monitor their behaviour there. The Senate approved a bill on 28 Oct 2026 to postpone entry into force to 15 Oct 2027. The bill went to the Chamber of Deputies; until published, the law takes effect 1 Dec 2026. A government document had proposed 1 Dec 2027, so sources conflict on the final date. — [Garrigues](https://www.garrigues.com/es_ES/noticia/chile-redefine-marco-privacidad-ciberseguridad-nuevas-reglas-cumplimiento-cambios); [Diario Constitucional, Jun 2026](https://www.diarioconstitucional.cl/2026/06/12/la-ley-21-719-entra-en-vigor-el-1-de-diciembre-y-expone-vacios-en-regulacion-de-pequenas-empresas/); [Carey](https://www.carey.cl/api/archivo/gobierno-ingresa-proyecto-de-ley-que-posterga-en-un-ano-entrada-en-vigor-de-la-ley-sobre-proteccion-de-datos-personales?lang=es); [Alayia Trust – extraterritorialidad](https://alayiatrust.com/en/blog/extraterritorialidad-transferencias-internacionales); [abogados.com.ar](https://abogados.com.ar/nuevo-regimen-de-proteccion-de-datos-personales-en-chile/36070)

### Inferences
- **GDPR (incl. Spain):**
  - Art. 3(2)(a) "offering" may not be triggered: USD pricing, an Argentine Spanish-language site, and no EU mentions, EU ads or EU testimonials. Spanish is also a Member State language, which makes the language factor ambiguous.
  - Art. 3(2)(b) "monitoring" is the stronger hook: ongoing remote coaching that tracks an EU-located client's body metrics and photos.
  - Conservative conclusion: assume GDPR applies to any client located in the EU/EEA and draft the policy to be GDPR-compatible.
  - Art. 27: regular coaching is not "occasional" and involves health data, so the exemption is doubtful. Zar can appoint an EU representative (commercial services exist) or accept residual risk. The report should flag this as a judgement call.
  - Transfers: Zar's onward disclosures of EU clients' data to US processors are Chapter V transfers. They are covered by those processors' DPF certification (Clerk confirmed; Cloudflare reportedly) and/or EU SCCs (Resend, Cloudflare).
  - Argentina's adequacy helps for EU-to-Argentina flows but does not remove GDPR duties.
- **US:**
  - CCPA clearly does not apply at Zar's scale (USD 100/month clients, far below $26.6M revenue and 100k consumers).
  - Washington MHMDA is the US law most relevant to fitness/body data. It applies only if Zar "targets" WA residents. A worldwide Spanish-language offer is unlikely to count, but if Zar markets to US clients, a short "Consumer Health Data Privacy Policy" section would reduce risk. Nevada and Connecticut have similar health-data provisions (not researched here).
- **Brazil:** LGPD applies to any Brazil-located client. Minimum: legal bases (art. 7) and specific, highlighted consent for sensitive data (art. 11); art. 18 rights; controller identity and an encarregado/contact channel; right to complain to the ANPD. LGPD article content beyond art. 3 is background knowledge, not verified in this session.
- **Uruguay:** for Uruguayan clients, Ley 18.331 applies. Rights mirror Argentina's (access, rectification, update, suppression). Authority: URCDP.
- **Chile:** if the law takes effect 1 Dec 2026 (or on a postponed date), Chilean clients get rights of access, rectification, suppression, opposition, portability and blocking, with the new Agencia de Protección de Datos Personales as authority (background knowledge; verify). Low priority because enforcement and postponement are in flux.
- **Mexico:** unclear extraterritoriality. A Spanish-language policy with ARCO-style rights and purpose/transfer disclosures already approximates an "aviso de privacidad" in substance.

### Gaps
- EDPB 3/2018 targeting factors (currency/language list) and the monitoring-activities list were not visible in the search extracts. Verify the exact wording in the PDF.
- I did not verify the current status of EU-US DPF litigation (e.g., any appeal after the General Court's Latombe judgment) as of Nov 2026.
- LGPD art. 33 / ANPD Res. CD/ANPD 19/2024: whether direct collection by a foreign controller is excluded from "international transfer" was not verified. Also unverified: whether ANPD Res. 2/2022 small-agent relief applies to foreign controllers processing sensitive data.
- Uruguay: the exact text of Ley 19.670 art. 37 literals and any registration duty for foreign controllers were not confirmed.
- Mexico: no source found on whether the 2025 LFPDPPP applies to controllers established abroad.
- Chile: the exact extraterritoriality article and any duty for foreign controllers to designate a representative or contact in Chile were not confirmed. Postponement bill status after 28 Oct 2026 is unknown.
- Spain: whether LSSI art. 22.2 (cookies) applies to a non-EU provider (LSSI art. 4 limits application to non-EU providers) was not researched.

## 6. Minimum privacy-policy disclosures (Argentina transfer disclosures plus additions for foreign clients)

### Takeaway
One Spanish-language policy can cover Argentina and foreign clients if it adds a GDPR-style layer:
- controller identity and contact;
- purposes with legal bases per purpose;
- explicit consent for health data;
- recipients/processors by name and country;
- international transfers with mechanism (express consent plus DPA/SCCs/DPF);
- retention periods;
- the full rights list and how to exercise them;
- the right to complain to the AAIP and to the client's local authority (AEPD, ANPD, URCDP, Chile's agency);
- cookies/analytics and AI-chat disclosures;
- optionally, an EU representative and a Brazil contact channel.

### Cited Findings
- Argentina transfer mechanism and model clauses: Res. AAIP 198/2023 Annex B requires identifying the data transferred and the purposes. — [Res. 198/2023 InfoLEG](https://servicios.infoleg.gob.ar/infolegInternet/anexos/390000-394999/391538/norma.htm); [Allende & Brea](https://allende.com/privacidad-y-ciberseguridad/la-agencia-de-acceso-a-la-informacion-publica-aaip-aprueba-nuevas-clausulas-contractuales-modelo-ccm-para-transferencias-internacionales-10-19-2023/)
- Express consent is the basis for transfers to non-adequate countries under Decreto 1558/2001 art. 12. — [Decreto 1558/2001](https://docs.argentina.justia.com/federales/decretos/decreto-n-1558-2001-nov-3-2001.pdf); [AAIP](https://www.argentina.gob.ar/transferencias-internacionales)
- Google requires disclosure of GA use, cookies/identifiers and data processing, and consent where legally required. — [GA Terms](https://support.google.com/analytics/answer/7124332?hl=en-uk); [iubenda](https://www.iubenda.com/en/help/11994-privacy-policy-for-google-analytics)
- GDPR art. 13 (information to be provided): controller identity/contact, purposes and legal bases, legitimate interests, recipients, third-country transfers and safeguards, retention, rights, right to withdraw consent, right to lodge a complaint, whether provision is statutory/contractual and the consequences, and automated decision-making. — [GDPR art. 13, EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj) (background knowledge of article content)

### Inferences
Checklist for the report writer. Each item maps to the findings above:
1. **Controller:** legal name/titular, CUIT, address in CABA, privacy email. Optional: EU representative (art. 27) and Brazil channel.
2. **Data categories:** identification (DNI), contact, account/auth (Clerk/Google sign-in), health (conditions, medications, medical certificate), body metrics and progress photos, bookings, payments (via MP), chat transcripts (Digui), web analytics/cookies.
3. **Purposes and legal bases:**
   - Contract: coaching, bookings, portal.
   - Express/explicit consent: health data, progress photos, international transfer to the US, marketing broadcasts (Resend), non-essential cookies.
   - Legal obligation: tax/invoicing records.
   - Legitimate interest: security (Cloudflare), service emails.
4. **Recipients table:** provider, role (encargado vs responsable independiente), country, mechanism, link. Use section 2's table:
   - Railway (US; region chosen), Cloudflare (global/US), Clerk (US), Google Analytics/Calendar (US/global), Resend (US) and Digui (TBD) as processors;
   - Mercado Pago (Argentina) and Google as identity provider/YouTube as independent controllers.
5. **International transfers:** state that the US is not considered adequate by the AAIP. Transfers rely on the client's express consent (Decreto 1558/2001 art. 12) and the providers' data processing agreements with contractual safeguards (SCCs / EU-US DPF where applicable). For EU clients, Chapter V safeguards apply. Offer a copy of the safeguards on request.
6. **Retention** per category: e.g., health record for the duration of membership plus X; GA 2 months; email logs per Resend defaults.
7. **Rights:**
   - Argentina: access free every 6 months, rectification, update, suppression, plus the AAIP mandatory legend (Disp. 10/2008; confirm with the Argentina-law notes).
   - GDPR: access, rectification, erasure, restriction, portability, objection, withdrawal of consent.
   - LGPD art. 18 rights.
   - Response channel and timeframe.
8. **Complaints:** AAIP (Argentina); the client's local authority (AEPD for Spain / other EU DPA, ANPD Brazil, URCDP Uruguay, Chile's Agencia de Protección de Datos Personales once operative, Mexico's Secretaría Anticorrupción y Buen Gobierno).
9. **Cookies:** strictly necessary (Clerk, Cloudflare) vs analytics (GA4, consent mode) vs third-party embeds (YouTube privacy-enhanced).
10. **AI assistant (Digui):** what it can access for logged-in users (profile without health data/DNI, bookings, evaluations, payments), that it is automated, human escalation, no significant automated decisions, transcript retention.
11. **US clients:** short statement that CCPA does not apply. Consider a Washington consumer-health-data paragraph if US marketing is undertaken.

### Gaps
- The exact mandatory Argentine legend (AAIP Disp. 10/2008) and Ley 25.326 art. 6 information list were not researched here. They are presumed covered by the Argentina-law research notes.
- Retention durations for each provider (Resend log retention, Clerk logs, Digui transcripts) were not found.
