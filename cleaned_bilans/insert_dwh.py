# -*- coding: utf-8 -*-
import os
import sys
import pandas as pd
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────

CSV_FOLDER  = r"C:\Users\linab\OneDrive\Documents\cleaned_bilans"
DB_USER     = "root"
DB_PASSWORD = ""
DB_HOST     = "localhost"
DB_PORT     = 3306
DB_NAME     = "dwh_formations"

# Rename accented / special CSV column names → DB column names
RENAME_MAP = {
    "année":             "annee",
    "libellé":           "libelle",
    "thème":             "theme",
    "numéro_formation":  "numero_formation",
    "Date_complete": "Date_complete",
}

# Primary key columns per table (used for dedup before insert)
PK_MAP = {
    "dim_date":                       ["id_date"],
    "dim_formateur":                  ["id_formateur"],
    "dim_employe":                    ["matricule"],
    "dim_formation":                  ["id_formation"],
    "fact_participations_formations": ["matricule", "id_formation"],
    "fact_demandes":                  ["matricule", "id_date", "id_status"],
}

# Load order respects FK dependencies (dimensions before facts)
TABLES = [
    "dim_date",
    "dim_etat_formation",
    "dim_status",
    "dim_formateur",
    "dim_employe",
    "dim_formation",
    "fact_participations_formations",
    "fact_demandes",
]

# Tables whose reference data is seeded by the DB schema — skip CSV reload
SEEDED_TABLES = {"dim_etat_formation", "dim_status"}

# Columns that should be cast to numeric after loading as str
NUMERIC_COLS = {"id_date", "id_formateur", "id_etat", "id_status",
                "montant", "nb_participants", "nb_jours",
                "nb_demandes", "nb_demandes_approuvees", "nb_demandes_refusees",
                "jour", "mois", "trimestre", "semestre", "annee",
                "id_date_debut", "id_date_fin"}

# Columns to parse as dates
DATE_COLS = {"date_complete", "date_debut", "date_fin", "date_embauche"}


# ─────────────────────────────────────────────
# ENGINE
# ─────────────────────────────────────────────

engine = create_engine(
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
    connect_args={"charset": "utf8mb4"},
    pool_pre_ping=True,          # detect stale connections
)


# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def get_db_columns(table: str) -> list[str]:
    """Return the list of column names as defined in MySQL."""
    with engine.connect() as conn:
        rows = conn.execute(text(f"DESCRIBE `{table}`")).fetchall()
    return [row[0] for row in rows]


def cast_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Cast numeric and date columns to proper Python types."""
    for col in df.columns:
        if col in NUMERIC_COLS:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        elif col in DATE_COLS:
            df[col] = pd.to_datetime(df[col], errors="coerce", dayfirst=True)
    return df


def truncate_table(table: str) -> None:
    """Truncate a table, temporarily disabling FK checks."""
    with engine.begin() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        conn.execute(text(f"TRUNCATE TABLE `{table}`"))
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))


def load_csv(table: str) -> pd.DataFrame | None:
    """Read and clean the CSV for a given table. Returns None on failure."""
    path = os.path.join(CSV_FOLDER, f"{table}.csv")
    if not os.path.exists(path):
        return None

    df = pd.read_csv(path, sep=";", encoding="utf-8-sig", dtype=str)

    # Strip whitespace from column names
    df.columns = df.columns.str.strip()

    # Rename accented / oddly-cased columns
    df = df.rename(columns=RENAME_MAP)

    # Replace string "nan" / empty strings with real None
    df = df.replace({"nan": None, "NaN": None, "": None})
    df = df.where(df.notna(), other=None)

    return df


def dedup(df: pd.DataFrame, table: str) -> tuple[pd.DataFrame, int]:
    """Remove duplicates; returns cleaned df and number of rows dropped."""
    before = len(df)
    df = df.drop_duplicates()

    pk_cols = [c for c in PK_MAP.get(table, []) if c in df.columns]
    if pk_cols:
        df = df.drop_duplicates(subset=pk_cols, keep="last")

    return df, before - len(df)


def insert_table(table: str, df: pd.DataFrame) -> None:
    """Truncate then bulk-insert dataframe into MySQL table."""
    # Fetch live DB column list
    try:
        db_cols = get_db_columns(table)
    except SQLAlchemyError as e:
        raise RuntimeError(f"Impossible de lire le schéma de `{table}`: {e}") from e

    # Keep only columns that exist in the DB
    unknown = [c for c in df.columns if c not in db_cols]
    if unknown:
        print(f"       Colonnes CSV inconnues ignorées : {unknown}")
    df = df[[c for c in df.columns if c in db_cols]]

    # Cast types
    df = cast_columns(df)

    # Truncate & insert
    truncate_table(table)
    df.to_sql(table, con=engine, if_exists="append", index=False, chunksize=500)


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print("  DWH FUSIONNÉ — Insertion MySQL")
    print("=" * 60)

    # Connection test
    print("\n[0] Connexion à MySQL...")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"     Connecté à {DB_HOST}/{DB_NAME}\n")
    except SQLAlchemyError as e:
        print(f"      Connexion échouée : {e}")
        sys.exit(1)

    results = {"ok": [], "skipped": [], "missing": [], "error": []}

    for table in TABLES:
        print(f"[→] {table}")

        # Skip seed tables
        if table in SEEDED_TABLES:
            print(f"  Ignoré (table de référence déjà peuplée par le schéma)\n")
            results["skipped"].append(table)
            continue

        # Load CSV
        df = load_csv(table)
        if df is None:
            print(f"      Fichier introuvable : {table}.csv\n")
            results["missing"].append(table)
            continue

        print(f"    CSV lu : {len(df):,} lignes brutes")

        # Deduplicate
        df, dropped = dedup(df, table)
        if dropped:
            print(f"      {dropped} doublon(s) supprimé(s)")

        # Insert
        try:
            insert_table(table, df)
            print(f"      {len(df):,} lignes insérées\n")
            results["ok"].append(table)
        except Exception as e:
            print(f"      ERREUR : {str(e)[:200]}\n")
            results["error"].append(table)

    # ── Summary ──────────────────────────────
    print("=" * 60)
    print("  RÉSUMÉ")
    print("=" * 60)
    print(f"    Insérées  : {len(results['ok'])}  {results['ok']}")
    print(f"    Ignorées  : {len(results['skipped'])}  {results['skipped']}")
    print(f"    Manquantes: {len(results['missing'])}  {results['missing']}")
    if results["error"]:
        print(f"    Erreurs   : {len(results['error'])}  {results['error']}")
    print("=" * 60)

    if results["error"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
