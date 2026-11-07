import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, List, Any
from app.schemas.dataset import (
    OverallStatistics,
    NumericalStats,
    CategoricalStats,
    CategoryFrequency,
    CorrelationEntry,
    DataQualityReport,
    DataQualityMetric
)

def calculate_numerical_statistics(series: pd.Series, col_name: str) -> NumericalStats:
    clean_series = pd.to_numeric(series, errors="coerce").dropna()
    cnt = len(clean_series)
    if cnt == 0:
        return NumericalStats(column=col_name, count=0)

    val_mean = float(clean_series.mean())
    val_std = float(clean_series.std()) if cnt > 1 else 0.0
    val_var = float(clean_series.var()) if cnt > 1 else 0.0
    val_min = float(clean_series.min())
    val_max = float(clean_series.max())
    val_q25 = float(clean_series.quantile(0.25))
    val_median = float(clean_series.median())
    val_q75 = float(clean_series.quantile(0.75))
    val_iqr = float(val_q75 - val_q25)

    val_skew = float(clean_series.skew()) if cnt > 2 else 0.0
    val_kurt = float(clean_series.kurtosis()) if cnt > 3 else 0.0

    # Outliers count via IQR (1.5 * IQR)
    lower_bound = val_q25 - 1.5 * val_iqr
    upper_bound = val_q75 + 1.5 * val_iqr
    outliers = clean_series[(clean_series < lower_bound) | (clean_series > upper_bound)]
    outliers_count = len(outliers)
    zeros_count = int((clean_series == 0).sum())

    return NumericalStats(
        column=col_name,
        count=cnt,
        mean=round(val_mean, 4),
        std=round(val_std, 4),
        variance=round(val_var, 4),
        min=round(val_min, 4),
        q25=round(val_q25, 4),
        median=round(val_median, 4),
        q75=round(val_q75, 4),
        max=round(val_max, 4),
        iqr=round(val_iqr, 4),
        skewness=round(val_skew, 4) if not np.isnan(val_skew) else 0.0,
        kurtosis=round(val_kurt, 4) if not np.isnan(val_kurt) else 0.0,
        outliers_count=outliers_count,
        zeros_count=zeros_count
    )

def calculate_categorical_statistics(series: pd.Series, col_name: str) -> CategoricalStats:
    clean_series = series.dropna().astype(str)
    cnt = len(clean_series)
    if cnt == 0:
        return CategoricalStats(column=col_name, count=0, unique_count=0)

    val_counts = clean_series.value_counts()
    unique_count = len(val_counts)
    top_val = str(val_counts.index[0]) if unique_count > 0 else None
    top_freq = int(val_counts.iloc[0]) if unique_count > 0 else None
    least_val = str(val_counts.index[-1]) if unique_count > 0 else None
    least_freq = int(val_counts.iloc[-1]) if unique_count > 0 else None

    # Top 20 frequencies
    top_entries = val_counts.head(20)
    freqs = [
        CategoryFrequency(
            value=str(cat),
            count=int(freq),
            percentage=round(float(freq) / cnt * 100, 2)
        )
        for cat, freq in top_entries.items()
    ]

    return CategoricalStats(
        column=col_name,
        count=cnt,
        unique_count=unique_count,
        top_value=top_val,
        top_frequency=top_freq,
        least_value=least_val,
        least_frequency=least_freq,
        frequencies=freqs
    )

def compute_overall_statistics(df: pd.DataFrame, numerical_cols: List[str], categorical_cols: List[str]) -> OverallStatistics:
    total_records = len(df)
    total_columns = len(df.columns)
    
    total_missing_cells = int(df.isna().sum().sum())
    total_cells = total_records * total_columns if total_columns > 0 else 1
    missing_pct = round(total_missing_cells / total_cells * 100, 2)
    completeness_pct = round(100.0 - missing_pct, 2)

    duplicate_rows = int(df.duplicated().sum())
    dup_pct = round(duplicate_rows / total_records * 100, 2) if total_records > 0 else 0.0

    num_stats: Dict[str, NumericalStats] = {}
    for col in numerical_cols:
        if col in df.columns:
            num_stats[col] = calculate_numerical_statistics(df[col], col)

    cat_stats: Dict[str, CategoricalStats] = {}
    for col in categorical_cols:
        if col in df.columns:
            cat_stats[col] = calculate_categorical_statistics(df[col], col)

    # Compute correlation matrix for numerical columns
    correlations: List[CorrelationEntry] = []
    if len(numerical_cols) >= 2:
        # Downsample for correlation if massive to guarantee sub-second latency
        corr_df = df[numerical_cols]
        if len(corr_df) > 50000:
            corr_df = corr_df.sample(50000, random_state=42)
        
        num_clean = corr_df.apply(pd.to_numeric, errors="coerce")
        pearson_mat = num_clean.corr(method="pearson")
        spearman_mat = num_clean.corr(method="spearman")

        cols = list(num_clean.columns)
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                c1, c2 = cols[i], cols[j]
                p_val = pearson_mat.loc[c1, c2]
                s_val = spearman_mat.loc[c1, c2]
                correlations.append(
                    CorrelationEntry(
                        var1=c1,
                        var2=c2,
                        pearson=round(float(p_val), 4) if not np.isnan(p_val) else None,
                        spearman=round(float(s_val), 4) if not np.isnan(s_val) else None
                    )
                )

    return OverallStatistics(
        total_records=total_records,
        total_columns=total_columns,
        numerical_count=len(numerical_cols),
        categorical_count=len(categorical_cols),
        datetime_count=len([c for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c])]),
        total_missing_cells=total_missing_cells,
        missing_percentage=missing_pct,
        duplicate_rows_count=duplicate_rows,
        duplicate_percentage=dup_pct,
        completeness_percentage=completeness_pct,
        numerical_stats=num_stats,
        categorical_stats=cat_stats,
        correlations=correlations
    )

def evaluate_data_quality(df: pd.DataFrame, numerical_cols: List[str], categorical_cols: List[str], dataset_id: str) -> DataQualityReport:
    total_records = len(df)
    total_columns = len(df.columns)
    total_cells = total_records * total_columns if total_columns > 0 else 1
    total_missing = int(df.isna().sum().sum())
    missing_pct = round(total_missing / total_cells * 100, 2)
    duplicate_rows = int(df.duplicated().sum())
    duplicate_pct = round(duplicate_rows / total_records * 100, 2) if total_records > 0 else 0.0

    metrics: List[DataQualityMetric] = []
    recommendations: List[str] = []

    if duplicate_rows > 0:
        recommendations.append(f"Detected {duplicate_rows:,} ({duplicate_pct}%) duplicate rows. Consider deduplicating the dataset.")

    for col in df.columns:
        s = df[col]
        missing_cnt = int(s.isna().sum())
        completeness = round(((total_records - missing_cnt) / total_records * 100), 2) if total_records > 0 else 100.0
        distinct_cnt = int(s.nunique())
        
        outliers = 0
        if col in numerical_cols:
            clean_s = pd.to_numeric(s, errors="coerce").dropna()
            if len(clean_s) > 10:
                q25 = clean_s.quantile(0.25)
                q75 = clean_s.quantile(0.75)
                iqr = q75 - q25
                outliers = int(((clean_s < (q25 - 1.5 * iqr)) | (clean_s > (q75 + 1.5 * iqr))).sum())

        # Scoring health (100 base, penalize missing and heavy outliers)
        penalty = (missing_cnt / max(total_records, 1)) * 50
        if outliers > 0:
            penalty += min((outliers / max(total_records, 1)) * 30, 20)
        health_score = round(max(0.0, 100.0 - penalty), 1)

        metrics.append(
            DataQualityMetric(
                column=col,
                inferred_type="numerical" if col in numerical_cols else ("categorical" if col in categorical_cols else "other"),
                completeness=completeness,
                missing_count=missing_cnt,
                distinct_count=distinct_cnt,
                outlier_count=outliers,
                duplicate_values=total_records - distinct_cnt,
                data_health_score=health_score
            )
        )

        if missing_cnt > 0.4 * total_records:
            recommendations.append(f"Column '{col}' has {completeness}% completeness. More than 40% of records are empty; evaluate imputation or feature drop.")
        if outliers > 0.05 * total_records and outliers > 20:
            recommendations.append(f"Column '{col}' contains {outliers:,} potential outliers via IQR analysis. Consider robust scaling or capping.")

    overall_health = round(sum(m.data_health_score for m in metrics) / max(len(metrics), 1), 1)

    if not recommendations:
        recommendations.append("Dataset is clean with high completeness across all fields. No critical anomalies detected.")

    return DataQualityReport(
        dataset_id=dataset_id,
        overall_health_score=overall_health,
        total_cells=total_cells,
        total_missing=total_missing,
        missing_cells_percentage=missing_pct,
        duplicate_rows=duplicate_rows,
        duplicate_rows_percentage=duplicate_pct,
        columns_quality=metrics,
        recommendations=recommendations
    )

