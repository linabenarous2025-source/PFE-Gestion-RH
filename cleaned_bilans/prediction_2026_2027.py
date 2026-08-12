# -*- coding: utf-8 -*-
# Définit l'encodage du fichier en UTF-8 (pour les accents, caractères spéciaux)

import sys
import io

# Corrige l'encodage de la console Windows pour afficher les accents correctement
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import pandas as pd
# pandas : bibliothèque pour manipuler des tableaux de données (comme Excel en Python)

from sqlalchemy import create_engine, text
# sqlalchemy : bibliothèque pour se connecter à des bases de données SQL
# create_engine : crée la connexion
# text : permet d'écrire des requêtes SQL sous forme de texte

from sklearn.linear_model import LinearRegression
# sklearn : bibliothèque de Machine Learning
# LinearRegression : modèle qui trace une droite de tendance pour faire des prédictions

import warnings
warnings.filterwarnings('ignore')
# Masque les avertissements non-critiques pour garder la console propre

import plotly.graph_objects as go
# plotly : bibliothèque pour créer des graphiques interactifs
# graph_objects (go) : permet de construire les graphiques manuellement (courbes, barres, camemberts...)

import dash
from dash import dcc, html, Input, Output
# dash : framework pour créer des dashboards web en Python
# dcc : composants interactifs (sliders, graphiques, boutons radio...)
# html : composants HTML classiques (titres, paragraphes, tableaux...)
# Input / Output : servent à brancher l'interactivité (quand X change → Y se met à jour)

import dash_bootstrap_components as dbc
# dbc : composants Bootstrap pour Dash — facilite la mise en page responsive (grilles, cards...)

from flask_cors import CORS
# CORS : autorise le dashboard à être appelé depuis d'autres domaines (sécurité navigateur)


# ==================== CONFIG DB ====================

DB_USER     = "root"       # Nom d'utilisateur MySQL
DB_PASSWORD = ""           # Mot de passe MySQL (vide ici = pas de mot de passe)
DB_HOST     = "localhost"  # Adresse du serveur MySQL (machine locale)
DB_NAME     = "dwh_formations"  # Nom de la base de données à utiliser

# Crée le moteur de connexion MySQL
# "mysql+pymysql" = utilise le driver pymysql pour parler à MySQL
# utf8mb4 = encodage qui supporte tous les caractères (dont les emojis)
# pool_pre_ping = vérifie que la connexion est toujours active avant chaque requête
engine = create_engine(
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}",
    connect_args={"charset": "utf8mb4"},
    pool_pre_ping=True,
)


# ==================== 1. CHARGEMENT DEPUIS LE DWH ====================

def load_data():
    """Charge les données depuis MySQL et retourne le DataFrame formations."""

    with engine.connect() as conn:
        # Ouvre une connexion à la BDD et exécute la requête SQL
        df_form = pd.read_sql(text("""
           SELECT
            f.id_formation,   -- Identifiant unique de la formation
            f.montant,        -- Coût de la formation en DT
            f.mode,           -- Mode de la formation (présentiel, e-learning, etc.)
            f.id_etat,        -- État de la formation (active, annulée, etc.)
            d.annee AS annee  -- Année de début de la formation (jointure avec dim_date)
        FROM dim_formation f
        JOIN dim_date d
            ON f.id_date_debut = d.id_date
        -- Jointure entre la table formation et la table date pour récupérer l'année
    """), conn)

    # Convertit la colonne montant en nombre (au cas où elle serait stockée en texte)
    # errors="coerce" : si une valeur ne peut pas être convertie → elle devient NaN (vide)
    df_form["montant"] = pd.to_numeric(df_form["montant"], errors="coerce")

    # Idem pour l'année
    df_form["annee"] = pd.to_numeric(df_form["annee"], errors="coerce")

    return df_form  # Retourne le tableau complet des formations


print("Connexion MySQL et chargement des données...")
df = load_data()  # Lance le chargement et stocke le résultat dans df
print(f"  → {len(df):,} formations chargées")  # Affiche le nombre de lignes chargées


# ==================== 2. KPI PAR ANNÉE (historique) ====================

# Regroupe les formations par année et calcule les indicateurs clés (KPI)
kpi = df.groupby("annee").agg(
    nb_formations=("id_formation", "size"),  # Compte le nombre de formations par année
    cout_total   =("montant",      "sum"),   # Additionne les coûts par année
).reset_index()  # Remet l'année comme colonne normale (pas comme index)

# Calcule le coût moyen par formation pour chaque année
kpi["cout_moyen"] = kpi["cout_total"] / kpi["nb_formations"]

print(kpi.sort_values("annee"))  # Affiche le tableau KPI trié par année

YEAR_MIN = int(kpi["annee"].min())  # Première année disponible dans les données
YEAR_MAX = int(kpi["annee"].max())  # Dernière année disponible dans les données

# Isole les formations de la dernière année réelle (ex: 2025)
df_last = df[df["annee"] == YEAR_MAX]

# Isole les formations de l'avant-dernière année (ex: 2024)
df_prev = df[df["annee"] == YEAR_MAX - 1]


# ==================== 3. MODÈLES PRÉDICTION (2026 & 2027) ====================

# Prend uniquement les 3 dernières années pour entraîner le modèle
# (plus représentatif de la tendance récente que toute l'historique)
kpi_recent = kpi.sort_values("annee").tail(3)

# X = les années (variable explicative pour la régression)
X = kpi_recent[["annee"]]

# Les deux années qu'on veut prédire
years_pred = pd.DataFrame({"annee": [2026, 2027]})

# Toutes les années de YEAR_MIN à 2027 (pour tracer la ligne de tendance complète)
years_all  = pd.DataFrame({"annee": list(range(YEAR_MIN, 2028))})


def fit_predict(col):
    """
    Entraîne un modèle de régression linéaire sur la colonne 'col'
    et retourne : le modèle, les valeurs de tendance sur toutes les années,
    et les prédictions pour 2026 & 2027.
    """
    m = LinearRegression()           # Crée un nouveau modèle de régression linéaire
    m.fit(X, kpi_recent[col])        # Entraîne le modèle avec les 3 dernières années
    return (
        m,                                      # Le modèle entraîné
        m.predict(years_all).tolist(),          # Tendance sur toutes les années
        m.predict(years_pred).tolist()          # Prédictions pour 2026 et 2027
    )


# ==================== PRÉDICTIONS ====================

# Prédit le coût total pour toutes les années + 2026 & 2027
m2, series_tot, preds_tot = fit_predict("cout_total")

# Prédit le nombre de formations pour toutes les années + 2026 & 2027
m3, series_nb,  preds_nb  = fit_predict("nb_formations")

# Extrait séparément les valeurs prédites pour 2026 et 2027
pred2026_tot, pred2027_tot = preds_tot  # Coût total prédit
pred2026_nb,  pred2027_nb  = preds_nb   # Nombre de formations prédit

# Calcule le coût moyen prédit = coût total / nombre de formations
# (on ne fait pas de régression directe sur le moyen car c'est une valeur dérivée)
series_moy = [t/n if n > 0 else 0 for t, n in zip(series_tot, series_nb)]
# Pour chaque année : si le nombre de formations > 0 → coût moyen = total/nb, sinon 0

pred2026_moy = pred2026_tot / pred2026_nb if pred2026_nb > 0 else 0  # Coût moyen 2026
pred2027_moy = pred2027_tot / pred2027_nb if pred2027_nb > 0 else 0  # Coût moyen 2027


# ==================== VÉRIFICATION ====================

# Affiche les valeurs prédites pour vérifier qu'elles semblent cohérentes
print(f"  [Vérif 2026] Coût moyen calculé: {pred2026_moy:,.0f} DT")
print(f"  [Vérif 2027] Coût moyen calculé: {pred2027_moy:,.0f} DT")


# ==================== 4. RÉPARTITION — PAR MODE ====================

# Pour la dernière année réelle, regroupe par mode de formation
mode_data = (
    df_last
    .groupby("mode")
    .agg(
        cout_total=("montant", "sum"),        # Coût total par mode
        nb=("id_formation", "count")          # Nombre de formations par mode
    )
    .reset_index()
    .sort_values("cout_total", ascending=False)  # Trie du plus cher au moins cher
)

# Liste des années pour l'axe X des graphiques (de YEAR_MIN à 2027)
years_x = list(range(YEAR_MIN, 2028))


# ==================== 4b. PRÉDICTIONS PAR MODE ====================

# Regroupe les données par année ET par mode (pour avoir l'évolution de chaque mode)
mode_yearly = (
    df.groupby(["annee", "mode"])
    .agg(
        cout_total=("montant", "sum"),        # Coût total par mode par année
        nb=("id_formation", "count")          # Nombre de formations par mode par année
    )
    .reset_index()
)

# Dictionnaires pour stocker les prédictions par mode
pred_mode_nb_2026   = {}  # Nb formations prédites 2026, par mode
pred_mode_nb_2027   = {}  # Nb formations prédites 2027, par mode
pred_mode_cout_2026 = {}  # Coût total prédit 2026, par mode
pred_mode_cout_2027 = {}  # Coût total prédit 2027, par mode

for mode in mode_yearly["mode"].unique():  # Pour chaque mode de formation distinct
    sub = mode_yearly[mode_yearly["mode"] == mode].sort_values("annee")
    # Filtre les données pour ce mode uniquement, triées par année

    if len(sub) >= 2:
        # On a assez de points (≥2 ans) pour entraîner une régression
        m_nb   = LinearRegression()  # Modèle pour le nombre de formations
        m_cout = LinearRegression()  # Modèle pour le coût total

        m_nb.fit(sub[["annee"]], sub["nb"])              # Entraîne sur le nb
        m_cout.fit(sub[["annee"]], sub["cout_total"])    # Entraîne sur le coût

        # Prédit 2026 et 2027 (max(0,...) pour éviter des valeurs négatives absurdes)
        pred_mode_nb_2026[mode]   = max(0, m_nb.predict([[2026]])[0])
        pred_mode_nb_2027[mode]   = max(0, m_nb.predict([[2027]])[0])
        pred_mode_cout_2026[mode] = max(0, m_cout.predict([[2026]])[0])
        pred_mode_cout_2027[mode] = max(0, m_cout.predict([[2027]])[0])
    else:
        # Pas assez de données → on répète la dernière valeur connue
        nb_val   = sub["nb"].iloc[-1]           # Dernière valeur connue du nb
        cout_val = sub["cout_total"].iloc[-1]   # Dernière valeur connue du coût
        pred_mode_nb_2026[mode]   = nb_val
        pred_mode_nb_2027[mode]   = nb_val
        pred_mode_cout_2026[mode] = cout_val
        pred_mode_cout_2027[mode] = cout_val

# Convertit les dictionnaires en DataFrames pour faciliter l'affichage dans les graphiques
mode_pred_nb_df_2026   = pd.DataFrame({"mode": list(pred_mode_nb_2026.keys()),   "nb": list(pred_mode_nb_2026.values())})
mode_pred_nb_df_2027   = pd.DataFrame({"mode": list(pred_mode_nb_2027.keys()),   "nb": list(pred_mode_nb_2027.values())})
mode_pred_cout_df_2026 = pd.DataFrame({"mode": list(pred_mode_cout_2026.keys()), "cout_total": list(pred_mode_cout_2026.values())})
mode_pred_cout_df_2027 = pd.DataFrame({"mode": list(pred_mode_cout_2027.keys()), "cout_total": list(pred_mode_cout_2027.values())})


# ==================== 5. PALETTE ====================

# Couleurs utilisées dans tous les graphiques (codes hexadécimaux)
C_BLUE   = "#378ADD"  # Bleu  → données réelles principales
C_GREEN  = "#97C459"  # Vert  → prédiction 2026
C_CORAL  = "#D85A30"  # Corail
C_AMBER  = "#EF9F27"  # Ambre → lignes de tendance
C_PURPLE = "#7F77DD"  # Violet
C_TEAL   = "#1D9E75"  # Vert canard
C_ORANGE = "#F97316"  # Orange → prédiction 2027

# Liste de couleurs pour les différents modes dans le camembert
MODE_COLORS = [C_BLUE, C_PURPLE, C_GREEN, C_CORAL, C_AMBER, C_TEAL]

BG_CARD  = "#F7F7F5"  # Couleur de fond des cartes/graphiques (gris très clair)
BG_MAIN  = "#FFFFFF"  # Couleur de fond principal (blanc)
TXT_MAIN = "#2C2C2A"  # Couleur du texte principal (quasi-noir)
TXT_MUTE = "#888780"  # Couleur du texte secondaire (gris)

# Paramètres de mise en forme communs à tous les graphiques Plotly
PLOTLY_LAYOUT = dict(
    paper_bgcolor=BG_CARD,   # Fond de tout le graphique
    plot_bgcolor =BG_CARD,   # Fond de la zone de tracé
    font=dict(family="Inter, sans-serif", color=TXT_MAIN),  # Police et couleur du texte
    margin=dict(l=40, r=20, t=50, b=40),  # Marges (gauche, droite, haut, bas) en pixels
    hoverlabel=dict(bgcolor="white", font_size=12, font_family="Inter, sans-serif"),
    # Style de l'infobulle au survol de la souris
)


# ==================== 6. GRAPHIQUES PLOTLY ====================

def fig_cout_moyen(kpi_f, yx_f, sm_f, show26, show27):
    """
    Graphique courbe : coût moyen par formation au fil des années.
    kpi_f   = données KPI filtrées par le slider
    yx_f    = liste des années pour l'axe X
    sm_f    = valeurs de la tendance (série continue)
    show26  = booléen : afficher le point prédit 2026 ?
    show27  = booléen : afficher le point prédit 2027 ?
    """
    fig = go.Figure()  # Crée un graphique vide

    # Trace 1 : courbe des valeurs réelles (bleue, avec remplissage sous la courbe)
    fig.add_trace(go.Scatter(
        x=kpi_f["annee"], y=kpi_f["cout_moyen"],  # Données X et Y
        mode="lines+markers",                      # Ligne + points
        name=f"Réel ({YEAR_MIN}–{YEAR_MAX})",      # Légende
        line=dict(color=C_BLUE, width=2.5),        # Style de la ligne
        marker=dict(size=8),                       # Taille des points
        fill="tozeroy",                            # Rempli depuis la courbe jusqu'à y=0
        fillcolor="rgba(55,138,221,0.08)",         # Couleur du remplissage (bleu très transparent)
        hovertemplate="Année %{x}<br>Coût moyen : %{y:,.0f} DT<extra></extra>"
        # Format de l'infobulle au survol
    ))

    # Trace 2 : ligne de tendance (pointillés ambre)
    fig.add_trace(go.Scatter(
        x=yx_f, y=sm_f,
        mode="lines", name="Tendance",
        line=dict(color=C_AMBER, width=2, dash="dash"),  # Pointillés
        hovertemplate="Tendance %{x} : %{y:,.0f} DT<extra></extra>"
    ))

    # Trace 3 (optionnel) : point prédit 2026 (étoile verte)
    if show26:
        fig.add_trace(go.Scatter(
            x=[2026], y=[pred2026_moy],
            mode="markers",
            name=f"Prédit 2026 : {pred2026_moy:,.0f} DT",
            marker=dict(symbol="star", size=18, color=C_GREEN),  # Étoile verte
            hovertemplate=f"Prédit 2026<br>{pred2026_moy:,.0f} DT<extra></extra>"
        ))

    # Trace 4 (optionnel) : point prédit 2027 (étoile orange)
    if show27:
        fig.add_trace(go.Scatter(
            x=[2027], y=[pred2027_moy],
            mode="markers",
            name=f"Prédit 2027 : {pred2027_moy:,.0f} DT",
            marker=dict(symbol="star", size=18, color=C_ORANGE),
            hovertemplate=f"Prédit 2027<br>{pred2027_moy:,.0f} DT<extra></extra>"
        ))

    # Mise en forme globale du graphique
    fig.update_layout(
        **PLOTLY_LAYOUT,                                    # Applique le style commun
        title=dict(text="Coût moyen / formation (DT)", font_size=13),
        xaxis=dict(tickvals=yx_f, gridcolor="#E0DED8"),    # Axe X : graduations + grille
        yaxis=dict(tickformat=",.0f", gridcolor="#E0DED8"),# Axe Y : format entier + grille
        legend=dict(orientation="h", y=-0.2, font_size=10),# Légende horizontale en bas
        hovermode="x unified",                             # Une seule infobulle pour tous les tracés
    )
    return fig  # Retourne le graphique prêt à être affiché


def fig_nb_formations(kpi_f, yx_f, snb_f, show26, show27):
    """Graphique courbe : nombre de formations par année."""
    fig = go.Figure()

    # Courbe des valeurs réelles (violette)
    fig.add_trace(go.Scatter(
        x=kpi_f["annee"], y=kpi_f["nb_formations"],
        mode="lines+markers", name="Réel",
        line=dict(color=C_PURPLE, width=2.5),
        marker=dict(size=8),
        hovertemplate="Année %{x}<br>Nb : %{y}<extra></extra>"
    ))

    # Ligne de tendance (pointillés ambre)
    fig.add_trace(go.Scatter(
        x=yx_f, y=snb_f,
        mode="lines", name="Tendance",
        line=dict(color=C_AMBER, width=2, dash="dash"),
        hovertemplate="Tendance %{x} : %{y:.0f}<extra></extra>"
    ))

    # Point prédit 2026 (étoile verte) si activé
    if show26:
        fig.add_trace(go.Scatter(
            x=[2026], y=[pred2026_nb],
            mode="markers",
            name=f"Prédit 2026 : {pred2026_nb:.0f}",
            marker=dict(symbol="star", size=18, color=C_GREEN),
            hovertemplate=f"Prédit 2026 : {pred2026_nb:.0f}<extra></extra>"
        ))

    # Point prédit 2027 (étoile orange) si activé
    if show27:
        fig.add_trace(go.Scatter(
            x=[2027], y=[pred2027_nb],
            mode="markers",
            name=f"Prédit 2027 : {pred2027_nb:.0f}",
            marker=dict(symbol="star", size=18, color=C_ORANGE),
            hovertemplate=f"Prédit 2027 : {pred2027_nb:.0f}<extra></extra>"
        ))

    fig.update_layout(
        **PLOTLY_LAYOUT,
        title=dict(text="Nombre de formations", font_size=13),
        xaxis=dict(tickvals=yx_f, gridcolor="#E0DED8"),
        yaxis=dict(gridcolor="#E0DED8"),
        legend=dict(orientation="h", y=-0.2, font_size=10),
        hovermode="x unified",
    )
    return fig


def fig_cout_total(kpi_f, yx_f, st_f, show26, show27):
    """Graphique barres : coût total annuel en DT."""
    fig = go.Figure()

    # Barres bleues pour les valeurs réelles
    fig.add_trace(go.Bar(
        x=kpi_f["annee"], y=kpi_f["cout_total"],
        name="Réel",
        marker_color=C_BLUE,     # Couleur des barres
        opacity=0.85,            # Légèrement transparent
        text=[f"{v/1000:.0f}k" for v in kpi_f["cout_total"]],  # Étiquette "123k" au-dessus
        textposition="outside",  # Étiquette au-dessus de la barre
        hovertemplate="Année %{x}<br>Coût total : %{y:,.0f} DT<extra></extra>"
    ))

    # Ligne de tendance (pointillés ambre)
    fig.add_trace(go.Scatter(
        x=yx_f, y=st_f,
        mode="lines", name="Tendance",
        line=dict(color=C_AMBER, width=2, dash="dash"),
        hovertemplate="Tendance %{x} : %{y:,.0f} DT<extra></extra>"
    ))

    # Point prédit 2026 (étoile verte) si activé
    if show26:
        fig.add_trace(go.Scatter(
            x=[2026], y=[pred2026_tot],
            mode="markers",
            name=f"Prédit 2026 : {pred2026_tot/1000:.0f}k DT",
            marker=dict(symbol="star", size=18, color=C_GREEN),
            hovertemplate=f"Prédit 2026 : {pred2026_tot:,.0f} DT<extra></extra>"
        ))

    # Point prédit 2027 (étoile orange) si activé
    if show27:
        fig.add_trace(go.Scatter(
            x=[2027], y=[pred2027_tot],
            mode="markers",
            name=f"Prédit 2027 : {pred2027_tot/1000:.0f}k DT",
            marker=dict(symbol="star", size=18, color=C_ORANGE),
            hovertemplate=f"Prédit 2027 : {pred2027_tot:,.0f} DT<extra></extra>"
        ))

    fig.update_layout(
        **PLOTLY_LAYOUT,
        title=dict(text="Coût total annuel (DT)", font_size=13),
        xaxis=dict(tickvals=yx_f, gridcolor="#E0DED8"),
        yaxis=dict(tickformat=".0s", gridcolor="#E0DED8"),  # Format court ex: "500k"
        legend=dict(orientation="h", y=-0.2, font_size=10),
        hovermode="x unified",
        bargap=0.4,  # Espace entre les barres (40% de l'espace)
    )
    return fig


def fig_mode_bar(year_select=YEAR_MAX):
    """
    Barres horizontales : coût total par mode de formation.
    Affiche soit les données réelles (YEAR_MAX), soit les prédictions 2026 ou 2027.
    """
    if year_select == 2026:
        data  = mode_pred_cout_df_2026.sort_values("cout_total", ascending=False)
        label = "Prédit 2026"
        color = C_GREEN   # Vert pour 2026
    elif year_select == 2027:
        data  = mode_pred_cout_df_2027.sort_values("cout_total", ascending=False)
        label = "Prédit 2027"
        color = C_ORANGE  # Orange pour 2027
    else:
        data  = mode_data.sort_values("cout_total", ascending=False)
        label = f"Réel {YEAR_MAX}"
        color = C_BLUE    # Bleu pour les données réelles

    # Crée le graphique barres horizontales
    fig = go.Figure(go.Bar(
        x=data["cout_total"],   # Valeur sur l'axe horizontal
        y=data["mode"],         # Nom du mode sur l'axe vertical
        orientation="h",        # Barres horizontales
        marker_color=color,
        opacity=0.85,
        text=[f"{v/1000:.0f}k DT" for v in data["cout_total"]],  # Étiquette
        textposition="outside",
        hovertemplate="%{y}<br>Coût : %{x:,.0f} DT<extra></extra>"
    ))
    fig.update_layout(
        **PLOTLY_LAYOUT,
        title=dict(text=f"Coût par mode — {label}", font_size=13),
        xaxis=dict(tickformat=".0s", gridcolor="#E0DED8"),
        yaxis=dict(gridcolor="#E0DED8"),
    )
    return fig


def fig_mode_pie(year_select=YEAR_MAX):
    """
    Camembert (donut) : répartition du nombre de formations par mode.
    Affiche soit les données réelles, soit les prédictions 2026 ou 2027.
    """
    if year_select == 2026:
        data  = mode_pred_nb_df_2026
        label = "Prédit 2026"
    elif year_select == 2027:
        data  = mode_pred_nb_df_2027
        label = "Prédit 2027"
    else:
        data  = mode_data
        label = f"Réel {YEAR_MAX}"

    fig = go.Figure(go.Pie(
        labels=data["mode"],              # Noms des tranches
        values=data["nb"],                # Tailles des tranches
        hole=0.4,                         # Trou au centre → forme donut
        marker_colors=MODE_COLORS[:len(data)],  # Couleurs des tranches
        textinfo="percent+label",         # Affiche % et nom dans chaque tranche
        hovertemplate="%{label}<br>%{value:.0f} formations (%{percent})<extra></extra>"
    ))
    fig.update_layout(
        **PLOTLY_LAYOUT,
        title=dict(text=f"Formations par mode — {label}", font_size=13),
        showlegend=False,  # Pas de légende séparée (déjà dans les tranches)
    )
    return fig


# ==================== 7. APP DASH ====================

app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],  # Charge le CSS Bootstrap
    title="Dashboard Formations 2026–2027",        # Titre de l'onglet navigateur
    suppress_callback_exceptions=True,             # Evite erreurs si un composant n'est pas encore rendu
)

server = app.server                                # Accès au serveur Flask sous-jacent
server.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0    # Désactive le cache des fichiers statiques
CORS(server)                                       # Autorise les requêtes cross-origin


def recap_table():
    """
    Construit et retourne le tableau HTML récapitulatif des prédictions.
    Affiché en haut du dashboard avec colonnes : réel N-1, réel N, prédit 2026, prédit 2027.
    """
    return dbc.Card(dbc.CardBody([
        html.H5("Récapitulatif des prédictions",
                style={"fontWeight": "700", "color": TXT_MAIN, "marginBottom": "16px"}),

        dbc.Table([
            # En-tête du tableau
            html.Thead(html.Tr([
                html.Th("Métrique",        style={"width": "30%"}),
                html.Th(f"Réel {YEAR_MAX - 1}"),  # Ex: "Réel 2024"
                html.Th(f"Réel {YEAR_MAX}"),       # Ex: "Réel 2025"
                html.Th("Prédit 2026",     style={"color": C_GREEN}),   # En vert
                html.Th("Prédit 2027",     style={"color": C_ORANGE}),  # En orange
            ])),

            # Corps du tableau : 3 lignes de métriques
            html.Tbody([

                # Ligne 1 : Nombre de formations
                html.Tr([
                    html.Td("Nombre de formations"),
                    html.Td(str(len(df_prev))),           # Nb réel année N-1
                    html.Td(str(len(df_last))),           # Nb réel année N
                    html.Td(f"{pred2026_nb:.0f}",
                            style={"color": C_GREEN, "fontWeight": "600"}),   # Prédit 2026
                    html.Td(f"{pred2027_nb:.0f}",
                            style={"color": C_ORANGE, "fontWeight": "600"}),  # Prédit 2027
                ]),

                # Ligne 2 : Coût total
                html.Tr([
                    html.Td("Coût total"),
                    html.Td(f"{df_prev['montant'].sum()/1000:.0f}k DT"),  # Total réel N-1
                    html.Td(f"{df_last['montant'].sum()/1000:.0f}k DT"),  # Total réel N
                    html.Td(f"{pred2026_tot/1000:.0f}k DT",
                            style={"color": C_GREEN, "fontWeight": "600"}),
                    html.Td(f"{pred2027_tot/1000:.0f}k DT",
                            style={"color": C_ORANGE, "fontWeight": "600"}),
                ]),

                # Ligne 3 : Coût moyen par formation
                html.Tr([
                    html.Td("Coût moyen / formation"),
                    html.Td(f"{df_prev['montant'].mean():,.0f} DT"),  # Moyenne réelle N-1
                    html.Td(f"{df_last['montant'].mean():,.0f} DT"),  # Moyenne réelle N
                    html.Td(f"{pred2026_moy:,.0f} DT",
                            style={"color": C_GREEN, "fontWeight": "600"}),
                    html.Td(f"{pred2027_moy:,.0f} DT",
                            style={"color": C_ORANGE, "fontWeight": "600"}),
                ]),
            ]),
        ], bordered=True, hover=True, size="sm",   # Tableau avec bordures, survol, petit format
           style={"fontSize": "13px", "marginBottom": "0"}),

    ]), style={
        "background": BG_CARD,
        "border": "1px solid #E0DED8",
        "borderRadius": "10px",   # Coins arrondis
        "marginBottom": "28px",   # Espace en dessous
    })


# ==================== LAYOUT (structure visuelle de la page) ====================

app.layout = dbc.Container(
    fluid=True,  # Pleine largeur (pas de marges latérales fixes)
    style={"background": BG_MAIN, "minHeight": "100vh", "padding": "24px"},
    children=[

        # ── En-tête ──────────────────────────────────────────────────────────
        html.Div([
            html.H2("Dashboard Formations",
                    style={"fontWeight": "800", "color": TXT_MAIN, "marginBottom": "4px"}),
            html.P(f"Données réelles {YEAR_MIN}–{YEAR_MAX} · Prédictions 2026 & 2027",
                   style={"color": TXT_MUTE, "fontSize": "14px", "marginBottom": "0"}),
        ], style={"marginBottom": "24px"}),

        # ── Tableau récapitulatif ─────────────────────────────────────────────
        recap_table(),

        # ── Slider de filtre d'années ─────────────────────────────────────────
        dbc.Row([
            dbc.Col([
                html.Label("Filtrer les années affichées :",
                           style={"fontSize": "13px", "color": TXT_MUTE}),
                dcc.RangeSlider(
                    id="year-slider",          # Identifiant utilisé dans les callbacks
                    min=YEAR_MIN,              # Borne gauche minimale
                    max=2027,                  # Borne droite maximale
                    step=1,                    # Pas de 1 an
                    marks={y: str(y) for y in range(YEAR_MIN, 2028)},  # Étiquettes sous le slider
                    value=[YEAR_MIN, 2027],    # Valeur initiale : toute la plage
                    tooltip={"placement": "bottom", "always_visible": False},
                    # Infobulle sous le curseur, visible uniquement au survol
                ),
            ], md=10),  # Occupe 10/12 colonnes Bootstrap
        ], className="mb-4"),  # Marge en bas

        # ── Graphiques de tendance (ligne 1) ──────────────────────────────────
        dbc.Row([
            dbc.Col(dcc.Graph(id="graph-cout-moyen",  # Graphique coût moyen (grand)
                              config={"displayModeBar": False}), md=8),
            dbc.Col(dcc.Graph(id="graph-nb",          # Graphique nb formations (petit)
                              config={"displayModeBar": False}), md=4),
        ], className="mb-4"),

        # ── Graphique coût total (ligne 2, pleine largeur) ────────────────────
        dbc.Row([
            dbc.Col(dcc.Graph(id="graph-cout-total",
                              config={"displayModeBar": False}), md=12),
        ], className="mb-4"),

        # ── Séparateur visuel ─────────────────────────────────────────────────
        html.Hr(style={"borderColor": "#E0DED8", "margin": "8px 0 16px 0"}),

        # ── Sélecteur d'année pour les graphiques Modes ───────────────────────
        dbc.Row([
            dbc.Col([
                html.Label("Année pour les graphiques Modes :",
                           style={"fontSize": "13px", "color": TXT_MUTE}),
                dcc.RadioItems(
                    id="year-mode-cat",    # Identifiant pour le callback
                    options=[
                        {"label": f" Réel {YEAR_MAX}", "value": YEAR_MAX},
                        {"label": " Prédit 2026",       "value": 2026},
                        {"label": " Prédit 2027",       "value": 2027},
                    ],
                    value=YEAR_MAX,        # Sélection par défaut : dernière année réelle
                    inline=True,           # Boutons sur une seule ligne
                    inputStyle={"marginRight": "5px", "marginLeft": "15px"},
                    style={"fontSize": "13px"},
                ),
            ], md=12),
        ], className="mb-3"),

        # ── Graphiques par mode (ligne 3) ─────────────────────────────────────
        dbc.Row([
            dbc.Col(dcc.Graph(id="graph-mode-bar",  # Barres horizontales par mode
                              config={"displayModeBar": False}), md=6),
            dbc.Col(dcc.Graph(id="graph-mode-pie",  # Camembert par mode
                              config={"displayModeBar": False}), md=6),
        ]),
    ]
)


# ==================== 8. CALLBACKS (interactivité) ====================

@app.callback(
    # Sorties : les 3 graphiques de tendance à mettre à jour
    Output("graph-cout-moyen", "figure"),
    Output("graph-nb",         "figure"),
    Output("graph-cout-total", "figure"),
    # Entrée : la valeur du slider d'années
    Input("year-slider", "value"),
)
def update_graphs(year_range):
    """
    Appelée automatiquement chaque fois que le slider change.
    Refiltre les données et régénère les 3 graphiques de tendance.
    """
    y_min, y_max = year_range  # Décompose [min, max] du slider

    # Filtre le tableau KPI pour ne garder que les années sélectionnées
    kpi_f = kpi[(kpi["annee"] >= y_min) & (kpi["annee"] <= y_max)]

    # Filtre la liste des années pour l'axe X
    yx_f  = [y for y in years_x if y_min <= y <= y_max]

    # Filtre les séries de tendance correspondantes
    sm_f  = [v for y, v in zip(years_x, series_moy) if y_min <= y <= y_max]
    st_f  = [v for y, v in zip(years_x, series_tot) if y_min <= y <= y_max]
    snb_f = [v for y, v in zip(years_x, series_nb)  if y_min <= y <= y_max]

    # Détermine si les points prédits doivent être affichés
    show26 = y_max >= 2026  # True si l'utilisateur a étendu le slider jusqu'à 2026 ou plus
    show27 = y_max >= 2027  # True si l'utilisateur a étendu jusqu'à 2027

    # Retourne les 3 nouveaux graphiques (dans l'ordre des Output déclarés)
    return (
        fig_cout_moyen(kpi_f, yx_f, sm_f, show26, show27),
        fig_nb_formations(kpi_f, yx_f, snb_f, show26, show27),
        fig_cout_total(kpi_f, yx_f, st_f, show26, show27),
    )


@app.callback(
    # Sorties : les 2 graphiques de modes à mettre à jour
    Output("graph-mode-bar", "figure"),
    Output("graph-mode-pie", "figure"),
    # Entrée : l'année sélectionnée via les boutons radio
    Input("year-mode-cat", "value"),
)
def update_mode_graphs(year_select):
    """
    Appelée automatiquement chaque fois qu'on clique sur un bouton radio.
    Met à jour les graphiques de répartition par mode.
    """
    return (
        fig_mode_bar(year_select),  # Barres horizontales
        fig_mode_pie(year_select),  # Camembert
    )


# ==================== 9. LANCEMENT ====================

if __name__ == "__main__":
    # Ce bloc ne s'exécute que si on lance le script directement (pas si importé)
    print("Starting Dash server on http://localhost:8052")
    app.run(
        host="localhost",  # Accessible uniquement sur cette machine
        port=8052,         # Port d'écoute (ouvrir http://localhost:8052 dans le navigateur)
        debug=False        # Mode debug désactivé (pas de rechargement automatique)
    )