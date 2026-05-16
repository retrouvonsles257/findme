#!/usr/bin/env python3
"""
Génère deux documentations PDF : SOS et Messagerie (RetrouvonsLes).
Usage: python3 documentation/scripts/generate_sos_messagerie_pdfs.py
"""
from __future__ import annotations

import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "pdf")
TODAY = date.today().strftime("%d/%m/%Y")
DOC_VERSION = "1.0"


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#94a3b8"))
    canvas.drawCentredString(A4[0] / 2, 1.2 * cm, f"RetrouvonsLes — {canvas.getPageNumber()}")
    canvas.restoreState()


def flow_box(text: str, styles) -> Preformatted:
    return Preformatted(text.strip(), styles["mono"], maxLineLength=95)


def build_styles():
    base = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "DocTitle",
            parent=base["Title"],
            fontSize=22,
            spaceAfter=12,
            textColor=colors.HexColor("#0f172a"),
        ),
        "subtitle": ParagraphStyle(
            "DocSubtitle",
            parent=base["Normal"],
            fontSize=11,
            textColor=colors.HexColor("#475569"),
            spaceAfter=24,
            alignment=TA_CENTER,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontSize=16,
            spaceBefore=18,
            spaceAfter=10,
            textColor=colors.HexColor("#0369a1"),
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontSize=13,
            spaceBefore=14,
            spaceAfter=8,
            textColor=colors.HexColor("#0f172a"),
        ),
        "h3": ParagraphStyle(
            "H3",
            parent=base["Heading3"],
            fontSize=11,
            spaceBefore=10,
            spaceAfter=6,
            textColor=colors.HexColor("#334155"),
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontSize=10,
            leading=14,
            alignment=TA_JUSTIFY,
            spaceAfter=8,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["Normal"],
            fontSize=10,
            leading=13,
            leftIndent=12,
            spaceAfter=4,
        ),
        "scenario": ParagraphStyle(
            "Scenario",
            parent=base["Normal"],
            fontSize=10,
            leading=14,
            leftIndent=8,
            backColor=colors.HexColor("#f1f5f9"),
            borderPadding=8,
            spaceAfter=12,
        ),
        "mono": ParagraphStyle(
            "Mono",
            parent=base["Code"],
            fontSize=9,
            leading=12,
            fontName="Courier",
            textColor=colors.HexColor("#1e293b"),
        ),
        "footer": ParagraphStyle(
            "Footer",
            parent=base["Normal"],
            fontSize=8,
            textColor=colors.HexColor("#94a3b8"),
            alignment=TA_CENTER,
        ),
    }
    return styles


def bullet_list(items, styles):
    return ListFlowable(
        [ListItem(Paragraph(i, styles["bullet"]), leftIndent=12) for i in items],
        bulletType="bullet",
        start="•",
    )


def simple_table(data, col_widths=None):
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0ea5e9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return t


def add_header_block(story, title, subtitle, styles):
    story.append(Paragraph(title, styles["title"]))
    story.append(Paragraph(subtitle, styles["subtitle"]))
    story.append(
        Paragraph(
            f"<i>Document généré le {TODAY} — RetrouvonsLes (application web citoyen / autorité)</i>",
            styles["footer"],
        )
    )
    story.append(Spacer(1, 0.5 * cm))


def build_sos_doc():
    styles = build_styles()
    path = os.path.join(OUT_DIR, "RetrouvonsLes_Documentation_SOS.pdf")
    doc = SimpleDocTemplate(
        path,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2.2 * cm,
        bottomMargin=2.2 * cm,
        title="Documentation SOS — RetrouvonsLes",
    )
    doc._doc_title = "SOS"
    story = []

    add_header_block(
        story,
        "Documentation fonctionnelle et technique",
        "Fonctionnalité <b>SOS — Alerte d'urgence citoyenne</b>",
        styles,
    )

    story.append(Paragraph("1. Objet et périmètre", styles["h1"]))
    story.append(
        Paragraph(
            "Le bouton SOS permet à un citoyen connecté de déclencher une <b>alerte d'urgence personnelle</b> "
            "en cas de danger réel. L'application enregistre un événement, tente de capturer la position GPS, "
            "notifie les <b>autorités compétentes</b> (avec ciblage géographique) et envoie des <b>e-mails</b> "
            "aux contacts d'urgence enregistrés. Ce dispositif <b>ne remplace pas</b> les numéros d'urgence nationaux "
            "(17, 15, 112, etc.) : un encadré d'avertissement est affiché sur la page SOS.",
            styles["body"],
        )
    )

    story.append(Paragraph("2. Quand utiliser le SOS ?", styles["h1"]))
    story.append(
        bullet_list(
            [
                "<b>Oui</b> : danger immédiat pour soi-même, besoin d'alerter proches et autorités rapidement.",
                "<b>Non</b> : signalement d'une disparition de tiers → utiliser <i>pré-déclaration</i> ou <i>signalement</i>.",
                "<b>Non</b> : simple demande d'information à la police → messagerie sur pré-déclaration ou dossier.",
                "<b>Attention</b> : abus ou tests répétés → limitation (3 SOS « envoyés » par heure par utilisateur).",
            ],
            styles,
        )
    )

    story.append(Paragraph("3. Parcours utilisateur citoyen", styles["h1"]))
    story.append(Paragraph("3.1 Navigation", styles["h2"]))
    story.append(
        bullet_list(
            [
                "Menu principal → <b>SOS</b> (<code>/citizen/sos</code>).",
                "Sous-page <b>Contacts d'urgence</b> (<code>/citizen/sos/contacts</code>).",
                "Page publique de vérification e-mail : <code>/verify-sos-contact?token=…</code>.",
            ],
            styles,
        )
    )

    story.append(Paragraph("3.2 Configuration des contacts", styles["h2"]))
    story.append(
        Paragraph(
            "Le citoyen ajoute jusqu'à plusieurs contacts (nom, e-mail, relation). Chaque contact peut être "
            "<b>vérifié par e-mail</b> : envoi automatique via l'Edge Function <code>sos-contact-verification-email</code> "
            "ou copie manuelle du lien (jeton valide 7 jours). Les e-mails SOS partent vers <b>tous</b> les contacts "
            "enregistrés au moment du dispatch (vérification recommandée mais non bloquante à l'envoi).",
            styles["body"],
        )
    )

    story.append(Paragraph("3.3 Déclenchement (compte à rebours 15 s)", styles["h2"]))
    story.append(
        Paragraph(
            "<b>Phase 1 — Idle</b> : message d'urgence modifiable (défaut : « Je me sens en danger… »), "
            "demande de géolocalisation au clic sur « Démarrer la procédure ».",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>Phase 2 — Compte à rebours</b> : 15 secondes avec bouton <b>Annuler</b>. "
            "L'annulation appelle l'Edge Function en mode <code>abort_trace</code> : création d'un événement "
            "<code>statut = annule</code> (trace interne, pas d'alerte aux autorités ni aux contacts).",
            styles["body"],
        )
    )
    story.append(
        Paragraph(
            "<b>Phase 3 — Envoi</b> : appel <code>sos-dispatch</code> mode <code>dispatch</code> avec message, "
            "latitude/longitude/précision si disponibles. Retour UI : succès, avertissement si aucun contact, "
            "ou détail si échec partiel des e-mails Brevo.",
            styles["body"],
        )
    )

    story.append(Paragraph("3.4 Historique citoyen", styles["h2"]))
    story.append(
        Paragraph(
            "Liste des événements SOS de l'utilisateur : statuts <i>annulé</i>, <i>envoyé</i>, <i>traité</i>. "
            "Lien « Voir sur la carte » si position connue. Lorsqu'une autorité marque l'alerte comme prise en charge, "
            "le citoyen reçoit une <b>notification push</b> (trigger base + FCM).",
            styles["body"],
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("4. Parcours autorité", styles["h1"]))
    story.append(Paragraph("4.1 Accès", styles["h2"]))
    story.append(
        bullet_list(
            [
                "Menu opérationnel → <b>Alertes SOS</b> (<code>/authority/sos</code>).",
                "Pastille rouge sur le menu : nombre d'événements <code>statut = envoye</code> (temps réel Supabase).",
                "Lien direct depuis notification push : <code>/authority/sos?focus={id}</code>.",
            ],
            styles,
        )
    )

    story.append(Paragraph("4.2 Liste et filtres", styles["h2"]))
    story.append(
        bullet_list(
            [
                "Filtre <b>Actifs</b> (non traités) / <b>Tous</b>.",
                "Filtre assignation : toutes, non assignées, <b>ma structure</b> (organisation du compte).",
                "Carte par alerte : citoyen, date, message, GPS (lien Google Maps) ou « sans position ».",
            ],
            styles,
        )
    )

    story.append(Paragraph("4.3 Actions", styles["h2"]))
    story.append(
        bullet_list(
            [
                "<b>Assigner une organisation</b> : champ <code>id_organisation_assignee</code> (coordination interne).",
                "<b>Marquer comme pris en charge</b> : passage <code>envoye → traite</code>, "
                "<code>handled_by</code> + <code>handled_at</code> ; notifie le citoyen.",
            ],
            styles,
        )
    )

    story.append(Paragraph("5. Architecture technique", styles["h1"]))
    story.append(Paragraph("5.1 Tables principales", styles["h2"]))
    story.append(
        simple_table(
            [
                ["Table", "Rôle"],
                ["contact_urgence", "Contacts e-mail du citoyen (RLS propriétaire)"],
                ["sos_event", "Événement SOS ; INSERT via service role (Edge uniquement)"],
                ["notification", "Alertes in-app + déclenchement push FCM (webhook)"],
            ],
            col_widths=[4 * cm, 12 * cm],
        )
    )
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph("5.2 Statuts sos_event", styles["h2"]))
    story.append(
        simple_table(
            [
                ["Statut", "Signification"],
                ["annule", "Procédure annulée pendant le compte à rebours (trace)"],
                ["envoye", "Alerte active, visible aux autorités"],
                ["traite", "Prise en charge déclarée par une autorité"],
            ],
            col_widths=[3 * cm, 13 * cm],
        )
    )
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph("5.3 Schéma de flux (envoi SOS)", styles["h2"]))
    story.append(
        flow_box(
            """
[Citoyen] Page /citizen/sos
    |  Clic "Démarrer la procédure" + géolocalisation
    v
[Compte à rebours 15 s] ---- Annuler ----> Edge abort_trace --> sos_event (annule)
    |  Fin du délai
    v
[Edge sos-dispatch] mode=dispatch
    |-- Rate limit (max 3 / heure)
    |-- INSERT sos_event (statut=envoye)
    |-- E-mails Brevo --> contact_urgence.*
    |-- SELECT autorités (pays/région) --> INSERT notification (priorité haute)
    v
[Webhook] notification-fcm-send --> Push FCM / Web Push autorités
    |
[Autorité] /authority/sos (Realtime) --> Assigner org --> Marquer traité
    |
[Trigger DB] --> notification citoyen (sos_handled) --> Push citoyen
            """,
            styles,
        )
    )
    story.append(Spacer(1, 0.2 * cm))

    story.append(Paragraph("5.4 Edge Function sos-dispatch", styles["h2"]))
    story.append(
        bullet_list(
            [
                "Authentification JWT Supabase (JWKS) ; pas de JWT au gateway (<code>verify_jwt = false</code>).",
                "Mode <code>dispatch</code> : rate limit 3/heure ; INSERT <code>envoye</code> ; e-mails Brevo aux contacts.",
                "Ciblage autorités : pays du citoyen → organisations actives ; affinage région ; "
                "sinon repli toutes autorités notifiables.",
                "INSERT notifications priorité <code>haute</code>, métadonnées <code>event: sos_dispatch</code>.",
                "Mode <code>abort_trace</code> : INSERT <code>annule</code> sans notifications externes.",
            ],
            styles,
        )
    )

    story.append(Paragraph("5.5 Autres composants", styles["h2"]))
    story.append(
        bullet_list(
            [
                "<code>sos-contact-verification-email</code> : jeton + e-mail Brevo (PUBLIC_APP_URL).",
                "<code>notification-fcm-send</code> : push prioritaire pour SOS ; lien clic SOS autorité/citoyen.",
                "Migration <code>20260521</code> : Realtime sur sos_event + trigger notif citoyen « traité ».",
            ],
            styles,
        )
    )

    story.append(Paragraph("6. Scénarios détaillés", styles["h1"]))

    scenarios = [
        (
            "Scénario A — SOS réussi avec GPS et contacts vérifiés",
            "Marie configure deux contacts et vérifie leurs e-mails. En situation de danger, elle lance la procédure, "
            "accepte la géolocalisation, laisse le compte à rebours expirer. Un événement <i>envoyé</i> est créé. "
            "Les contacts reçoivent un e-mail Brevo avec message et lien Maps. Les autorités de sa région reçoivent "
            "une notification push et voient l'alerte dans la liste SOS. Une autorité assigne son organisation, "
            "intervient, puis marque « pris en charge » : Marie reçoit une notification sur son téléphone.",
        ),
        (
            "Scénario B — Annulation pendant le compte à rebours",
            "Jean appuie par erreur sur SOS, annule à 12 secondes. Aucun e-mail, aucune alerte autorité. "
            "L'historique affiche une ligne <i>annulé</i> (audit interne possible).",
        ),
        (
            "Scénario C — GPS refusé",
            "Le navigateur refuse la position : l'événement est enregistré avec <code>sans_position = true</code>. "
            "Le message aux contacts et autorités précise l'absence de GPS ; l'autorité voit « Sans position GPS ».",
        ),
        (
            "Scénario D — Rate limit",
            "Trois SOS <i>envoyés</i> dans l'heure : le quatrième renvoie HTTP 429 ; message « Trop de SOS récents ».",
        ),
        (
            "Scénario E — Brevo indisponible",
            "L'événement et les notifications autorités sont créés ; les e-mails contacts échouent. "
            "L'UI citoyen affiche un avertissement avec indication de vérifier les secrets Brevo.",
        ),
        (
            "Scénario F — Aucun contact enregistré",
            "SOS envoyé : autorités notifiées ; message citoyen « Aucun contact enregistré : aucun e-mail envoyé ».",
        ),
    ]
    for title, body in scenarios:
        story.append(Paragraph(f"<b>{title}</b>", styles["h3"]))
        story.append(Paragraph(body, styles["scenario"]))

    story.append(Paragraph("7. Exploitation (checklist)", styles["h1"]))
    story.append(
        bullet_list(
            [
                "Migrations SOS 20260515 → 20260521 appliquées sur Supabase.",
                "Edge Functions déployées : sos-dispatch, sos-contact-verification-email, notification-fcm-send.",
                "Secrets : BREVO_*, PUBLIC_APP_URL, FIREBASE_*, NOTIFICATION_FCM_SECRET.",
                "Webhook INSERT sur table notification → notification-fcm-send.",
                "Publication Realtime : table sos_event incluse.",
            ],
            styles,
        )
    )

    story.append(Paragraph("8. Matrice rôles / actions", styles["h1"]))
    story.append(
        simple_table(
            [
                ["Acteur", "Action", "Résultat"],
                ["Citoyen", "Configurer contacts", "contact_urgence"],
                ["Citoyen", "Envoyer SOS", "sos_event envoye + e-mails + notifs"],
                ["Citoyen", "Annuler (countdown)", "sos_event annule"],
                ["Contact e-mail", "Ouvrir lien vérification", "email_verifie=true"],
                ["Autorité", "Voir liste SOS", "Lecture RLS sos_event"],
                ["Autorité", "Marquer traité", "statut traite + notif citoyen"],
                ["Système", "Rate limit / Brevo / FCM", "Selon config et quotas"],
            ],
            col_widths=[3 * cm, 5 * cm, 8 * cm],
        )
    )

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    return path


def build_messagerie_doc():
    styles = build_styles()
    path = os.path.join(OUT_DIR, "RetrouvonsLes_Documentation_Messagerie.pdf")
    doc = SimpleDocTemplate(
        path,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2.2 * cm,
        bottomMargin=2.2 * cm,
        title="Documentation Messagerie — RetrouvonsLes",
    )
    story = []

    add_header_block(
        story,
        "Documentation fonctionnelle et technique",
        "Fonctionnalité <b>Messagerie citoyen — autorité</b> (mini-messagerie contextuelle)",
        styles,
    )

    story.append(Paragraph("1. Objet et philosophie produit", styles["h1"]))
    story.append(
        Paragraph(
            "La messagerie n'est <b>pas</b> un chat libre type messagerie instantanée générale. Chaque fil est "
            "<b>rattaché à un contexte métier unique</b> : pré-déclaration, dossier de disparition, ou signalement. "
            "Cela garantit la traçabilité, le contrôle d'accès (RLS) et l'alignement avec les workflows des autorités.",
            styles["body"],
        )
    )

    story.append(Paragraph("2. Les trois contextes de conversation", styles["h1"]))
    story.append(
        simple_table(
            [
                ["Contexte", "Qui ouvre le fil ?", "Où dans l'UI ?"],
                [
                    "Pré-déclaration",
                    "Automatique à la soumission citoyenne",
                    "Citoyen : détail pré-déclaration ; Autorité : liste + détail",
                ],
                [
                    "Dossier",
                    "Citoyen créateur ou autorité org. responsable",
                    "Dossier public (créateur) ; Détail dossier autorité (onglet Messagerie)",
                ],
                [
                    "Signalement",
                    "Autorité si signalement lié à un dossier de son org.",
                    "Détail signalement autorité (bloc Messagerie)",
                ],
            ],
            col_widths=[3.2 * cm, 5.5 * cm, 7.3 * cm],
        )
    )
    story.append(Spacer(1, 0.3 * cm))
    story.append(
        Paragraph(
            "Contrainte base : exactement <b>un</b> parmi <code>id_pre_declaration</code>, "
            "<code>id_dossier</code>, <code>id_signalement</code> est renseigné par conversation.",
            styles["body"],
        )
    )

    story.append(Paragraph("3. Pré-déclaration — flux complet", styles["h1"]))
    story.append(Paragraph("3.1 Cycle de vie pré-déclaration", styles["h2"]))
    story.append(
        simple_table(
            [
                ["Statut", "Messagerie"],
                ["soumise", "Fil ouvert ; échanges possibles"],
                ["en_examen", "Fil ouvert ; autorité peut demander des pièces"],
                ["convertie", "Fil clos (dossier officiel créé)"],
                ["rejetee", "Fil clos ; motif affiché ; notif citoyen"],
            ],
            col_widths=[3.5 * cm, 12.5 * cm],
        )
    )
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph("3.2 Parcours citoyen", styles["h2"]))
    story.append(
        bullet_list(
            [
                "<code>/citizen/pre-declarations/new</code> : formulaire structuré + choix de l'autorité destinataire.",
                "À la soumission : création pré-déclaration + conversation + message initial optionnel.",
                "<code>/citizen/pre-declarations/:id</code> : fil temps réel, pièces jointes (max 3), lecture des messages.",
            ],
            styles,
        )
    )

    story.append(Paragraph("3.3 Parcours autorité (page la plus riche)", styles["h2"]))
    story.append(
        bullet_list(
            [
                "Liste <code>/authority/pre-declarations</code>.",
                "Détail : fiche déclaration + fil + actions (examiner, rejeter, convertir en dossier).",
                "Types de message : texte, demande de complément, demande de pièce.",
                "Case « demande de traitement » ; références vers entités (dossier, document, etc.).",
                "Assignation agent, statut du fil, escalade vers autre organisation, tâches de suivi.",
                "Bouton « Marquer traité » sur messages du citoyen (RPC + pastille).",
            ],
            styles,
        )
    )

    story.append(PageBreak())
    story.append(Paragraph("4. Messagerie sur dossier et signalement", styles["h1"]))

    story.append(Paragraph("4.1 Dossier — citoyen créateur", styles["h2"]))
    story.append(
        Paragraph(
            "Sur la fiche dossier publique (<code>/citizen/dossier/:id</code>), l'onglet <b>Messagerie</b> n'apparaît "
            "que si l'utilisateur connecté est le <code>id_utilisateur_createur</code>. Composant "
            "<code>CitizenDossierMessagerieSection</code> : ouverture ou reprise du fil, envoi de messages, PJ, temps réel.",
            styles["body"],
        )
    )

    story.append(Paragraph("4.2 Dossier — autorité", styles["h2"]))
    story.append(
        Paragraph(
            "Détail dossier autorité : onglet <b>Messagerie</b> avec <code>AuthorityContextMessagerieTab</code>. "
            "L'autorité dont l'organisation est <code>id_organisation_responsable</code> peut créer le fil s'il n'existe pas. "
            "Marquer traité les messages du citoyen ; notifications selon l'expéditeur.",
            styles["body"],
        )
    )

    story.append(Paragraph("4.3 Signalement", styles["h2"]))
    story.append(
        Paragraph(
            "Sur le détail signalement autorité, le bloc messagerie n'apparaît que si un <b>dossier lié</b> existe "
            "(l'org responsable du dossier détermine l'accès). Le fil est indexé sur <code>id_signalement</code>.",
            styles["body"],
        )
    )

    story.append(Paragraph("5. Fonctionnalités transverses des messages", styles["h1"]))
    story.append(
        simple_table(
            [
                ["Fonctionnalité", "Description"],
                ["Texte", "Corps obligatoire, max 8000 caractères"],
                ["Pièces jointes", "Cloudinary, max 3 fichiers (PDF/images)"],
                ["Références", "Liens typés vers dossier, signalement, document, etc."],
                ["Types (autorité)", "texte, demande_complement, demande_piece, note_systeme"],
                ["Métadonnées", "demande_traitement, traite_messagerie (RPC)"],
                ["Soft-delete", "Auteur peut supprimer son message (deleted_at)"],
                ["Lecture", "message_lecture : marquage lu par participant"],
                ["Temps réel", "Subscription Supabase sur table message"],
            ],
            col_widths=[4 * cm, 12 * cm],
        )
    )
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph("6. Sécurité et accès (RLS)", styles["h1"]))
    story.append(
        Paragraph(
            "La fonction <code>conversation_user_can_access(id)</code> centralise les droits : citoyen propriétaire "
            "de la pré-déclaration, créateur du dossier, auteur du signalement ; autorité de l'organisation destinataire, "
            "responsable du dossier, ou bénéficiaire d'une <b>escalade</b> (<code>id_organisation_escalade</code>). "
            "Admin système : accès total.",
            styles["body"],
        )
    )

    story.append(Paragraph("7. Schéma de flux (pré-déclaration)", styles["h1"]))
    story.append(
        flow_box(
            """
[Citoyen] Formulaire /citizen/pre-declarations/new
    |  Soumission
    v
[API] INSERT pre_declaration_citoyenne (statut=soumise)
    |  INSERT conversation (id_pre_declaration)
    |  Message initial optionnel
    |  notifyAuthoritiesNewPreDeclaration()
    v
[Autorité] /authority/pre-declarations/:id
    |  Messages typés, PJ, références, tâches
    |  Actions: en_examen | rejetee | convertie (dossier)
    v
[Conversion] id_dossier renseigné, statut=convertie --> fil pré-déclaration clos
            """,
            styles,
        )
    )
    story.append(Spacer(1, 0.2 * cm))

    story.append(Paragraph("8. Statuts conversation", styles["h1"]))
    story.append(
        simple_table(
            [
                ["Statut fil", "Signification"],
                ["ouverte", "Échanges actifs"],
                ["en_attente", "En attente de réponse d'une partie"],
                ["traitee", "Traitement terminé côté autorité"],
                ["fermee", "Fil clos définitivement"],
            ],
            col_widths=[3.5 * cm, 12.5 * cm],
        )
    )
    story.append(Spacer(1, 0.3 * cm))

    story.append(Paragraph("9. Notifications", styles["h1"]))
    story.append(
        bullet_list(
            [
                "Nouvelle pré-déclaration → autorités de l'org destinataire.",
                "Message citoyen → autorités ; message autorité → citoyen.",
                "Dossier / signalement : branches dédiées dans <code>sendContextMessagerieMessage</code>.",
                "Push FCM via insertion table <code>notification</code> + webhook.",
            ],
            styles,
        )
    )

    story.append(Paragraph("10. Tâches de suivi (autorité)", styles["h1"]))
    story.append(
        Paragraph(
            "Table <code>messagerie_tache_suivi</code> : tâches liées au fil (titre, description, statuts ouverte / "
            "en_cours / faite / annulée). Gérées depuis la page détail pré-déclaration autorité.",
            styles["body"],
        )
    )

    story.append(Paragraph("11. Scénarios détaillés", styles["h1"]))

    scenarios = [
        (
            "Scénario 1 — Première pré-déclaration",
            "Un citoyen remplit le formulaire, choisit la gendarmerie de sa région, ajoute un message initial. "
            "La conversation est créée automatiquement. Les agents reçoivent une notification, ouvrent le fil, "
            "envoient une « demande de pièce » avec référence au type document. Le citoyen répond avec PJ. "
            "L'autorité convertit en dossier officiel : le fil pré-déclaration est clos.",
        ),
        (
            "Scénario 2 — Rejet motivé",
            "L'autorité juge la déclaration hors périmètre, saisit un motif, rejette. Le citoyen reçoit une "
            "notification ; le fil est en lecture seule avec bannière de clôture.",
        ),
        (
            "Scénario 3 — Échange sur dossier ouvert",
            "Dossier déjà créé par le citoyen. Onglet Messagerie sur sa fiche publique : il demande une mise à jour. "
            "L'enquêteur répond depuis l'onglet Messagerie du dossier côté autorité et marque le message comme traité.",
        ),
        (
            "Scénario 4 — Signalement lié à un dossier",
            "Un témoin a un signalement rattaché au dossier X. L'autorité responsable ouvre le détail signalement, "
            "utilise le fil messagerie pour demander une précision au signaleur (si compte utilisateur).",
        ),
        (
            "Scénario 5 — Escalade inter-organisations",
            "Organisation A reçoit une pré-déclaration complexe et escalade vers organisation B. "
            "Les agents de B accèdent au même fil grâce à <code>id_organisation_escalade</code>.",
        ),
        (
            "Scénario 6 — Hors périmètre SOS",
            "Un citoyen confond SOS et demande d'aide sur disparition : il doit utiliser la pré-déclaration "
            "ou la messagerie dossier, pas le bouton SOS (réservé au danger personnel immédiat).",
        ),
    ]
    for title, body in scenarios:
        story.append(Paragraph(f"<b>{title}</b>", styles["h3"]))
        story.append(Paragraph(body, styles["scenario"]))

    story.append(Paragraph("12. Fichiers et migrations clés", styles["h1"]))
    story.append(
        bullet_list(
            [
                "Migrations : 20260514 (MVP), 20260518 (enrichissement), 20260519 (contextes + RLS), 20260520 (RPC traiter).",
                "API : <code>src/features/preDeclarations/preDeclarationApi.ts</code>.",
                "UI autorité contexte : <code>AuthorityContextMessagerieTab.tsx</code>.",
                "UI citoyen dossier : <code>CitizenDossierMessagerieSection.tsx</code>.",
            ],
            styles,
        )
    )

    story.append(Paragraph("13. Différences SOS vs Messagerie", styles["h1"]))
    story.append(
        simple_table(
            [
                ["Critère", "SOS", "Messagerie"],
                ["Objectif", "Danger immédiat personnel", "Échange structuré sur un dossier métier"],
                ["Déclenchement", "Compte à rebours + Edge Function", "Formulaire / onglet contextuel"],
                ["Contacts externes", "E-mails d'urgence (Brevo)", "Non (participants in-app)"],
                ["Table dédiée", "sos_event", "conversation + message"],
            ],
            col_widths=[3.5 * cm, 5.5 * cm, 7 * cm],
        )
    )

    story.append(Paragraph("14. Quand utiliser quoi ? (guide rapide)", styles["h1"]))
    story.append(
        bullet_list(
            [
                "<b>Disparition d'un proche, pas encore de dossier</b> → Pré-déclaration + messagerie associée.",
                "<b>Dossier déjà ouvert, échange avec l'enquêteur</b> → Onglet Messagerie du dossier.",
                "<b>Précision sur un signalement</b> → Messagerie sur fiche signalement (si dossier lié).",
                "<b>Danger personnel immédiat</b> → SOS (pas la messagerie).",
            ],
            styles,
        )
    )

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    return path


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    sos_path = build_sos_doc()
    msg_path = build_messagerie_doc()
    print(f"PDF SOS : {sos_path}")
    print(f"PDF Messagerie : {msg_path}")


if __name__ == "__main__":
    main()
