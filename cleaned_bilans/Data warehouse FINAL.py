import os
import random
import pandas as pd
from faker import Faker
from datetime import datetime, date

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

FOLDER   = r"C:\Users\linab\OneDrive\Documents\cleaned_bilans"
OUT      = FOLDER
START_DT = datetime(2020, 1, 1)
END_DT   = datetime(2025, 12, 31)

fake = Faker("fr_FR")
Faker.seed(42)
random.seed(42)

print("=" * 55)
print("  DWH FUSIONNÉ — VERSION STABLE")
print("=" * 55)


# ─────────────────────────────────────────────
# HELPERS — DETECTION & INFERENCE
# ─────────────────────────────────────────────

def detect_annulees(df: pd.DataFrame) -> set:
    """Return a set of formation_ids that are flagged as cancelled."""
    if df.empty:
        return set()

    ANNUL_KEYWORDS = [
        "ANNUL", "ANNULE", "ANNULATION", "CANCEL",
        "SUPPRIM", "REFUS", "NON REALISE", "NON REALISEE", "REPORT",
    ]
    mask = pd.Series(False, index=df.index)

    for col in ["montant_raw", "etat_dossier", "facture", "status", "etat_formation"]:
        if col in df.columns:
            col_upper = df[col].astype(str).str.upper().str.strip()
            for kw in ANNUL_KEYWORDS:
                mask |= col_upper.str.contains(kw, na=False)

    return set(df.loc[mask, "formation_id"].astype(str).str.strip().unique())


def infer_poste(affectation: str) -> str:
    """Derive job title from affectation string."""
    aff = str(affectation).upper()
    rules = [
        (["DIRECTION", "DIRECTEUR", "DGL"],                        "Directeur"),
        (["CHEF", "RESPONSABLE", "HEAD"],                          "Responsable"),
        (["AUDIT", "INSPECTION", "CONTROLE", "CONFORMITE"],        "Auditeur"),
        (["INFORMATIQUE", "INF-", "IT", "DIGITAL", "DVP"],         "Informaticien"),
        (["COMPTABILITE", "FIN-", "TRESORERIE", "FINANCIER"],      "Comptable"),
        (["RH", "DRH", "RESSOURCES HUMAINES", "FORMATION"],        "RH"),
        (["COMMERCIAL", "VENTE", "MARCHE", "BDD", "PME"],          "Commercial"),
        (["JURIDIQUE", "CTX", "CONTENTIEUX"],                      "Juriste"),
        (["AGENCE", "SIEGE", "RESEAU"],                            "Chargé de clientèle"),
    ]
    for keywords, title in rules:
        if any(k in aff for k in keywords):
            return title
    return "Employé"


def infer_category(theme) -> str:
    """Derive training category from theme string."""
    t = str(theme).lower() if pd.notna(theme) else ""
    if any(k in t for k in ["finance", "ifrs", "fiscal", "comptab", "trésor", "banq"]):
        return "Finance"
    if any(k in t for k in ["it", "oracle", "excel", "digital", "sql", "informatiq"]):
        return "Technique"
    if any(k in t for k in ["management", "leadership", "commercial", "vente", "rh"]):
        return "Management"
    if any(k in t for k in ["conformit", "compliance", "risque", "audit", "loi"]):
        return "Compliance"
    return "Autre"


def infer_bureau(name: str) -> str:
    """Derive office location from trainer name."""
    n = str(name).upper()
    if "BANQUE" in n:
        return "Siège"
    if "SFAX" in n:
        return "Sfax"
    return "Externe"


# ─────────────────────────────────────────────
# HELPERS — GENRE
# ─────────────────────────────────────────────

FEMININ_NAMES = {
    "Aicha", "Fatma", "Mariem", "Nour", "Sofia", "Leila", "Amira",
    "Sara", "Yasmine", "Hend", "Rania", "Imen", "Wafa", "Salma",
    "Nadia", "Hajer", "Ons", "Manel", "Chaima",
}

MASCULIN_NAMES = {
    "Mohamed", "Ahmed", "Ali", "Omar", "Khaled", "Youssef", "Amine",
    "Karim", "Hassan", "Mehdi", "Rami", "Sami", "Walid", "Bilel",
    "Anis", "Hichem", "Lotfi", "Nabil", "Tarek",
}


def get_genre_from_firstname(firstname) -> str:
    """Return 'F' or 'M' based on first name heuristics."""
    if not firstname or pd.isna(firstname):
        return random.choice(["M", "F"])

    prenom = str(firstname).strip().split()[0].title()

    if prenom in FEMININ_NAMES:
        return "F"
    if prenom in MASCULIN_NAMES:
        return "M"

    # Suffix heuristics
    if prenom.endswith(("a", "ia", "ya", "na", "ra")):
        return "F"
    if prenom.endswith(("i", "el", "ed", "id", "im")):
        return "M"

    # Default fallback
    return random.choice(["M", "F"])


# ─────────────────────────────────────────────
# LOAD RAW DATA
# ─────────────────────────────────────────────

print("\n[1/6] Chargement des fichiers Excel...")

files = [os.path.join(FOLDER, f"clean_{y}.xlsx") for y in range(2020, 2026)]

formations_list, parts_list = [], []

for fp in files:
    print(f"     Lecture : {fp}")
    if not os.path.exists(fp):
        print(f"       Fichier non trouvé — ignoré")
        continue
    try:
        xls = pd.ExcelFile(fp)
    except Exception as e:
        print(f"     ✗ Erreur lecture : {e}")
        continue

    if "Formations" in xls.sheet_names:
        formations_list.append(pd.read_excel(xls, "Formations"))
    else:
        print("       Feuille 'Formations' absente")

    for sh in xls.sheet_names:
        if sh == "Formations":
            continue
        df = pd.read_excel(xls, sh)
        if "matricule" in " ".join(df.columns).lower():
            parts_list.append(df)

if not formations_list:
    raise ValueError("Aucun fichier Formations chargé — vérifiez le dossier.")
if not parts_list:
    raise ValueError("Aucun fichier Participations chargé — vérifiez les feuilles.")

formations_raw = pd.concat(formations_list, ignore_index=True)
parts_raw      = pd.concat(parts_list,      ignore_index=True)

print(f"     → {len(formations_raw):,} formations brutes")
print(f"     → {len(parts_raw):,} participations brutes")

ANNULEES = detect_annulees(formations_raw)
print(f"     → {len(ANNULEES)} formations annulées détectées")


# ─────────────────────────────────────────────
# DIM DATE
# ─────────────────────────────────────────────

print("\n[2/6] Construction des dimensions...")
print("     dim_date...")

dates = pd.date_range(START_DT, END_DT)
dim_date = pd.DataFrame({
    "id_date":      range(1, len(dates) + 1),
    "Date_complete": dates,
    "jour":         dates.day,
    "mois":         dates.month,
    "trimestre":    dates.quarter,
    "semestre":     ((dates.month - 1) // 6 + 1),
    "année":        dates.year,
})


# ─────────────────────────────────────────────
# DIM ETAT FORMATION
# ─────────────────────────────────────────────

dim_etat_formation = pd.DataFrame([
    {"id_etat": "P",  "libellé": "Planifiée"},
    {"id_etat": "EC", "libellé": "En cours"},
    {"id_etat": "T",  "libellé": "Terminée"},
    {"id_etat": "A",  "libellé": "Annulée"},
])

print("     dim_etat_formation... OK")


# ─────────────────────────────────────────────
# DIM STATUS
# ─────────────────────────────────────────────

dim_status = pd.DataFrame([
    {"id_status": 1, "status": "En attente"},
    {"id_status": 2, "status": "Approuvée"},
    {"id_status": 3, "status": "Refusée"},
])

print("     dim_status... OK")


# ─────────────────────────────────────────────
# DIM EMPLOYE
# ─────────────────────────────────────────────

print("     dim_employe...")

emp_unique = (
    parts_raw[["matricule", "nom", "affectation"]]
    .drop_duplicates("matricule")
    .copy()
)
emp_unique["firstName"]    = emp_unique["nom"].astype(str).str.split(n=1).str[0].fillna("")
emp_unique["lastName"]     = emp_unique["nom"].astype(str).str.split(n=1).str[1].fillna("")
emp_unique["genre"]        = emp_unique["firstName"].apply(get_genre_from_firstname)
emp_unique["poste"]        = emp_unique["affectation"].apply(infer_poste)
emp_unique["departement"]  = emp_unique["affectation"].fillna("Non défini")
emp_unique["date_embauche"] = [
    fake.date_between(date(2015, 1, 1), date(2024, 12, 31)).strftime("%d/%m/%Y")
    for _ in range(len(emp_unique))
]

dim_employe = emp_unique[[
    "matricule", "firstName", "lastName",
    "departement", "poste", "genre", "affectation", "date_embauche",
]].copy()

poste_map = dim_employe.set_index("matricule")["poste"].to_dict()
print(f"     → {len(dim_employe):,} employés")


# ─────────────────────────────────────────────
# DIM FORMATEUR
# ─────────────────────────────────────────────

print("     dim_formateur...")

formateurs_raw = set()
for val in formations_raw.get("formateur", pd.Series(dtype=str)).dropna():
    for f in str(val).split(","):
        f = f.strip()
        if f:
            formateurs_raw.add(f)

formateurs_list_sorted = sorted(formateurs_raw)   # deterministic ordering

dim_formateur = pd.DataFrame({
    "id_formateur": range(1, len(formateurs_list_sorted) + 1),
    "nom":          formateurs_list_sorted,
    "type":         ["Interne" if "BANQUE" in f.upper() else "Externe"
                     for f in formateurs_list_sorted],
    "bureau":       [infer_bureau(f) for f in formateurs_list_sorted],
})

map_formateur = dict(zip(dim_formateur["nom"], dim_formateur["id_formateur"]))
print(f"     → {len(dim_formateur):,} formateurs")


# ─────────────────────────────────────────────
# DIM FORMATION
# ─────────────────────────────────────────────

print("     dim_formation...")

ETAT_MAP = {
    "planifiée": "P",
    "en cours":  "EC",
    "terminée":  "T",
    "annulée":   "A",
}

# Build a lookup: date → id_date
date_to_id = dim_date.set_index(
    dim_date["Date_complete"].dt.normalize()
)["id_date"].to_dict()

rows = []
for _, r in formations_raw.iterrows():

    fid      = str(r.get("formation_id", "")).strip()
    etat_raw = str(r.get("status", "")).lower()
    id_etat  = "A" if fid in ANNULEES else ETAT_MAP.get(etat_raw, "T")

    # montant
    if fid in ANNULEES:
        montant = None
    elif "gratuit" in str(r.get("montant_raw", "")).lower():
        montant = 0.0
    else:
        montant = pd.to_numeric(r.get("montant"), errors="coerce")

    # dates
    date_debut = pd.to_datetime(r.get("date_debut"), errors="coerce")
    date_fin   = pd.to_datetime(r.get("date_fin"),   errors="coerce")

    id_date_debut = date_to_id.get(date_debut.normalize(), None) if pd.notna(date_debut) else None
    id_date_fin   = date_to_id.get(date_fin.normalize(),   None) if pd.notna(date_fin)   else None

    # first formateur only
    formateur_str = str(r.get("formateur", "")).split(",")[0].strip()
    id_formateur  = map_formateur.get(formateur_str, 1)

    rows.append({
        "id_formation":   fid,
        "numero_formation": r.get("numero_formation", None),
        "id_formateur":   id_formateur,
        "id_etat":        id_etat,
        "mode":           r.get("mode", None),
        "montant":        montant,
        "thème":          r.get("theme", None),
        "category":       infer_category(r.get("theme")),
        "lieu":           r.get("lieu", None),
        "date_debut":     date_debut,
        "date_fin":       date_fin,
        "id_date_debut":  id_date_debut,
        "id_date_fin":    id_date_fin,
    })

dim_formation = pd.DataFrame(rows)
print(f"     → {len(dim_formation):,} formations")


# ─────────────────────────────────────────────
# FACT PARTICIPATIONS
# ─────────────────────────────────────────────

print("\n[3/6] Construction des tables de faits...")
print("     fact_participations_formations...")

fact_part = parts_raw[["matricule", "formation_id"]].copy()
fact_part.columns = ["matricule", "id_formation"]

# Join date_debut from dim_formation to get id_date
id_date_map = dim_formation.set_index("id_formation")["id_date_debut"].to_dict()
fact_part["id_date"]        = fact_part["id_formation"].astype(str).map(id_date_map)
fact_part["nb_participants"] = 1
fact_part["nb_jours"]        = 1   # default; override if source has duration

print(f"     → {len(fact_part):,} lignes")


# ─────────────────────────────────────────────
# FACT DEMANDES
# ─────────────────────────────────────────────

print("     fact_demandes...")

POSTE_CAT = {
    "Informaticien": ["Technique", "Technique", "Management"],
    "Comptable":     ["Finance", "Compliance"],
    "RH":            ["Management"],
}

matricules = dim_employe["matricule"].tolist()
n_demandes = int(len(fact_part) * 1.7)

dem_rows = []
for _ in range(n_demandes):
    mat    = random.choice(matricules)
    poste  = poste_map.get(mat, "Employé")
    cat    = random.choice(POSTE_CAT.get(poste, ["Finance", "Technique"]))
    status = random.choices([1, 2, 3], weights=[0.20, 0.65, 0.15])[0]

    dem_rows.append({
        "matricule":              mat,
        "id_date":                random.randint(1, len(dim_date)),
        "category":               cat,
        "id_status":              status,
        "nb_demandes":            1,
        "nb_demandes_approuvees": 1 if status == 2 else 0,
        "nb_demandes_refusees":   1 if status == 3 else 0,
    })

fact_demandes = pd.DataFrame(dem_rows)
print(f"     → {len(fact_demandes):,} lignes")


# ─────────────────────────────────────────────
# EXPORT — CSV
# ─────────────────────────────────────────────

print("\n[4/6] Sauvegarde CSV...")

COLUMNS_ORDER = {
    "dim_date":                      ["id_date", "Date_complete", "jour", "mois", "trimestre", "semestre", "année"],
    "dim_etat_formation":            ["id_etat", "libellé"],
    "dim_status":                    ["id_status", "status"],
    "dim_formateur":                 ["id_formateur", "nom", "type", "bureau"],
    "dim_employe":                   ["matricule", "firstName", "lastName", "departement", "poste", "genre", "affectation", "date_embauche"],
    "dim_formation":                 ["id_formation", "numero_formation", "id_formateur", "id_etat", "mode", "montant", "thème", "category", "lieu", "date_debut", "date_fin", "id_date_debut", "id_date_fin"],
    "fact_participations_formations":["matricule", "id_formation", "id_date", "nb_participants", "nb_jours"],
    "fact_demandes":                 ["matricule", "id_date", "category", "id_status", "nb_demandes", "nb_demandes_approuvees", "nb_demandes_refusees"],
}

TABLES = {
    "dim_date":                       dim_date,
    "dim_etat_formation":             dim_etat_formation,
    "dim_status":                     dim_status,
    "dim_formateur":                  dim_formateur,
    "dim_employe":                    dim_employe,
    "dim_formation":                  dim_formation,
    "fact_participations_formations": fact_part,
    "fact_demandes":                  fact_demandes,
}

for name, df in TABLES.items():
    cols_wanted  = COLUMNS_ORDER[name]
    cols_present = [c for c in cols_wanted if c in df.columns]
    missing      = [c for c in cols_wanted if c not in df.columns]

    if missing:
        print(f"       {name} — colonnes absentes ignorées : {missing}")

    path = os.path.join(OUT, f"{name}.csv")
    df[cols_present].to_csv(
        path, index=False, encoding="utf-8-sig",
        sep=";", date_format="%d/%m/%Y",
    )
    print(f"       {name}.csv — {len(df):,} lignes, {len(cols_present)} colonnes")

print("\n[5/6] Vérification des clés étrangères...")

# Quick FK sanity checks (non-blocking)
def fk_check(fact_col, dim_col, label):
    orphans = ~fact_col.isin(dim_col)
    if orphans.any():
        print(f"       {label} : {orphans.sum()} valeurs orphelines")
    else:
        print(f"       {label} : OK")

fk_check(fact_part["matricule"],    dim_employe["matricule"],    "fact_participations → dim_employe")
fk_check(fact_part["id_formation"], dim_formation["id_formation"], "fact_participations → dim_formation")
fk_check(fact_demandes["matricule"],dim_employe["matricule"],    "fact_demandes → dim_employe")
fk_check(fact_demandes["id_status"],dim_status["id_status"],     "fact_demandes → dim_status")

print("\n" + "=" * 55)
print("  Génération terminée avec succès !")
print(f"  Fichiers enregistrés dans : {OUT}")
print("=" * 55)
