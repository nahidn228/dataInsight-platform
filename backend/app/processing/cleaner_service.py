import pandas as pd
import numpy as np
from typing import List, Tuple
from app.schemas.dataset import CleaningOperation, CleanResponse

def apply_cleaning_operations(
    df: pd.DataFrame, 
    operations: List[CleaningOperation]
) -> Tuple[pd.DataFrame, List[str]]:
    # Never mutate in-place; copy
    cleaned_df = df.copy()
    applied_logs: List[str] = []

    for op in operations:
        action = op.operation
        col = op.column

        if action == "drop_duplicates":
            before_len = len(cleaned_df)
            cleaned_df = cleaned_df.drop_duplicates()
            diff = before_len - len(cleaned_df)
            applied_logs.append(f"Removed {diff:,} duplicate rows.")

        elif action == "strip_whitespace":
            if col and col in cleaned_df.columns:
                if cleaned_df[col].dtype == object:
                    cleaned_df[col] = cleaned_df[col].astype(str).str.strip()
                    applied_logs.append(f"Stripped leading/trailing whitespace in column '{col}'.")
            else:
                for c in cleaned_df.select_dtypes(include=["object"]).columns:
                    cleaned_df[c] = cleaned_df[c].astype(str).str.strip()
                applied_logs.append("Stripped leading/trailing whitespace across all text columns.")

        elif action == "drop_missing_rows":
            before_len = len(cleaned_df)
            if col and col in cleaned_df.columns:
                cleaned_df = cleaned_df.dropna(subset=[col])
                diff = before_len - len(cleaned_df)
                applied_logs.append(f"Dropped {diff:,} rows where '{col}' was null.")
            else:
                cleaned_df = cleaned_df.dropna()
                diff = before_len - len(cleaned_df)
                applied_logs.append(f"Dropped {diff:,} rows containing any null values.")

        elif action == "fill_missing_mean" and col and col in cleaned_df.columns:
            numeric_s = pd.to_numeric(cleaned_df[col], errors="coerce")
            mean_val = float(numeric_s.mean())
            null_count = int(cleaned_df[col].isna().sum())
            cleaned_df[col] = cleaned_df[col].fillna(mean_val)
            applied_logs.append(f"Imputed {null_count:,} missing values in '{col}' with mean ({round(mean_val, 2)}).")

        elif action == "fill_missing_median" and col and col in cleaned_df.columns:
            numeric_s = pd.to_numeric(cleaned_df[col], errors="coerce")
            median_val = float(numeric_s.median())
            null_count = int(cleaned_df[col].isna().sum())
            cleaned_df[col] = cleaned_df[col].fillna(median_val)
            applied_logs.append(f"Imputed {null_count:,} missing values in '{col}' with median ({round(median_val, 2)}).")

        elif action == "fill_missing_mode" and col and col in cleaned_df.columns:
            mode_val = cleaned_df[col].mode()
            if not mode_val.empty:
                val = mode_val.iloc[0]
                null_count = int(cleaned_df[col].isna().sum())
                cleaned_df[col] = cleaned_df[col].fillna(val)
                applied_logs.append(f"Imputed {null_count:,} missing values in '{col}' with mode ('{val}').")

        elif action == "fill_missing_constant" and col and col in cleaned_df.columns:
            const_val = op.constant_value if op.constant_value is not None else "Unknown"
            null_count = int(cleaned_df[col].isna().sum())
            cleaned_df[col] = cleaned_df[col].fillna(const_val)
            applied_logs.append(f"Replaced {null_count:,} missing values in '{col}' with constant '{const_val}'.")

        elif action == "drop_column" and col and col in cleaned_df.columns:
            cleaned_df = cleaned_df.drop(columns=[col])
            applied_logs.append(f"Dropped column '{col}'.")

        elif action == "remove_outliers_iqr" and col and col in cleaned_df.columns:
            numeric_s = pd.to_numeric(cleaned_df[col], errors="coerce")
            q25 = numeric_s.quantile(0.25)
            q75 = numeric_s.quantile(0.75)
            iqr = q75 - q25
            lb = q25 - 1.5 * iqr
            ub = q75 + 1.5 * iqr
            before_len = len(cleaned_df)
            cleaned_df = cleaned_df[(numeric_s >= lb) & (numeric_s <= ub)]
            diff = before_len - len(cleaned_df)
            applied_logs.append(f"Removed {diff:,} outliers outside [{round(lb, 2)}, {round(ub, 2)}] in column '{col}'.")

    return cleaned_df, applied_logs

