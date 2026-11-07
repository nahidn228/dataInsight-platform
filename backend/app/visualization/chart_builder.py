import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from app.schemas.dataset import ChartRecommendation, ChartConfigRequest, ChartDataResponse, FilterCondition

def apply_dataframe_filters(df: pd.DataFrame, filters: List[FilterCondition]) -> pd.DataFrame:
    if not filters:
        return df

    filtered = df.copy()
    for f in filters:
        col = f.column
        if col not in filtered.columns:
            continue
        op = f.operator
        val = f.value

        try:
            if op == "eq":
                filtered = filtered[filtered[col].astype(str) == str(val)]
            elif op == "neq":
                filtered = filtered[filtered[col].astype(str) != str(val)]
            elif op == "in" and isinstance(val, list):
                filtered = filtered[filtered[col].isin(val)]
            elif op == "gt":
                filtered = filtered[pd.to_numeric(filtered[col], errors="coerce") > float(val)]
            elif op == "gte":
                filtered = filtered[pd.to_numeric(filtered[col], errors="coerce") >= float(val)]
            elif op == "lt":
                filtered = filtered[pd.to_numeric(filtered[col], errors="coerce") < float(val)]
            elif op == "lte":
                filtered = filtered[pd.to_numeric(filtered[col], errors="coerce") <= float(val)]
            elif op == "between" and f.value2 is not None:
                numeric_series = pd.to_numeric(filtered[col], errors="coerce")
                filtered = filtered[(numeric_series >= float(val)) & (numeric_series <= float(f.value2))]
            elif op == "contains":
                filtered = filtered[filtered[col].astype(str).str.contains(str(val), case=False, na=False)]
        except Exception:
            continue

    return filtered

def recommend_visualizations(
    df: pd.DataFrame,
    numerical_cols: List[str],
    categorical_cols: List[str],
    datetime_cols: List[str]
) -> List[ChartRecommendation]:
    recs: List[ChartRecommendation] = []
    
    # 1. Date + Numerical -> Time Series / Trend Line
    if datetime_cols and numerical_cols:
        d_col = datetime_cols[0]
        n_col = numerical_cols[0]
        recs.append(ChartRecommendation(
            chart_id="rec_trend_1",
            chart_type="line",
            title=f"Temporal Trend of {n_col} over {d_col}",
            reason=f"Shows historical progression and trend of '{n_col}' chronologically.",
            x_column=d_col,
            y_column=n_col,
            aggregation="mean"
        ))

    # 2. Categorical distribution -> Donut or Bar
    if categorical_cols:
        cat_primary = categorical_cols[0]
        recs.append(ChartRecommendation(
            chart_id="rec_cat_dist",
            chart_type="donut",
            title=f"Category Distribution of {cat_primary}",
            reason=f"Illustrates the proportion of top categories in '{cat_primary}'.",
            x_column=cat_primary,
            aggregation="count",
            category_limit=10
        ))

    # 3. Categorical + Numerical -> Bar Chart (Sum or Mean)
    if categorical_cols and numerical_cols:
        cat_col = categorical_cols[0]
        num_col = numerical_cols[0]
        recs.append(ChartRecommendation(
            chart_id="rec_bar_agg",
            chart_type="bar",
            title=f"Average {num_col} by {cat_col}",
            reason=f"Compares mean metric values across distinct groups in '{cat_col}'.",
            x_column=cat_col,
            y_column=num_col,
            aggregation="mean",
            category_limit=12,
            sort_order="desc"
        ))

    # 4. Numerical Distribution -> Histogram
    if numerical_cols:
        primary_num = numerical_cols[0]
        recs.append(ChartRecommendation(
            chart_id="rec_hist",
            chart_type="histogram",
            title=f"Distribution Profile of {primary_num}",
            reason=f"Reveals spread, skewness, normality, and central tendency for '{primary_num}'.",
            x_column=primary_num
        ))

    # 5. Two Numerical Columns -> Scatter Plot
    if len(numerical_cols) >= 2:
        n1, n2 = numerical_cols[0], numerical_cols[1]
        recs.append(ChartRecommendation(
            chart_id="rec_scatter",
            chart_type="scatter",
            title=f"Relationship: {n1} vs {n2}",
            reason=f"Identifies correlation, linear/non-linear clusters, and extreme points between {n1} and {n2}.",
            x_column=n1,
            y_column=n2,
            group_by=categorical_cols[0] if categorical_cols else None
        ))

    # 6. Numerical Comparison by Category -> Box Plot
    if categorical_cols and numerical_cols:
        c_col = categorical_cols[0]
        n_col = numerical_cols[1] if len(numerical_cols) > 1 else numerical_cols[0]
        recs.append(ChartRecommendation(
            chart_id="rec_box",
            chart_type="box",
            title=f"Spread & Quartiles of {n_col} grouped by {c_col}",
            reason=f"Compares median, interquartile ranges, and variance of '{n_col}' across top {c_col} segments.",
            x_column=c_col,
            y_column=n_col
        ))

    # 7. Multiple Numerical -> Correlation Heatmap
    if len(numerical_cols) >= 3:
        recs.append(ChartRecommendation(
            chart_id="rec_heatmap",
            chart_type="heatmap",
            title="Multivariate Correlation Matrix",
            reason="Synthesizes Pearson correlations between all numerical indicators to spotlight strong relationships.",
            x_column=numerical_cols[0]
        ))

    return recs

def build_chart_data(df: pd.DataFrame, config: ChartConfigRequest) -> ChartDataResponse:
    target_df = df
    if config.filters:
        target_df = apply_dataframe_filters(target_df, config.filters)

    c_type = config.chart_type
    x_col = config.x_column
    y_col = config.y_column
    group_col = config.group_by
    agg = config.aggregation or "count"
    limit = config.limit or 20
    is_sampled = False
    sample_rate = 1.0

    # Large dataset sampling safeguard for scatter/distribution plots to preserve responsiveness
    if c_type in ["scatter", "histogram", "box", "violin"] and len(target_df) > 8000:
        is_sampled = True
        sample_rate = round(8000 / len(target_df), 3)
        target_df = target_df.sample(8000, random_state=42)

    chart_title = config.title or f"{c_type.capitalize()} of {x_col}"
    data_points: List[Dict[str, Any]] = []

    # 1. Bar, Horizontal Bar, Donut, Pie, Area
    if c_type in ["bar", "horizontal_bar", "donut", "pie", "area", "treemap"]:
        if y_col and y_col in target_df.columns:
            # Grouped aggregation
            temp_df = target_df[[x_col, y_col]].dropna()
            temp_df[y_col] = pd.to_numeric(temp_df[y_col], errors="coerce")
            
            if agg == "sum":
                grouped = temp_df.groupby(x_col)[y_col].sum()
            elif agg == "mean":
                grouped = temp_df.groupby(x_col)[y_col].mean()
            elif agg == "median":
                grouped = temp_df.groupby(x_col)[y_col].median()
            elif agg == "min":
                grouped = temp_df.groupby(x_col)[y_col].min()
            elif agg == "max":
                grouped = temp_df.groupby(x_col)[y_col].max()
            else:
                grouped = temp_df.groupby(x_col)[y_col].count()
        else:
            grouped = target_df[x_col].value_counts()

        # Sorting & limit
        if config.sort_by == "desc":
            grouped = grouped.sort_values(ascending=False)
        elif config.sort_by == "asc":
            grouped = grouped.sort_values(ascending=True)

        grouped = grouped.head(limit)

        for k, v in grouped.items():
            data_points.append({
                "label": str(k),
                "value": round(float(v), 2) if isinstance(v, (float, np.floating)) else int(v),
                "name": str(k)
            })

        return ChartDataResponse(
            chart_type=c_type,
            title=chart_title,
            data=data_points,
            x_axis_label=x_col,
            y_axis_label=f"{agg.capitalize()} of {y_col}" if y_col else "Count",
            is_sampled=is_sampled,
            sample_rate=sample_rate
        )

    # 2. Line / Time-Series Chart
    elif c_type in ["line"]:
        if y_col and y_col in target_df.columns:
            temp_df = target_df[[x_col, y_col]].dropna()
            temp_df[y_col] = pd.to_numeric(temp_df[y_col], errors="coerce")
            grouped = temp_df.groupby(x_col)[y_col].mean().reset_index()
            # Sort chronologically or by X
            grouped = grouped.sort_values(by=x_col).head(limit if limit > 0 else 50)
            for _, row in grouped.iterrows():
                val = row[y_col]
                data_points.append({
                    "label": str(row[x_col]),
                    "value": round(float(val), 2) if not np.isnan(val) else 0.0,
                    "name": str(row[x_col])
                })
        else:
            counts = target_df[x_col].value_counts().sort_index().head(50)
            for k, v in counts.items():
                data_points.append({
                    "label": str(k),
                    "value": int(v),
                    "name": str(k)
                })

        return ChartDataResponse(
            chart_type=c_type,
            title=chart_title,
            data=data_points,
            x_axis_label=x_col,
            y_axis_label=f"{agg.capitalize()} of {y_col}" if y_col else "Frequency",
            is_sampled=is_sampled,
            sample_rate=sample_rate
        )

    # 3. Histogram
    elif c_type == "histogram":
        s = pd.to_numeric(target_df[x_col], errors="coerce").dropna()
        if len(s) > 0:
            counts, bin_edges = np.histogram(s, bins=config.bins or 20)
            for i in range(len(counts)):
                range_str = f"{bin_edges[i]:.1f} - {bin_edges[i+1]:.1f}"
                data_points.append({
                    "label": range_str,
                    "bin_start": float(bin_edges[i]),
                    "bin_end": float(bin_edges[i+1]),
                    "count": int(counts[i]),
                    "value": int(counts[i])
                })

        return ChartDataResponse(
            chart_type=c_type,
            title=chart_title,
            data=data_points,
            x_axis_label=x_col,
            y_axis_label="Frequency",
            is_sampled=is_sampled,
            sample_rate=sample_rate
        )

    # 4. Scatter Plot
    elif c_type == "scatter":
        if y_col and y_col in target_df.columns:
            cols = [x_col, y_col]
            if group_col and group_col in target_df.columns:
                cols.append(group_col)
            sub_df = target_df[cols].dropna()
            
            for _, row in sub_df.head(1500).iterrows():
                pt = {
                    "x": float(row[x_col]) if pd.api.types.is_numeric_dtype(target_df[x_col]) else str(row[x_col]),
                    "y": float(row[y_col]) if pd.api.types.is_numeric_dtype(target_df[y_col]) else str(row[y_col]),
                    "label": str(row[group_col]) if group_col and group_col in row else ""
                }
                data_points.append(pt)

        return ChartDataResponse(
            chart_type=c_type,
            title=chart_title,
            data=data_points,
            x_axis_label=x_col,
            y_axis_label=y_col or "",
            is_sampled=is_sampled,
            sample_rate=sample_rate
        )

    # 5. Box / Quartile Plot
    elif c_type in ["box", "violin"]:
        if y_col and y_col in target_df.columns:
            # x is categorical grouping, y is numeric
            num_s = pd.to_numeric(target_df[y_col], errors="coerce")
            top_cats = target_df[x_col].value_counts().head(8).index
            
            for cat in top_cats:
                cat_vals = num_s[target_df[x_col] == cat].dropna()
                if len(cat_vals) > 0:
                    q25 = float(cat_vals.quantile(0.25))
                    med = float(cat_vals.median())
                    q75 = float(cat_vals.quantile(0.75))
                    iqr = q75 - q25
                    min_val = float(max(cat_vals.min(), q25 - 1.5 * iqr))
                    max_val = float(min(cat_vals.max(), q75 + 1.5 * iqr))

                    data_points.append({
                        "label": str(cat),
                        "min": round(min_val, 2),
                        "q25": round(q25, 2),
                        "median": round(med, 2),
                        "q75": round(q75, 2),
                        "max": round(max_val, 2),
                        "count": len(cat_vals)
                    })

        return ChartDataResponse(
            chart_type=c_type,
            title=chart_title,
            data=data_points,
            x_axis_label=x_col,
            y_axis_label=y_col or "Value",
            is_sampled=is_sampled,
            sample_rate=sample_rate
        )

    # 6. Heatmap / Correlation Matrix
    elif c_type == "heatmap":
        num_cols = target_df.select_dtypes(include=[np.number]).columns.tolist()[:10]
        if len(num_cols) >= 2:
            corr_mat = target_df[num_cols].corr()
            for c1 in num_cols:
                for c2 in num_cols:
                    val = corr_mat.loc[c1, c2]
                    data_points.append({
                        "x": c1,
                        "y": c2,
                        "value": round(float(val), 3) if not np.isnan(val) else 0.0
                    })

        return ChartDataResponse(
            chart_type=c_type,
            title="Correlation Matrix Heatmap",
            data=data_points,
            x_axis_label="Variable 1",
            y_axis_label="Variable 2",
            is_sampled=is_sampled,
            sample_rate=sample_rate
        )

    # Fallback
    return ChartDataResponse(
        chart_type=c_type,
        title=chart_title,
        data=[],
        x_axis_label=x_col,
        y_axis_label=y_col or ""
    )

