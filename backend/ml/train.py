import sqlite3
from pathlib import Path
from datetime import datetime, timezone

import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline


BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "urban_ripple.db"
MODEL_PATH = BASE_DIR / "ml" / "models" / "isolation_forest.joblib"

MINIMUM_RECORDS = 20

NUMERIC_FEATURES = [
    "duration_hours",
    "affected_population",
]

CATEGORICAL_FEATURES = [
    "disruption_type",
    "severity",
    "status",
]


def load_disruptions():
    conn = sqlite3.connect(DB_PATH)

    try:
        dataframe = pd.read_sql_query(
            """
            SELECT
                id,
                disruption_type,
                severity,
                duration_hours,
                affected_population,
                status
            FROM disruptions
            WHERE duration_hours IS NOT NULL
              AND affected_population IS NOT NULL
            """,
            conn,
        )
    finally:
        conn.close()

    return dataframe


def get_model_status():
    dataframe = load_disruptions()

    if not MODEL_PATH.exists():
        return {
            "trained": False,
            "training_records": len(dataframe),
            "minimum_records": MINIMUM_RECORDS,
            "trained_at": None,
            "message": (
                "Insufficient data for training."
                if len(dataframe) < MINIMUM_RECORDS
                else "Training data is available. Model not trained yet."
            ),
        }

    try:
        artifact = joblib.load(MODEL_PATH)

        return {
            "trained": True,
            "training_records": artifact["training_records"],
            "minimum_records": MINIMUM_RECORDS,
            "trained_at": artifact["trained_at"],
            "message": "Isolation Forest model is available.",
        }

    except Exception:
        return {
            "trained": False,
            "training_records": len(dataframe),
            "minimum_records": MINIMUM_RECORDS,
            "trained_at": None,
            "message": "Model artifact could not be loaded.",
        }


def train_model():
    dataframe = load_disruptions()

    if len(dataframe) < MINIMUM_RECORDS:
        return {
            "trained": False,
            "training_records": len(dataframe),
            "minimum_records": MINIMUM_RECORDS,
            "message": (
                f"Training not started. Found {len(dataframe)} records; "
                f"at least {MINIMUM_RECORDS} are required."
            ),
        }

    features = dataframe[
        NUMERIC_FEATURES + CATEGORICAL_FEATURES
    ].copy()

    features["duration_hours"] = pd.to_numeric(
        features["duration_hours"], errors="coerce"
    )

    features["affected_population"] = pd.to_numeric(
        features["affected_population"], errors="coerce"
    )

    features = features.dropna()

    if len(features) < MINIMUM_RECORDS:
        return {
            "trained": False,
            "training_records": len(features),
            "minimum_records": MINIMUM_RECORDS,
            "message": "Not enough complete records after data cleaning.",
        }

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                StandardScaler(),
                NUMERIC_FEATURES,
            ),
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                CATEGORICAL_FEATURES,
            ),
        ]
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "model",
                IsolationForest(
                    n_estimators=200,
                    contamination="auto",
                    random_state=42,
                ),
            ),
        ]
    )

    pipeline.fit(features)

    trained_at = datetime.now(timezone.utc).isoformat()

    artifact = {
        "pipeline": pipeline,
        "training_records": len(features),
        "trained_at": trained_at,
        "feature_columns": (
            NUMERIC_FEATURES + CATEGORICAL_FEATURES
        ),
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, MODEL_PATH)

    return {
        "trained": True,
        "training_records": len(features),
        "trained_at": trained_at,
        "message": "Isolation Forest model trained successfully.",
    }


def detect_anomalies():
    if not MODEL_PATH.exists():
        return {
            "trained": False,
            "results": [],
            "message": "No trained model is available.",
        }

    artifact = joblib.load(MODEL_PATH)
    pipeline = artifact["pipeline"]

    dataframe = load_disruptions()

    if dataframe.empty:
        return {
            "trained": True,
            "results": [],
            "message": "No disruption records are available.",
        }

    features = dataframe[
        NUMERIC_FEATURES + CATEGORICAL_FEATURES
    ].copy()

    features["duration_hours"] = pd.to_numeric(
        features["duration_hours"], errors="coerce"
    )

    features["affected_population"] = pd.to_numeric(
        features["affected_population"], errors="coerce"
    )

    valid_mask = features.notna().all(axis=1)
    valid_features = features.loc[valid_mask]

    if valid_features.empty:
        return {
            "trained": True,
            "results": [],
            "message": "No complete records are available for analysis.",
        }

    predictions = pipeline.predict(valid_features)
    scores = pipeline.decision_function(valid_features)

    results = []

    for index, prediction, score in zip(
        valid_features.index, predictions, scores
    ):
        record = dataframe.loc[index]

        is_anomaly = int(prediction) == -1

        results.append({
            "id": str(record["id"]),
            "title": str(record["disruption_type"]),
            "location": str(record.get("location", "")),
            "anomaly": bool(is_anomaly),
            "classification": (
                "Anomaly" if is_anomaly else "Normal"
            ),
            "anomaly_score": round(float(score), 5),
        })

    return {
        "trained": True,
        "results": results,
        "message": (
            "Statistical anomaly screening completed. "
            "Results are not validated risk predictions."
        ),
    }
