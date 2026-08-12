# -*- coding: utf-8 -*-
# Déclare l'encodage du fichier source comme UTF-8 (nécessaire pour les accents)

import warnings
warnings.filterwarnings("ignore")
# Supprime tous les avertissements Python à l'exécution pour garder la console propre

import pandas as pd
# Importe pandas pour la manipulation de données tabulaires (DataFrames)

import plotly.graph_objects as go
# Importe le module graph_objects de Plotly pour construire des figures interactives manuellement

from dash import Dash, dcc, html, Input, Output
# Importe les éléments Dash nécessaires :
#   Dash      → classe principale de l'application web
#   dcc       → composants interactifs (graphiques, onglets, dropdowns…)
#   html      → composants HTML (Div, H1, P…)
#   Input/Output → décorateurs pour les callbacks réactifs


# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

BASE = r"C:\Users\linab\OneDrive\Documents\cleaned_bilans" + "\\"
# Chemin racine vers le dossier contenant les fichiers CSV
# Le préfixe r"..." indique une chaîne brute (les \ ne sont pas des caractères d'échappement)
# On concatène un \ final pour former les chemins complets plus tard


# ─────────────────────────────────────────────
# LOAD TABLES
# ─────────────────────────────────────────────

def load(name: str) -> pd.DataFrame:
    # Fonction utilitaire : lit un fichier CSV depuis le dossier BASE
    # name : nom du fichier sans extension
    # Retourne un DataFrame pandas
    return pd.read_csv(BASE + f"{name}.csv", sep=";", encoding="utf-8-sig")
    # sep=";"      → les colonnes sont séparées par des points-virgules (format européen)
    # encoding="utf-8-sig" → gère le BOM UTF-8 souvent présent dans les exports Excel

# Chargement de chaque table dimensionnelle et de fait
fact_part   = load("fact_participations_formations")  # Table de fait : participations aux formations
fact_dem    = load("fact_demandes")                   # Table de fait : demandes de formation
dim_form    = load("dim_formation")                   # Dimension : caractéristiques des formations
dim_emp     = load("dim_employe")                     # Dimension : informations sur les employés
dim_fmt     = load("dim_formateur")                   # Dimension : formateurs (id, nom, type, bureau)
dim_status  = load("dim_status")                      # Dimension : statuts de demande (Approuvée, Refusée…)
dim_date    = load("dim_date")                        # Dimension : calendrier (jour, mois, trimestre, année…)
dim_etat    = load("dim_etat_formation")              # Dimension : états d'une formation (Terminée, Annulée…)

# Normalisation des noms de colonnes pour uniformiser les variations d'accents/casse
dim_date.rename(columns={"année": "annee", "Date_complete": "date_complete"}, inplace=True)
# "année" → "annee" (supprime l'accent) ; "Date_complete" → "date_complete" (uniformise la casse)

dim_etat.rename(columns={"libellé": "libelle"}, inplace=True)
# "libellé" → "libelle" (supprime l'accent)

dim_form.rename(columns={"thème": "theme"}, inplace=True)
# "thème" → "theme" (supprime l'accent)


# ─────────────────────────────────────────────
# BUILD ANALYTICAL TABLES
# ─────────────────────────────────────────────

# ── Participation fact (enriched) ─────────────────────────────────────────────
part = (
    fact_part
    # 1. Jointure avec dim_formation pour récupérer les attributs de la formation
    .merge(dim_form[["id_formation", "mode", "category", "montant",
                      "id_formateur", "id_etat", "id_date_debut"]], on="id_formation", how="left")

    # 2. Jointure avec dim_date pour récupérer l'année de début de formation
    .merge(dim_date[["id_date", "annee"]], left_on="id_date_debut", right_on="id_date", how="left")

    # 3. Jointure avec dim_employe pour enrichir avec genre, poste et département de l'employé
    .merge(dim_emp[["matricule", "genre", "poste", "departement"]], on="matricule", how="left")

    # 4. Jointure avec dim_formateur pour récupérer le type et le bureau du formateur
    #    On renomme "type" → "formateur_type" et "bureau" → "formateur_bureau" pour éviter les conflits
    .merge(dim_fmt[["id_formateur", "type", "bureau"]]
           .rename(columns={"type": "formateur_type", "bureau": "formateur_bureau"}),
           on="id_formateur", how="left")
)
# Résultat : table enrichie contenant toutes les infos utiles par participation

# ── Demandes fact (enriched) ──────────────────────────────────────────────────
dem = (
    fact_dem
    # 1. Jointure avec dim_date pour récupérer l'année de la demande
    .merge(dim_date[["id_date", "annee"]], on="id_date", how="left")

    # 2. Jointure avec dim_status pour avoir le libellé du statut (Approuvée, Refusée…)
    .merge(dim_status, on="id_status", how="left")

    # 3. Jointure avec dim_employe pour avoir le genre et le poste du demandeur
    .merge(dim_emp[["matricule", "genre", "poste"]], on="matricule", how="left")
)

# Affichage de contrôle : colonnes et forme de la table des participations
print("=== part columns:", part.columns.tolist())   # Liste toutes les colonnes disponibles
print("=== part shape:", part.shape)                # (nb_lignes, nb_colonnes)
print("=== part nulls in key cols:")
print(part[["mode", "category", "annee", "genre"]].isnull().sum())
# Compte les valeurs manquantes dans les colonnes clés pour détecter les jointures ratées

# Affichage de contrôle pour la table des demandes
print("=== dem columns:", dem.columns.tolist())
print("=== dem nulls:", dem[["category", "annee", "status", "genre"]].isnull().sum())


# ─────────────────────────────────────────────
# GLOBAL KPIs
# ─────────────────────────────────────────────

TOTAL_FORMATIONS    = len(dim_form)
# Nombre total de formations dans le référentiel

FORMATIONS_ANNULEES = (dim_form["id_etat"] == "A").sum()
# Compte les formations dont l'état est "A" (Annulée)

TAUX_ANNULATION     = round(FORMATIONS_ANNULEES / TOTAL_FORMATIONS * 100, 2) if TOTAL_FORMATIONS else 0
# Pourcentage de formations annulées (arrondi à 2 décimales) ; 0 si aucune formation

TOTAL_PART          = int(fact_part["nb_participants"].sum())
# Nombre total de participations (somme de tous les nb_participants)

EMPLOYES_FORMES     = fact_part["matricule"].nunique()
# Nombre d'employés distincts ayant participé à au moins une formation

TOTAL_JOURS         = int(fact_part["nb_jours"].sum()) if "nb_jours" in fact_part.columns else 0
# Total des jours de formation ; 0 si la colonne nb_jours est absente du fichier

COUT_TOTAL          = dim_form.drop_duplicates("id_formation")["montant"].sum()
# Somme des coûts de toutes les formations (après dédoublonnage sur id_formation)

FORMATIONS_TERMINEES= (dim_form["id_etat"] == "T").sum()
# Nombre de formations ayant l'état "T" (Terminée)

TOTAL_DEMANDES      = int(dem["nb_demandes"].sum())
# Nombre total de demandes de formation tous statuts confondus

TOTAL_FORMATEURS    = dim_form["id_formateur"].nunique()
# Nombre de formateurs distincts ayant animé au moins une formation

TOTAL_EMPLOYES      = len(dim_emp)
# Nombre total d'employés dans la dimension employés

MOY_FORM_EMP        = round(TOTAL_FORMATIONS / EMPLOYES_FORMES, 2) if EMPLOYES_FORMES else 0
# Moyenne du nombre de formations par employé formé (0 si aucun employé formé)

_dem_approved = dem[dem["status"] == "Approuvée"]["nb_demandes"].sum()
# Nombre total de demandes ayant le statut "Approuvée" (variable intermédiaire privée)

_dem_total    = dem["nb_demandes"].sum()
# Nombre total de demandes toutes catégories et statuts confondus

TAUX_APPROBATION = round(_dem_approved / _dem_total * 100, 2) if _dem_total else 0
# Pourcentage de demandes approuvées sur le total (0 si aucune demande)


# ─────────────────────────────────────────────
# STYLE
# ─────────────────────────────────────────────

C = {
    "bg":      "#f4f6fb",   # Couleur de fond global (gris très clair)
    "card":    "#ffffff",   # Fond des cartes (blanc)
    "a1":      "#2563eb",   # Accent primaire (bleu)
    "a2":      "#059669",   # Accent secondaire (vert)
    "a3":      "#d97706",   # Accent tertiaire (orange/ambre)
    "a4":      "#dc2626",   # Accent danger (rouge)
    "a5":      "#7c3aed",   # Accent violet
    "text":    "#111827",   # Couleur de texte principal (quasi-noir)
    "muted":   "#6b7280",   # Texte secondaire/atténué (gris moyen)
    "grid":    "#e5e7eb",   # Couleur des grilles de graphiques (gris clair)
}
# Dictionnaire centralisé des couleurs — permet de changer le thème en un seul endroit

CAT_COLORS  = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#ea580c", "#16a34a"]
# Palette de couleurs pour les catégories de formations (7 couleurs distinctes)

MODE_COLORS = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#ea580c", "#16a34a", "#0891b2", "#be185d"]
# Palette étendue pour les modes de formation (9 couleurs pour plus de variété)

BASE_LAYOUT = dict(
    paper_bgcolor="rgba(0,0,0,0)",   # Fond de la figure transparent (hérite du fond de la carte)
    plot_bgcolor="rgba(0,0,0,0)",    # Fond de la zone de tracé transparent
    font=dict(color=C["text"], family="Segoe UI, Arial"),  # Police et couleur de texte globales
    margin=dict(l=30, r=20, t=40, b=40),  # Marges internes du graphique (gauche, droite, haut, bas)
    legend=dict(bgcolor="rgba(0,0,0,0)", font=dict(color=C["text"])),  # Légende transparente
    xaxis=dict(gridcolor=C["grid"], zerolinecolor=C["grid"]),  # Grilles de l'axe X
    yaxis=dict(gridcolor=C["grid"], zerolinecolor=C["grid"]),  # Grilles de l'axe Y
)
# Layout de base réutilisé dans tous les graphiques pour une apparence cohérente

GRAPH_STYLE = {"height": "360px"}
# Style CSS appliqué à tous les composants dcc.Graph — hauteur fixe de 360px


# ─────────────────────────────────────────────
# UI HELPERS
# ─────────────────────────────────────────────

def fmt_num(n, suffix=""):
    # Formate un nombre en notation lisible (K pour milliers, M pour millions)
    # n      : valeur numérique à formater
    # suffix : suffixe optionnel à ajouter (ex: " TND")
    if pd.isna(n):
        return "N/A"           # Retourne "N/A" si la valeur est manquante
    n = float(n)               # Convertit en flottant pour les calculs
    if n >= 1_000_000:
        return f"{n/1_000_000:.2f}M{suffix}"   # Ex: 1 500 000 → "1.50M"
    if n >= 1_000:
        return f"{n/1_000:.0f}K{suffix}"       # Ex: 45 000 → "45K"
    return f"{n:,.0f}{suffix}  "               # Ex: 850 → "850"


def kpi_card(label, value, color=None):
    # Génère une carte KPI : valeur chiffrée en grand + libellé en petit
    # label : texte descriptif affiché sous la valeur
    # value : valeur à afficher (chaîne de caractères)
    # color : couleur de la bordure supérieure et du chiffre (défaut : bleu a1)
    color = color or C["a1"]   # Utilise le bleu par défaut si aucune couleur fournie
    return html.Div([
        html.Div(value, style={
            "fontSize": "1.7rem",    # Grande taille pour la valeur principale
            "fontWeight": "700",     # Gras
            "color": color           # Couleur de l'accent
        }),
        html.Div(label, style={
            "fontSize": "0.72rem",   # Petite taille pour le libellé
            "color": C["muted"],     # Gris atténué
            "marginTop": "2px"       # Léger espace entre la valeur et le libellé
        }),
    ], style={
        "background": C["card"],                        # Fond blanc
        "borderRadius": "10px",                         # Coins arrondis
        "padding": "14px 16px",                         # Rembourrage interne
        "minWidth": "120px",                            # Largeur minimale pour éviter l'écrasement
        "flex": "1",                                    # Prend l'espace disponible dans le flex container
        "borderTop": f"3px solid {color}",              # Bordure supérieure colorée (signature visuelle)
        "boxShadow": "0 2px 12px rgba(0,0,0,0.3)",     # Ombre portée légère
    })


def section_title(text):
    # Génère un titre de section avec une barre colorée à gauche
    # text : texte du titre
    return html.H3(text, style={
        "color": C["a1"],                           # Texte en bleu
        "marginBottom": "10px",                     # Espace sous le titre
        "fontSize": "1rem",                         # Taille de police standard
        "letterSpacing": "0.05em",                  # Légère expansion des lettres
        "textTransform": "uppercase",               # Tout en majuscules
        "borderLeft": f"4px solid {C['a2']}",       # Barre verte à gauche
        "paddingLeft": "10px",                      # Espace entre la barre et le texte
    })


def card(fig, style=None):
    # Enveloppe un graphique Plotly dans une carte blanche avec ombre
    # fig   : objet go.Figure à afficher
    # style : dict CSS optionnel pour surcharger le style de la carte
    s = {
        "background": C["card"],                        # Fond blanc
        "borderRadius": "10px",                         # Coins arrondis
        "padding": "14px",                              # Rembourrage interne
        "boxShadow": "0 2px 12px rgba(0,0,0,0.25)"     # Ombre portée
    }
    if style:
        s.update(style)    # Fusionne le style personnalisé par-dessus le style de base
    return html.Div(
        dcc.Graph(figure=fig, config={"displayModeBar": False}, style=GRAPH_STYLE),
        # displayModeBar=False → masque la barre d'outils Plotly (téléchargement, zoom…)
        style=s,
    )


def grid(*children, cols=2):
    # Crée une grille CSS à N colonnes égales pour aligner les cartes côte à côte
    # children : composants Dash à placer dans la grille
    # cols     : nombre de colonnes (défaut : 2)
    return html.Div(list(children), style={
        "display": "grid",                                      # Activer CSS Grid
        "gridTemplateColumns": f"repeat({cols}, 1fr)",          # N colonnes de largeur égale
        "gap": "16px",                                          # Espacement entre les cellules
        "marginTop": "16px",                                    # Espace au-dessus de la grille
    })


# ─────────────────────────────────────────────
# CHARTS — OVERVIEW
# ─────────────────────────────────────────────

def chart_formations_by_category():
    # Graphique en anneau : répartition du nombre de formations par catégorie
    grp = dim_form.groupby("category").size().reset_index(name="count").sort_values("count", ascending=False)
    # Groupe les formations par catégorie, compte chaque groupe, trie par ordre décroissant
    grp["pct"] = (grp["count"] / grp["count"].sum() * 100).round(1)
    # Calcule le pourcentage de chaque catégorie (arrondi à 1 décimale)
    fig = go.Figure(go.Pie(
        labels=grp["category"],   # Libellés des tranches
        values=grp["count"],      # Tailles des tranches
        hole=0.45,                # Taille du trou central (anneau = ~45% de rayon vide)
        textinfo="percent+label", # Affiche le % et le libellé sur chaque tranche
        marker=dict(colors=CAT_COLORS, line=dict(color=C["bg"], width=2)),
        # Applique la palette de catégories ; ligne de séparation couleur fond
        hovertemplate="<b>%{label}</b><br>%{value} (%{percent})<extra></extra>",
        # Infobulle : Catégorie, nombre et pourcentage
    ))
    fig.update_layout(**BASE_LAYOUT, title="Formations par Catégorie", showlegend=False)
    # Applique le layout de base ; masque la légende (les labels sont sur le graphique)
    return fig


def chart_cout_by_category():
    # Graphique en anneau : répartition du coût total par catégorie
    """Cost by category — uses montant directly from dim_formation (no dim_facture needed)."""
    grp = dim_form.groupby("category")["montant"].sum().reset_index().sort_values("montant", ascending=False)
    # Somme les montants par catégorie, trie du plus coûteux au moins coûteux
    fig = go.Figure(go.Pie(
        labels=grp["category"],
        values=grp["montant"],
        hole=0.45,
        textinfo="percent+label",
        marker=dict(colors=CAT_COLORS, line=dict(color=C["bg"], width=2)),
        hovertemplate="<b>%{label}</b><br>%{value:,.0f} TND<extra></extra>",
        # Infobulle : affiche le coût avec séparateur de milliers et "TND" (Dinar tunisien)
    ))
    fig.update_layout(**BASE_LAYOUT, title="Coût Total par Catégorie", showlegend=False)
    return fig


def chart_formations_by_year():
    # Graphique en barres : nombre de formations par année
    """Join dim_formation → dim_date via id_date_debut."""
    fd = dim_form.merge(
        dim_date[["id_date", "annee"]], left_on="id_date_debut", right_on="id_date", how="left"
    )
    # Joint dim_formation avec dim_date via la date de début pour obtenir l'année
    grp = fd.groupby("annee").size().reset_index(name="count").dropna(subset=["annee"])
    # Groupe par année, compte les formations, supprime les lignes sans année
    grp["annee"] = grp["annee"].astype(int).astype(str)
    # Convertit l'année en entier puis en chaîne pour un affichage propre sur l'axe X
    fig = go.Figure(go.Bar(
        x=grp["annee"], y=grp["count"],
        marker=dict(color=CAT_COLORS[: len(grp)], line=dict(color=C["bg"], width=1)),
        # Chaque barre reçoit une couleur de la palette (slicing limité au nb de barres)
        hovertemplate="<b>%{x}</b><br>Formations: %{y}<extra></extra>",
    ))
    fig.update_layout(**BASE_LAYOUT, title="Formations par Année",
                      xaxis_title="Année", yaxis_title="Formations")
    return fig


def chart_formations_by_mode():
    # Graphique en anneau : répartition des formations selon leur mode (présentiel, e-learning…)
    """Mode is now a plain string column in dim_formation."""
    grp = dim_form.groupby("mode").size().reset_index(name="count").sort_values("count", ascending=False)
    # Groupe par mode, compte, trie
    grp["pct"] = (grp["count"] / grp["count"].sum() * 100).round(1)
    # Calcule le pourcentage de chaque mode
    fig = go.Figure(go.Pie(
        labels=grp["mode"], values=grp["count"],
        hole=0.45, textinfo="percent+label",
        marker=dict(colors=MODE_COLORS, line=dict(color=C["bg"], width=2)),
        hovertemplate="<b>%{label}</b><br>%{value}<extra></extra>",
    ))
    fig.update_layout(**{**BASE_LAYOUT, "legend": dict(font=dict(size=10))},
                  title="Formations par Mode", showlegend=True)
    # Décompression de BASE_LAYOUT puis surcharge de la clé "legend" pour réduire la taille de police
    return fig


def chart_formations_by_bureau():
    # Graphique en barres horizontales : top 20 formateurs par nombre de formations animées
    """Top 20 formateurs par nombre de formations."""
    fd = dim_form.merge(
        dim_fmt[["id_formateur", "nom"]].drop_duplicates("id_formateur"),
        on="id_formateur", how="left"
    )
    # Joint dim_formation avec le nom du formateur (dédoublonné pour éviter les faux doublons)
    grp = (fd.groupby("nom").size()
             .reset_index(name="count")
             .sort_values("count", ascending=True)   # Ordre croissant pour que le plus haut soit en haut
             .tail(20))                               # Garde seulement les 20 formateurs les plus actifs

    fig = go.Figure(go.Bar(
        x=grp["count"], y=grp["nom"],   # Barres horizontales : x = valeur, y = label
        orientation="h",
        marker=dict(color=C["a1"]),     # Toutes les barres en bleu
        text=grp["count"],              # Affiche le compteur au bout de chaque barre
        textposition="outside",         # Texte à l'extérieur de la barre
        hovertemplate="<b>%{y}</b><br>Formations: %{x}<extra></extra>",
    ))
    layout = {**BASE_LAYOUT, "title": "Top 20 Formateurs par Nombre de Formations"}
    layout["xaxis"] = dict(title="Formations", gridcolor=C["grid"])
    layout["yaxis"] = dict(gridcolor="rgba(0,0,0,0)", tickfont=dict(size=10))
    # Axe Y : grille transparente (pas de lignes horizontales) ; petite police pour les noms longs
    layout["margin"] = dict(l=180, r=40, t=40, b=40)
    # Marge gauche élargie à 180px pour laisser la place aux noms de formateurs
    fig.update_layout(**layout)
    return fig


# ─────────────────────────────────────────────
# CHARTS — PARTICIPATIONS
# ─────────────────────────────────────────────

def chart_participants_by_mode():
    # Graphique en anneau : nombre total de participants selon le mode de formation
    grp = part.groupby("mode")["nb_participants"].sum().reset_index().sort_values("nb_participants", ascending=False)
    # Somme les participants par mode, trie
    total = grp["nb_participants"].sum()
    grp["pct"] = (grp["nb_participants"] / total * 100).round(1)
    # Calcule le pourcentage de chaque mode
    fig = go.Figure(go.Pie(
        labels=grp["mode"], values=grp["nb_participants"],
        hole=0.45, textinfo="percent",           # N'affiche que le % sur la tranche (pas le libellé)
        customdata=grp[["mode", "pct"]],          # Données supplémentaires pour l'infobulle
        marker=dict(colors=MODE_COLORS, line=dict(color=C["bg"], width=2)),
        hovertemplate="<b>%{customdata[0]}</b><br>%{value:,} participants (%{customdata[1]}%)<extra></extra>",
        # Infobulle détaillée : mode, nb participants avec séparateur de milliers, pourcentage
    ))
    fig.update_layout(**{**BASE_LAYOUT, "legend": dict(font=dict(size=10))},
                  title="Participants par Mode", showlegend=True)
    return fig


def chart_participants_by_category():
    # Graphique en anneau : nombre total de participants par catégorie de formation
    grp = part.groupby("category")["nb_participants"].sum().reset_index().sort_values("nb_participants", ascending=False)
    fig = go.Figure(go.Pie(
        labels=grp["category"], values=grp["nb_participants"],
        hole=0.45, textinfo="percent+label",
        marker=dict(colors=CAT_COLORS, line=dict(color=C["bg"], width=2)),
        hovertemplate="<b>%{label}</b><br>%{value:,}<extra></extra>",
    ))
    fig.update_layout(**BASE_LAYOUT, title="Participants par Catégorie", showlegend=False)
    return fig


def chart_employes_by_genre():
    # Graphique en anneau : répartition homme/femme des employés ayant participé à une formation
    grp = part.drop_duplicates("matricule").groupby("genre").size().reset_index(name="count")
    # drop_duplicates("matricule") : compte chaque employé une seule fois (peu importe ses participations)
    fig = go.Figure(go.Pie(
        labels=grp["genre"], values=grp["count"],
        hole=0.55,                                              # Anneau plus fin (55%)
        textinfo="percent+label",
        marker=dict(colors=[C["a1"], C["a4"]], line=dict(color=C["bg"], width=2)),
        # Bleu pour un genre, rouge pour l'autre
    ))
    fig.update_layout(**BASE_LAYOUT, title="Employés Formés par Genre", showlegend=False)
    return fig


def chart_participations_by_year():
    # Graphique combiné barres + courbe : participations (barres) et employés formés distincts (courbe) par année
    grp_part = part.groupby("annee")["nb_participants"].sum().reset_index()
    # Somme totale des participations par année
    grp_emp  = part.groupby("annee")["matricule"].nunique().reset_index(name="employes")
    # Nombre d'employés distincts formés par année
    fig = go.Figure()
    fig.add_trace(go.Bar(
        x=grp_part["annee"].astype(str), y=grp_part["nb_participants"],
        name="Participations", marker_color=C["a1"],
        hovertemplate="<b>%{x}</b><br>Participations: %{y:,}<extra></extra>",
    ))
    fig.add_trace(go.Scatter(
        x=grp_emp["annee"].astype(str), y=grp_emp["employes"],
        name="Employés Formés", mode="lines+markers",
        line=dict(color=C["a2"], width=3), marker=dict(size=8),
        yaxis="y2",   # Utilise l'axe Y secondaire (à droite) pour l'échelle des employés
        hovertemplate="<b>%{x}</b><br>Employés: %{y}<extra></extra>",
    ))
    layout = {**BASE_LAYOUT, "title": "Participations & Employés Formés par Année"}
    layout["yaxis"]  = dict(title="Participations", gridcolor=C["grid"])
    layout["yaxis2"] = dict(title="Employés Formés", overlaying="y", side="right", gridcolor=C["grid"])
    # overlaying="y" → l'axe Y2 partage le même espace vertical que Y1
    layout["legend"] = dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    # Légende horizontale positionnée au-dessus du graphique
    fig.update_layout(**layout)
    return fig


# ─────────────────────────────────────────────
# CHARTS — DEMANDES
# ─────────────────────────────────────────────

def chart_demandes_by_category():
    # Graphique en anneau : répartition des demandes de formation par catégorie
    grp = dem.groupby("category")["nb_demandes"].sum().reset_index().sort_values("nb_demandes", ascending=False)
    fig = go.Figure(go.Pie(
        labels=grp["category"], values=grp["nb_demandes"],
        hole=0.45, textinfo="percent+label",
        marker=dict(colors=CAT_COLORS, line=dict(color=C["bg"], width=2)),
    ))
    fig.update_layout(**BASE_LAYOUT, title="Demandes par Catégorie", showlegend=False)
    return fig


def chart_demandes_by_status():
    # Graphique en anneau : répartition des demandes selon leur statut (Approuvée, En attente, Refusée)
    grp = dem.groupby("status")["nb_demandes"].sum().reset_index()
    colors_map = {"Approuvée": C["a2"], "En attente": C["a3"], "Refusée": C["a4"]}
    # Dictionnaire d'association statut → couleur sémantique (vert/orange/rouge)
    colors = [colors_map.get(s, C["a1"]) for s in grp["status"]]
    # Récupère la couleur de chaque statut ; bleu par défaut si statut inconnu
    fig = go.Figure(go.Pie(
        labels=grp["status"], values=grp["nb_demandes"],
        hole=0.45, textinfo="percent+label",
        marker=dict(colors=colors, line=dict(color=C["bg"], width=2)),
    ))
    fig.update_layout(**BASE_LAYOUT, title="Demandes par Statut", showlegend=False)
    return fig


def chart_taux_approbation_by_category():
    # Graphique en barres horizontales : taux d'approbation des demandes par catégorie
    def taux(x):
        # Fonction interne : calcule le taux d'approbation pour un groupe de demandes
        total = x["nb_demandes"].sum()
        return x[x["status"] == "Approuvée"]["nb_demandes"].sum() / total * 100 if total else 0
        # Divise les demandes approuvées par le total ; retourne 0 si aucune demande dans le groupe
    grp = dem.groupby("category").apply(taux).reset_index(name="taux").sort_values("taux")
    # Applique la fonction taux() à chaque groupe catégorie, trie par taux croissant
    fig = go.Figure(go.Bar(
        x=grp["taux"], y=grp["category"],
        orientation="h",
        marker=dict(color=CAT_COLORS[: len(grp)]),
        text=grp["taux"].round(1).astype(str) + "%",   # Affiche le taux en % sur chaque barre
        textposition="outside",
        hovertemplate="<b>%{y}</b><br>Taux: %{x:.1f}%<extra></extra>",
    ))
    layout = {**BASE_LAYOUT, "title": "Taux d'Approbation par Catégorie"}
    layout["xaxis"] = dict(title="%", gridcolor=C["grid"])
    layout["yaxis"] = dict(gridcolor="rgba(0,0,0,0)")   # Pas de lignes de grille sur l'axe Y
    fig.update_layout(**layout)
    return fig


def chart_demandes_by_genre():
    # Graphique en anneau : répartition des demandes de formation par genre
    grp = dem.groupby("genre")["nb_demandes"].sum().reset_index()
    fig = go.Figure(go.Pie(
        labels=grp["genre"], values=grp["nb_demandes"],
        hole=0.55, textinfo="percent+label",
        marker=dict(colors=[C["a1"], C["a4"]], line=dict(color=C["bg"], width=2)),
    ))
    fig.update_layout(**BASE_LAYOUT, title="Demandes par Genre", showlegend=False)
    return fig


def chart_demandes_by_year():
    # Graphique en barres : nombre total de demandes par année
    grp = dem.groupby("annee")["nb_demandes"].sum().reset_index()
    fig = go.Figure(go.Bar(
        x=grp["annee"].astype(str), y=grp["nb_demandes"],
        marker=dict(color=C["a3"]),   # Barres en orange
        hovertemplate="<b>%{x}</b><br>Demandes: %{y:,}<extra></extra>",
    ))
    fig.update_layout(**BASE_LAYOUT, title="Demandes par Année",
                      xaxis_title="Année", yaxis_title="Nb Demandes")
    return fig


def chart_approuvees_refusees_by_year():
    # Graphique combiné deux courbes : évolution des demandes approuvées et refusées par année
    """Uses nb_demandes_approuvees / nb_demandes_refusees — now present in fact_demandes."""
    grp_app = dem.groupby("annee")["nb_demandes_approuvees"].sum().reset_index()
    # Somme des demandes approuvées par année (colonne directement disponible dans fact_demandes)
    grp_ref = dem.groupby("annee")["nb_demandes_refusees"].sum().reset_index()
    # Somme des demandes refusées par année
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=grp_app["annee"].astype(str), y=grp_app["nb_demandes_approuvees"],
        name="Approuvées", mode="lines+markers",
        line=dict(color=C["a2"], width=3), marker=dict(size=8),
        hovertemplate="<b>%{x}</b><br>Approuvées: %{y:,}<extra></extra>",
    ))
    fig.add_trace(go.Scatter(
        x=grp_ref["annee"].astype(str), y=grp_ref["nb_demandes_refusees"],
        name="Refusées", mode="lines+markers",
        line=dict(color=C["a4"], width=3), marker=dict(size=8),
        yaxis="y2",   # Axe Y secondaire pour éviter que les échelles différentes écrasent une courbe
        hovertemplate="<b>%{x}</b><br>Refusées: %{y:,}<extra></extra>",
    ))
    layout = {**BASE_LAYOUT, "title": "Demandes Approuvées & Refusées par Année"}
    layout["yaxis"]  = dict(title="Approuvées", gridcolor=C["grid"])
    layout["yaxis2"] = dict(title="Refusées", overlaying="y", side="right", gridcolor=C["grid"])
    layout["legend"] = dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1)
    fig.update_layout(**layout)
    return fig


# ─────────────────────────────────────────────
# CHARTS — COÛTS
# ─────────────────────────────────────────────

def chart_cout_by_category():
    # (Redéfinition) Graphique en anneau : coût total par catégorie — identique à la version dans Overview
    # Note : cette fonction redéfinit chart_cout_by_category définie plus haut ; c'est la version active
    grp = dim_form.groupby("category")["montant"].sum().reset_index().sort_values("montant", ascending=False)
    fig = go.Figure(go.Pie(
        labels=grp["category"], values=grp["montant"],
        hole=0.45, textinfo="percent+label",
        marker=dict(colors=CAT_COLORS, line=dict(color=C["bg"], width=2)),
        hovertemplate="<b>%{label}</b><br>%{value:,.0f} TND<extra></extra>",
    ))
    fig.update_layout(**BASE_LAYOUT, title="Coût Total par Catégorie", showlegend=False)
    return fig


def chart_cout_total_by_year():
    # Graphique en barres : coût total des formations par année avec label en millions
    fd = dim_form.merge(dim_date[["id_date", "annee"]], left_on="id_date_debut", right_on="id_date", how="left")
    # Enrichit dim_formation avec l'année via la date de début
    grp = fd.groupby("annee")["montant"].sum().reset_index().dropna(subset=["annee"])
    # Somme des montants par année, supprime les lignes sans année
    grp["annee"] = grp["annee"].astype(int).astype(str)
    fig = go.Figure(go.Bar(
        x=grp["annee"], y=grp["montant"],
        marker=dict(color=C["a5"]),   # Barres en violet
        text=(grp["montant"] / 1e6).round(2).astype(str) + "M",
        # Convertit le montant en millions, arrondit à 2 décimales et ajoute "M"
        textposition="outside",       # Texte au-dessus de chaque barre
        hovertemplate="<b>%{x}</b><br>Coût: %{y:,.0f} TND<extra></extra>",
    ))
    fig.update_layout(**BASE_LAYOUT, title="Coût Total par Année",
                      xaxis_title="Année", yaxis_title="Coût (TND)")
    return fig


def chart_cout_moyen_formation_by_year():
    # Graphique en barres horizontales : coût moyen par formation et par année
    fd = dim_form.merge(dim_date[["id_date", "annee"]], left_on="id_date_debut", right_on="id_date", how="left")
    grp = fd.groupby("annee").agg(
        cout_total=("montant", "sum"),         # Somme des coûts
        count=("id_formation", "count")        # Nombre de formations
    ).reset_index().dropna(subset=["annee"])
    grp["cout_moy"] = grp["cout_total"] / grp["count"]
    # Coût moyen = coût total / nombre de formations pour cette année
    grp = grp.sort_values("cout_moy", ascending=True)   # Tri croissant pour lisibilité
    grp["annee"] = grp["annee"].astype(int).astype(str)
    fig = go.Figure(go.Bar(
        x=grp["cout_moy"], y=grp["annee"],
        orientation="h",
        marker=dict(color=CAT_COLORS[: len(grp)]),
        text=grp["cout_moy"].round(0).astype(int).astype(str) + " TND",
        # Affiche le coût moyen arrondi en TND sur chaque barre
        textposition="outside",
        hovertemplate="<b>%{y}</b><br>Coût moy: %{x:,.0f} TND<extra></extra>",
    ))
    layout = {**BASE_LAYOUT, "title": "Coût Moyen / Formation par Année"}
    layout["xaxis"] = dict(title="Coût (TND)", gridcolor=C["grid"])
    layout["yaxis"] = dict(gridcolor="rgba(0,0,0,0)")
    fig.update_layout(**layout)
    return fig


def chart_cout_moyen_participant_by_year():
    # Graphique en courbe avec points et labels : coût moyen par participant et par année
    fd = dim_form.merge(dim_date[["id_date", "annee"]], left_on="id_date_debut", right_on="id_date", how="left")
    # Enrichit dim_formation avec l'année
    fp = fact_part.groupby("id_formation")["nb_participants"].sum().reset_index()
    # Somme le nombre de participants par formation (depuis la table de fait)
    fd = fd.merge(fp, on="id_formation", how="left")
    # Ajoute le nombre de participants à chaque formation
    grp = fd.groupby("annee").apply(
        lambda x: x["montant"].sum() / x["nb_participants"].sum()
        if x["nb_participants"].sum() > 0 else 0
        # Pour chaque année : coût total / nb total de participants ; 0 si aucun participant
    ).reset_index(name="cout_moy").dropna(subset=["annee"])
    grp["annee"] = grp["annee"].astype(int).astype(str)
    fig = go.Figure(go.Scatter(
        x=grp["annee"], y=grp["cout_moy"],
        mode="lines+markers+text",       # Ligne + points + étiquettes textuelles
        line=dict(color=C["a2"], width=3),
        marker=dict(size=10, color=C["a2"]),
        text=grp["cout_moy"].round(0).astype(int).astype(str),
        # Affiche la valeur arrondie directement sur chaque point
        textposition="top center",       # Texte centré au-dessus du point
        hovertemplate="<b>%{x}</b><br>Coût moy/participant: %{y:.0f} TND<extra></extra>",
    ))
    fig.update_layout(**BASE_LAYOUT, title="Coût Moyen / Participant par Année",
                      xaxis_title="Année", yaxis_title="Coût (TND)")
    return fig


# ─────────────────────────────────────────────
# SELF-TEST (prints OK / error per chart)
# ─────────────────────────────────────────────

# Liste de toutes les fonctions de graphique à tester au démarrage
CHART_FUNCS = [
    chart_formations_by_category,
    chart_cout_by_category,
    chart_formations_by_year,
    chart_formations_by_mode,
    chart_formations_by_bureau,
    chart_participants_by_mode,
    chart_participants_by_category,
    chart_employes_by_genre,
    chart_participations_by_year,
    chart_demandes_by_category,
    chart_demandes_by_status,
    chart_taux_approbation_by_category,
    chart_demandes_by_genre,
    chart_demandes_by_year,
    chart_approuvees_refusees_by_year,
    chart_cout_moyen_participant_by_year,
    chart_cout_total_by_year,
    chart_cout_moyen_formation_by_year,
]

print("Self-test charts...")
for fn in CHART_FUNCS:
    # Tente d'exécuter chaque fonction de graphique
    try:
        fn()
        print(f"  OK  {fn.__name__}")      # Affiche OK si aucune exception
    except Exception as exc:
        import traceback
        print(f"  FAIL  {fn.__name__}:")   # Affiche FAIL + la trace complète en cas d'erreur
        traceback.print_exc()


# ─────────────────────────────────────────────
# KPI BAR  (6 KPIs essentiels uniquement)
# ─────────────────────────────────────────────

kpi_data = [
    # (libellé, valeur formatée, couleur de l'accent)
    ("Total Formations",       str(TOTAL_FORMATIONS),     C["a1"]),   # Nombre total de formations
    ("Taux Annulation %",      f"{TAUX_ANNULATION}%",     C["a3"]),   # % de formations annulées (orange = attention)
    ("Taux Approbation %",     f"{TAUX_APPROBATION}%",    C["a2"]),   # % de demandes approuvées (vert = positif)
    ("Employés Formés",        str(EMPLOYES_FORMES),       C["a1"]),   # Nb d'employés distincts formés
    ("Coût Total",             fmt_num(COUT_TOTAL),        C["a5"]),   # Coût total formaté (K/M)
    ("Moy Formations/Employé", str(int(MOY_FORM_EMP)),    C["a3"]),   # Moyenne formations par employé (entier)
]


# ─────────────────────────────────────────────
# APP LAYOUT
# ─────────────────────────────────────────────

app = Dash(__name__, title="Dashboard Formation")
# Instancie l'application Dash ; title = titre de l'onglet du navigateur

# Style commun des onglets non sélectionnés
tab_style = {"color": C["muted"], "background": C["card"], "border": "none", "padding": "8px 16px"}

app.layout = html.Div([

    # ── En-tête ────────────────────────────────────────────────────────────────
    html.Div([
        html.H1("Dashboard Formation",
                style={"margin": "0", "color": C["text"], "fontSize": "1.6rem", "fontWeight": "700"}),
        # Titre principal de la page
        html.P("Tableau de bord analytique — Formations & Participations 2020–2025",
               style={"margin": "4px 0 0", "color": C["muted"], "fontSize": "0.85rem"}),
        # Sous-titre / description de la période couverte
    ], style={
        "background": C["card"],
        "padding": "18px 24px",
        "borderBottom": f"2px solid {C['a1']}",   # Ligne de séparation bleue sous l'en-tête
        "marginBottom": "20px"
    }),

    # ── Contenu principal (centré, largeur max 1600px) ─────────────────────────
    html.Div([

        # Barre de KPIs : 6 cartes côte à côte avec wrapping automatique
        html.Div([kpi_card(l, v, c) for l, v, c in kpi_data],
                 style={"display": "flex", "flexWrap": "wrap", "gap": "10px", "marginBottom": "24px"}),
        # flexWrap="wrap" → les cartes passent à la ligne suivante si l'écran est trop étroit

        # ── Onglets de navigation ──────────────────────────────────────────────
        dcc.Tabs(id="tabs", value="overview", children=[
            dcc.Tab(label="Vue Générale",    value="overview",
                    style=tab_style,
                    selected_style={**tab_style, "color": C["a1"], "background": C["bg"],
                                    "borderTop": f"2px solid {C['a1']}"}),
            # Onglet actif : texte bleu + fond gris + bordure bleue en haut

            dcc.Tab(label="Participations",  value="participations",
                    style=tab_style,
                    selected_style={**tab_style, "color": C["a2"], "background": C["bg"],
                                    "borderTop": f"2px solid {C['a2']}"}),
            # Onglet actif : vert

            dcc.Tab(label="Demandes",        value="demandes",
                    style=tab_style,
                    selected_style={**tab_style, "color": C["a3"], "background": C["bg"],
                                    "borderTop": f"2px solid {C['a3']}"}),
            # Onglet actif : orange

            dcc.Tab(label="Coûts",           value="couts",
                    style=tab_style,
                    selected_style={**tab_style, "color": C["a5"], "background": C["bg"],
                                    "borderTop": f"2px solid {C['a5']}"}),
            # Onglet actif : violet
        ], style={"background": C["card"], "borderRadius": "8px 8px 0 0"}),
        # Les onglets ont des coins arrondis uniquement en haut

        html.Div(id="tab-content", style={"marginTop": "4px"}),
        # Conteneur vide dont le contenu est injecté dynamiquement par le callback ci-dessous

    ], style={"maxWidth": "1600px", "margin": "0 auto", "padding": "0 20px 30px"}),
    # Centre le contenu horizontalement avec une largeur maximale de 1600px

], style={"background": C["bg"], "minHeight": "100vh", "fontFamily": "Segoe UI, Arial, sans-serif"})
# Fond gris clair sur toute la hauteur de la fenêtre ; police sans-serif globale


# ─────────────────────────────────────────────
# CALLBACK
# ─────────────────────────────────────────────

@app.callback(Output("tab-content", "children"), Input("tabs", "value"))
# Déclare un callback réactif :
#   Output → met à jour la propriété "children" du composant "tab-content"
#   Input  → se déclenche quand la valeur de "tabs" change (changement d'onglet)
def render_tab(tab):
    # Fonction exécutée à chaque changement d'onglet
    # tab : valeur de l'onglet sélectionné ("overview", "participations", "demandes", "couts")
    if tab == "overview":
        return html.Div([
            grid(card(chart_formations_by_category()), card(chart_cout_by_category())),
            # Ligne 1 : formations par catégorie | coût par catégorie
            grid(card(chart_formations_by_year()),     card(chart_formations_by_mode())),
            # Ligne 2 : formations par année | formations par mode
            html.Div(card(chart_formations_by_bureau()), style={"marginTop": "16px"}),
            # Ligne 3 (pleine largeur) : top 20 formateurs
        ])
    elif tab == "participations":
        return html.Div([
            grid(card(chart_participants_by_mode()),  card(chart_participants_by_category())),
            # Ligne 1 : participants par mode | par catégorie
            grid(card(chart_employes_by_genre()),     card(chart_participations_by_year())),
            # Ligne 2 : répartition par genre | participations et employés par année
        ])
    elif tab == "demandes":
        return html.Div([
            grid(card(chart_demandes_by_category()),         card(chart_demandes_by_status())),
            # Ligne 1 : demandes par catégorie | par statut
            grid(card(chart_taux_approbation_by_category()), card(chart_demandes_by_genre())),
            # Ligne 2 : taux d'approbation par catégorie | demandes par genre
            grid(card(chart_demandes_by_year()),             card(chart_approuvees_refusees_by_year())),
            # Ligne 3 : demandes par année | évolution approuvées vs refusées
        ])
    elif tab == "couts":
        return html.Div([
            grid(card(chart_cout_moyen_participant_by_year()), card(chart_cout_total_by_year())),
            # Ligne 1 : coût moyen/participant | coût total par année
            html.Div(card(chart_cout_moyen_formation_by_year()), style={"marginTop": "16px"}),
            # Ligne 2 (pleine largeur) : coût moyen par formation par année
        ])


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────

if __name__ == "__main__":
    # Exécute le serveur uniquement si ce fichier est lancé directement (pas importé comme module)
    app.run(host="localhost", port=8050, debug=False)
    # host="localhost" → accessible uniquement en local (127.0.0.1)
    # port=8050        → port par défaut de Dash
    # debug=False      → désactive le mode debug (hot-reload, DevTools) pour la production