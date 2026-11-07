import pandas as pd
import numpy as np
from typing import List
import uuid
from app.schemas.dataset import AnalyticalInsight

def generate_rule_based_insights(
    df: pd.DataFrame,
    numerical_cols: List[str],
    categorical_cols: List[str],
    datetime_cols: List[str]
) -> List[AnalyticalInsight]:
    insights: List[AnalyticalInsight] = []
    total_rows = len(df)
    if total_rows == 0:
        return insights

    # 1. Dominant Category Insight
    for cat in categorical_cols[:3]:
        s = df[cat].dropna().astype(str)
        if len(s) > 0:
            counts = s.value_counts()
            top_val = counts.index[0]
            top_cnt = int(counts.iloc[0])
            top_pct = round((top_cnt / len(s)) * 100, 1)
            
            if top_pct >= 35.0:
                insights.append(AnalyticalInsight(
                    id=str(uuid.uuid4()),
                    type="distribution",
                    importance="high" if top_pct > 60 else "medium",
                    title=f"Dominant Concentration in '{cat}'",
                    description=f"The category '{top_val}' accounts for {top_pct}% ({top_cnt:,} instances) of all recorded values in '{cat}'.",
                    metric_name="Category Share",
                    metric_value=f"{top_pct}%",
                    supporting_columns=[cat],
                    suggested_chart_type="donut",
                    evidence_stats={"category": top_val, "count": top_cnt, "total": len(s), "share_pct": top_pct}
                ))

    # 2. Strong Correlation Insight (Pearson)
    if len(numerical_cols) >= 2:
        num_df = df[numerical_cols].apply(pd.to_numeric, errors="coerce")
        corr = num_df.corr(method="pearson")
        
        found_strong = False
        cols = list(num_df.columns)
        for i in range(len(cols)):
            for j in range(i + 1, len(cols)):
                c1, c2 = cols[i], cols[j]
                val = corr.loc[c1, c2]
                if abs(val) >= 0.65 and not np.isnan(val):
                    direction = "positive" if val > 0 else "inverse"
                    insights.append(AnalyticalInsight(
                        id=str(uuid.uuid4()),
                        type="correlation",
                        importance="high",
                        title=f"Strong {direction.capitalize()} Correlation: {c1} & {c2}",
                        description=f"Pearson coefficient r = {round(val, 3)} indicates a strong {direction} linear co-variation between '{c1}' and '{c2}'. Note: correlation reflects numerical association, not causality.",
                        metric_name="Pearson r",
                        metric_value=f"{round(val, 3)}",
                        supporting_columns=[c1, c2],
                        suggested_chart_type="scatter",
                        evidence_stats={"r_squared": round(val ** 2, 3), "linear_coeff": round(val, 3)}
                    ))
                    found_strong = True
                    break
            if found_strong:
                break

    # 3. Skewness and Extreme Distribution Insight
    for num in numerical_cols[:3]:
        s = pd.to_numeric(df[num], errors="coerce").dropna()
        if len(s) > 10:
            sk = s.skew()
            mean_val = s.mean()
            median_val = s.median()
            if abs(sk) > 1.5:
                direction = "right (positive)" if sk > 0 else "left (negative)"
                diff_pct = round(abs(mean_val - median_val) / (mean_val if mean_val != 0 else 1) * 100, 1)
                insights.append(AnalyticalInsight(
                    id=str(uuid.uuid4()),
                    type="distribution",
                    importance="medium",
                    title=f"Substantial {direction} Skew in '{num}'",
                    description=f"'{num}' exhibits pronounced skewness (g1 = {round(sk, 2)}). Mean ({round(mean_val, 2)}) deviates from the median ({round(median_val, 2)}) by {diff_pct}%, indicating heavy tail distributions or extreme values.",
                    metric_name="Skewness",
                    metric_value=f"{round(sk, 2)}",
                    supporting_columns=[num],
                    suggested_chart_type="histogram",
                    evidence_stats={"skewness": round(sk, 2), "mean": round(mean_val, 2), "median": round(median_val, 2)}
                ))

    # 4. Outlier Anomaly Detection
    for num in numerical_cols[:3]:
        s = pd.to_numeric(df[num], errors="coerce").dropna()
        if len(s) > 20:
            q25 = s.quantile(0.25)
            q75 = s.quantile(0.75)
            iqr = q75 - q25
            lb = q25 - 1.5 * iqr
            ub = q75 + 1.5 * iqr
            outlier_s = s[(s < lb) | (s > ub)]
            outlier_cnt = len(outlier_s)
            outlier_pct = round((outlier_cnt / len(s)) * 100, 2)
            if outlier_cnt > 0 and outlier_pct > 2.0:
                insights.append(AnalyticalInsight(
                    id=str(uuid.uuid4()),
                    type="anomaly",
                    importance="high" if outlier_pct > 5 else "medium",
                    title=f"Potential Outliers Detected in '{num}'",
                    description=f"Identified {outlier_cnt:,} statistical outliers ({outlier_pct}% of column) beyond the 1.5*IQR threshold [{round(lb, 2)}, {round(ub, 2)}]. Maximum value recorded is {s.max():,}.",
                    metric_name="Outlier Count",
                    metric_value=f"{outlier_cnt:,} ({outlier_pct}%)",
                    supporting_columns=[num],
                    suggested_chart_type="box",
                    evidence_stats={"outlier_count": outlier_cnt, "iqr": round(iqr, 2), "min_outlier": round(float(outlier_s.min()), 2), "max_outlier": round(float(outlier_s.max()), 2)}
                ))

    # 5. Top Group Performance Disparity
    if categorical_cols and numerical_cols:
        cat = categorical_cols[0]
        num = numerical_cols[0]
        temp = df[[cat, num]].dropna()
        temp[num] = pd.to_numeric(temp[num], errors="coerce")
        grouped = temp.groupby(cat)[num].mean()
        if len(grouped) >= 2:
            top_group = grouped.idxmax()
            top_val = grouped.max()
            bot_group = grouped.idxmin()
            bot_val = grouped.min()
            ratio = round(top_val / bot_val, 2) if bot_val > 0 else 0
            if ratio >= 1.4:
                insights.append(AnalyticalInsight(
                    id=str(uuid.uuid4()),
                    type="comparison",
                    importance="high",
                    title=f"Disparity in '{num}' Across '{cat}' Segments",
                    description=f"'{top_group}' records the highest average {num} at {round(top_val, 2)}, which is {ratio}x greater than '{bot_group}' ({round(bot_val, 2)}).",
                    metric_name="Performance Ratio",
                    metric_value=f"{ratio}x",
                    supporting_columns=[cat, num],
                    suggested_chart_type="bar",
                    evidence_stats={"highest_segment": str(top_group), "highest_mean": round(float(top_val), 2), "lowest_segment": str(bot_group), "lowest_mean": round(float(bot_val), 2)}
                ))

    # 6. High Data Completeness / Missing Pattern
    total_missing = int(df.isna().sum().sum())
    total_cells = total_rows * len(df.columns)
    missing_pct = round((total_missing / total_cells) * 100, 2)
    if missing_pct > 10.0:
        insights.append(AnalyticalInsight(
            id=str(uuid.uuid4()),
            type="quality",
            importance="high",
            title="Significant Missing Data Pattern",
            description=f"The dataset exhibits {missing_pct}% overall cell sparsity ({total_missing:,} missing entries). Filter or impute prior to advanced inferential modelling.",
            metric_name="Missing Ratio",
            metric_value=f"{missing_pct}%",
            supporting_columns=[],
            suggested_chart_type=None,
            evidence_stats={"missing_cells": total_missing, "completeness_pct": round(100 - missing_pct, 2)}
        ))
    elif missing_pct == 0.0:
        insights.append(AnalyticalInsight(
            id=str(uuid.uuid4()),
            type="quality",
            importance="info",
            title="Exceptional Data Completeness",
            description=f"100% data completeness achieved across all {total_rows:,} records and {len(df.columns)} columns with zero null cells.",
            metric_name="Completeness",
            metric_value="100.0%",
            supporting_columns=[],
            suggested_chart_type=None,
            evidence_stats={"missing_cells": 0, "completeness_pct": 100.0}
        ))

    return insights

