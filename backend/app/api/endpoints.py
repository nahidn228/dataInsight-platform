import os
import shutil
import uuid
import numpy as np
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
import io
from typing import List, Optional
from app.core.config import settings
from app.schemas.dataset import (
    DatasetMetadata,
    DatasetPreview,
    OverallStatistics,
    DataQualityReport,
    ChartRecommendation,
    ChartConfigRequest,
    ChartDataResponse,
    FilterRequest,
    AnalyticalInsight,
    CleaningRequest,
    CleanResponse
)
from app.services.dataset_service import (
    session_manager,
    load_dataset_file,
    inspect_dataset
)
from app.analysis.statistics_service import (
    compute_overall_statistics,
    evaluate_data_quality
)
from app.processing.cleaner_service import apply_cleaning_operations
from app.visualization.chart_builder import (
    recommend_visualizations,
    build_chart_data,
    apply_dataframe_filters
)
from app.insights.insight_engine import generate_rule_based_insights
from app.services.export_service import generate_pdf_report

router = APIRouter(prefix="/datasets", tags=["datasets"])

@router.post("/upload", response_model=DatasetMetadata)
async def upload_dataset(file: UploadFile = File(...)):
    filename = file.filename or "uploaded_dataset"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file format '{ext}'. Allowed: .csv, .xlsx, .xls")

    temp_id = str(uuid.uuid4())
    safe_filename = f"{temp_id}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save upload: {str(e)}")

    try:
        df, sheet_names, active_sheet = load_dataset_file(file_path)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=422, detail=f"Failed to parse dataset: {str(e)}")

    session = session_manager.create_session(filename=filename, file_path=file_path)
    session.original_df = df
    session.active_df = df.copy()
    session.sheet_names = sheet_names
    session.active_sheet = active_sheet

    metadata = inspect_dataset(session.active_df, session)
    return metadata

@router.get("/{dataset_id}/metadata", response_model=DatasetMetadata)
def get_metadata(dataset_id: str):
    session = session_manager.get_session(dataset_id)
    if not session or session.active_df is None:
        raise HTTPException(status_code=404, detail="Dataset not found or session expired")
    return inspect_dataset(session.active_df, session)

@router.get("/{dataset_id}/preview", response_model=DatasetPreview)
def get_preview(
    dataset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
    sort_column: str = Query(None),
    sort_ascending: bool = Query(True),
    search_query: str = Query(None)
):
    session = session_manager.get_session(dataset_id)
    if not session or session.active_df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    df = session.active_df

    # Global search filter across preview rows if specified
    if search_query:
        mask = df.astype(str).apply(lambda row: row.str.contains(search_query, case=False).any(), axis=1)
        df = df[mask]

    # Sorting
    if sort_column and sort_column in df.columns:
        df = df.sort_values(by=sort_column, ascending=sort_ascending)

    total_rows = len(df)
    total_pages = max(1, (total_rows + page_size - 1) // page_size)
    start_idx = (page - 1) * page_size
    end_idx = min(start_idx + page_size, total_rows)

    subset = df.iloc[start_idx:end_idx]
    
    # Safe JSON serialization
    serialized_rows = []
    for _, row in subset.iterrows():
        clean_row = {}
        for col in df.columns:
            val = row[col]
            if pd.isna(val):
                clean_row[col] = None
            elif isinstance(val, (pd.Timestamp, pd.Period)):
                clean_row[col] = str(val)
            elif isinstance(val, (float, np.floating)):
                clean_row[col] = round(float(val), 4)
            else:
                clean_row[col] = val
        serialized_rows.append(clean_row)

    return DatasetPreview(
        dataset_id=dataset_id,
        total_rows=total_rows,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        columns=list(df.columns),
        rows=serialized_rows
    )

@router.get("/{dataset_id}/statistics", response_model=OverallStatistics)
def get_statistics(dataset_id: str):
    session = session_manager.get_session(dataset_id)
    if not session or session.active_df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    meta = inspect_dataset(session.active_df, session)
    return compute_overall_statistics(
        session.active_df,
        numerical_cols=meta.numerical_columns,
        categorical_cols=meta.categorical_columns
    )

@router.get("/{dataset_id}/quality", response_model=DataQualityReport)
def get_data_quality(dataset_id: str):
    session = session_manager.get_session(dataset_id)
    if not session or session.active_df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    meta = inspect_dataset(session.active_df, session)
    return evaluate_data_quality(
        session.active_df,
        numerical_cols=meta.numerical_columns,
        categorical_cols=meta.categorical_columns,
        dataset_id=dataset_id
    )

@router.get("/{dataset_id}/charts/recommendations", response_model=List[ChartRecommendation])
def get_chart_recommendations(dataset_id: str):
    session = session_manager.get_session(dataset_id)
    if not session or session.active_df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    meta = inspect_dataset(session.active_df, session)
    return recommend_visualizations(
        session.active_df,
        numerical_cols=meta.numerical_columns,
        categorical_cols=meta.categorical_columns,
        datetime_cols=meta.datetime_columns
    )

@router.post("/{dataset_id}/charts/generate", response_model=ChartDataResponse)
def generate_custom_chart(dataset_id: str, config: ChartConfigRequest):
    session = session_manager.get_session(dataset_id)
    if not session or session.active_df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if config.x_column not in session.active_df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{config.x_column}' does not exist in dataset")

    return build_chart_data(session.active_df, config)

@router.get("/{dataset_id}/insights", response_model=List[AnalyticalInsight])
def get_insights(dataset_id: str):
    session = session_manager.get_session(dataset_id)
    if not session or session.active_df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    meta = inspect_dataset(session.active_df, session)
    return generate_rule_based_insights(
        session.active_df,
        numerical_cols=meta.numerical_columns,
        categorical_cols=meta.categorical_columns,
        datetime_cols=meta.datetime_columns
    )

@router.post("/{dataset_id}/clean", response_model=CleanResponse)
def clean_dataset(dataset_id: str, request: CleaningRequest):
    session = session_manager.get_session(dataset_id)
    if not session or session.active_df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    rows_before = len(session.active_df)
    cols_before = len(session.active_df.columns)

    cleaned_df, logs = apply_cleaning_operations(session.active_df, request.operations)
    session.active_df = cleaned_df
    session.applied_transformations.extend(logs)

    return CleanResponse(
        success=True,
        message=f"Successfully executed {len(request.operations)} cleaning operations",
        applied_operations=logs,
        rows_before=rows_before,
        rows_after=len(cleaned_df),
        columns_before=cols_before,
        columns_after=len(cleaned_df.columns),
        dataset_id=dataset_id
    )

@router.post("/{dataset_id}/reset")
def reset_to_original(dataset_id: str):
    session = session_manager.get_session(dataset_id)
    if not session or session.original_df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    session.active_df = session.original_df.copy()
    session.applied_transformations = []
    return {"message": "Dataset successfully reset to original state", "total_rows": len(session.active_df)}

@router.post("/{dataset_id}/export")
def export_dataset(dataset_id: str, format: str = Query("csv", regex="^(csv|xlsx|pdf)$")):
    session = session_manager.get_session(dataset_id)
    if not session or session.active_df is None:
        raise HTTPException(status_code=404, detail="Dataset not found")

    base_name = os.path.splitext(session.filename)[0]

    if format == "csv":
        stream = io.StringIO()
        session.active_df.to_csv(stream, index=False)
        response = StreamingResponse(
            iter([stream.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=DataInsight_{base_name}_cleaned.csv"}
        )
        return response

    elif format == "xlsx":
        buffer = io.BytesIO()
        with pd.ExcelWriter(buffer, engine="openpyxl") as writer:
            session.active_df.to_excel(writer, index=False, sheet_name="DataInsight_Cleaned")
        buffer.seek(0)
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=DataInsight_{base_name}_cleaned.xlsx"}
        )

    elif format == "pdf":
        meta = inspect_dataset(session.active_df, session)
        stats = compute_overall_statistics(session.active_df, meta.numerical_columns, meta.categorical_columns)
        quality = evaluate_data_quality(session.active_df, meta.numerical_columns, meta.categorical_columns, dataset_id)
        insights = generate_rule_based_insights(session.active_df, meta.numerical_columns, meta.categorical_columns, meta.datetime_columns)

        pdf_bytes = generate_pdf_report(meta, stats, quality, insights)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=DataInsight_Report_{base_name}.pdf"}
        )
