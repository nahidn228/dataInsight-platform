import os
import uuid
import chardet
import pandas as pd
import numpy as np
from typing import Dict, Optional, Tuple, List, Any
from datetime import datetime
from app.core.config import settings
from app.schemas.dataset import ColumnMeta, DatasetMetadata

class DatasetSession:
    def __init__(self, dataset_id: str, filename: str, original_path: str):
        self.dataset_id = dataset_id
        self.filename = filename
        self.original_path = original_path
        self.cleaned_path: Optional[str] = None
        self.original_df: Optional[pd.DataFrame] = None
        self.active_df: Optional[pd.DataFrame] = None
        self.active_sheet: Optional[str] = None
        self.sheet_names: List[str] = []
        self.created_at = datetime.utcnow()
        self.applied_transformations: List[str] = []

class SessionManager:
    _instance = None
    _sessions: Dict[str, DatasetSession] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SessionManager, cls).__new__(cls)
        return cls._instance

    def create_session(self, filename: str, file_path: str) -> DatasetSession:
        dataset_id = str(uuid.uuid4())
        session = DatasetSession(dataset_id=dataset_id, filename=filename, original_path=file_path)
        self._sessions[dataset_id] = session
        return session

    def get_session(self, dataset_id: str) -> Optional[DatasetSession]:
        return self._sessions.get(dataset_id)

    def delete_session(self, dataset_id: str) -> bool:
        session = self._sessions.pop(dataset_id, None)
        if session:
            try:
                if os.path.exists(session.original_path):
                    os.remove(session.original_path)
                if session.cleaned_path and os.path.exists(session.cleaned_path):
                    os.remove(session.cleaned_path)
            except Exception:
                pass
            return True
        return False

    def list_sessions(self) -> List[Dict[str, Any]]:
        return [
            {
                "dataset_id": s.dataset_id,
                "filename": s.filename,
                "rows": len(s.active_df) if s.active_df is not None else 0,
                "created_at": s.created_at.isoformat()
            }
            for s in self._sessions.values()
        ]

session_manager = SessionManager()

def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

def detect_encoding(file_path: str, max_bytes: int = 50000) -> str:
    with open(file_path, "rb") as f:
        raw_data = f.read(max_bytes)
    result = chardet.detect(raw_data)
    encoding = result.get("encoding")
    return encoding if encoding else "utf-8"

def detect_csv_delimiter(file_path: str, encoding: str = "utf-8") -> str:
    delimiters = [",", ";", "\t", "|"]
    try:
        with open(file_path, "r", encoding=encoding, errors="replace") as f:
            lines = [f.readline() for _ in range(5)]
            sample = "".join(lines)
            
            # Simple frequency scoring
            best_delim = ","
            max_cols = 0
            for d in delimiters:
                avg_cols = sum(len(line.split(d)) for line in lines if line.strip()) / (len(lines) or 1)
                if avg_cols > max_cols:
                    max_cols = avg_cols
                    best_delim = d
            return best_delim
    except Exception:
        return ","

def infer_column_type(series: pd.Series, name: str) -> str:
    non_null = series.dropna()
    total = len(series)
    non_null_count = len(non_null)
    
    if non_null_count == 0:
        return "text"
        
    unique_count = non_null.nunique()
    if unique_count == 1:
        return "constant"

    # Check for ID columns
    name_lower = name.lower()
    if (unique_count == total or unique_count >= 0.95 * total) and (
        "id" in name_lower or "key" in name_lower or "code" in name_lower or "uuid" in name_lower or "hash" in name_lower
    ):
        return "id"

    # Check boolean
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if unique_count <= 2:
        vals = set(non_null.astype(str).str.lower().unique())
        if vals.issubset({"true", "false", "0", "1", "yes", "no", "y", "n"}):
            return "boolean"

    # Check datetime
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
        
    if pd.api.types.is_numeric_dtype(series):
        return "numerical"

    # Attempt datetime parse on sample string
    if non_null_count > 0 and series.dtype == object:
        sample = non_null.head(50)
        # Check if contains date-like patterns
        date_keywords = ["date", "time", "timestamp", "year", "month", "day", "dob", "created", "updated"]
        if any(kw in name_lower for kw in date_keywords):
            try:
                pd.to_datetime(sample, errors="raise")
                return "datetime"
            except Exception:
                pass
                
        # Try numeric parse
        try:
            pd.to_numeric(sample.str.replace(",", "").str.strip(), errors="raise")
            return "numerical"
        except Exception:
            pass

    # Categorical vs Text
    if unique_count <= 50 or (unique_count / max(non_null_count, 1) < 0.2):
        return "categorical"

    return "text"

def load_dataset_file(file_path: str, sheet_name: Optional[str] = None) -> Tuple[pd.DataFrame, List[str], str]:
    ext = os.path.splitext(file_path)[1].lower()
    sheet_names = []
    active_sheet = ""

    if ext in [".xlsx", ".xls"]:
        excel_file = pd.ExcelFile(file_path)
        sheet_names = excel_file.sheet_names
        chosen_sheet = sheet_name if sheet_name in sheet_names else sheet_names[0]
        active_sheet = chosen_sheet
        df = pd.read_excel(file_path, sheet_name=chosen_sheet)
    elif ext == ".csv":
        enc = detect_encoding(file_path)
        delim = detect_csv_delimiter(file_path, encoding=enc)
        try:
            df = pd.read_csv(file_path, encoding=enc, sep=delim, low_memory=False)
        except Exception:
            # Fallback
            df = pd.read_csv(file_path, encoding="latin1", sep=delim, low_memory=False)
    else:
        raise ValueError(f"Unsupported file extension: {ext}")

    # Standardize column headers to strings and clean leading/trailing whitespace
    df.columns = [str(c).strip() for c in df.columns]
    
    # Auto-convert datetime candidates if high accuracy
    for col in df.columns:
        if df[col].dtype == object:
            col_lower = col.lower()
            if any(k in col_lower for k in ["date", "timestamp", "dob", "created_at", "updated_at"]):
                try:
                    df[col] = pd.to_datetime(df[col], errors="ignore")
                except Exception:
                    pass

    return df, sheet_names, active_sheet

def inspect_dataset(df: pd.DataFrame, session: DatasetSession) -> DatasetMetadata:
    total_rows = len(df)
    total_columns = len(df.columns)
    file_size_bytes = os.path.getsize(session.original_path) if os.path.exists(session.original_path) else 0

    columns_meta: List[ColumnMeta] = []
    numerical_cols = []
    categorical_cols = []
    datetime_cols = []
    boolean_cols = []
    text_cols = []
    id_cols = []
    constant_cols = []

    for col in df.columns:
        s = df[col]
        inferred = infer_column_type(s, col)
        null_count = int(s.isna().sum())
        non_null_count = total_rows - null_count
        null_pct = round((null_count / total_rows * 100), 2) if total_rows > 0 else 0.0
        unique_cnt = int(s.nunique())
        is_uniq = (unique_cnt == total_rows and total_rows > 0)
        is_const = (unique_cnt <= 1)

        # Non-null sample values safely serialized
        samples = []
        for val in s.dropna().head(5):
            if pd.isna(val):
                continue
            if isinstance(val, (np.integer, np.int64)):
                samples.append(int(val))
            elif isinstance(val, (np.floating, np.float64)):
                samples.append(float(val))
            elif isinstance(val, (datetime, pd.Timestamp)):
                samples.append(str(val))
            else:
                samples.append(str(val))

        meta = ColumnMeta(
            name=col,
            dtype=str(s.dtype),
            inferred_type=inferred,
            non_null_count=non_null_count,
            null_count=null_count,
            null_percentage=null_pct,
            unique_count=unique_cnt,
            sample_values=samples,
            is_unique=is_uniq,
            is_constant=is_const
        )
        columns_meta.append(meta)

        if inferred == "numerical":
            numerical_cols.append(col)
        elif inferred == "categorical":
            categorical_cols.append(col)
        elif inferred == "datetime":
            datetime_cols.append(col)
        elif inferred == "boolean":
            boolean_cols.append(col)
        elif inferred == "text":
            text_cols.append(col)
        elif inferred == "id":
            id_cols.append(col)
        elif inferred == "constant":
            constant_cols.append(col)

    memory_mb = round(df.memory_usage(deep=True).sum() / (1024 * 1024), 2)

    return DatasetMetadata(
        dataset_id=session.dataset_id,
        filename=session.filename,
        file_size_bytes=file_size_bytes,
        file_size_formatted=format_file_size(file_size_bytes),
        total_rows=total_rows,
        total_columns=total_columns,
        columns=columns_meta,
        numerical_columns=numerical_cols,
        categorical_columns=categorical_cols,
        datetime_columns=datetime_cols,
        boolean_columns=boolean_cols,
        text_columns=text_cols,
        id_columns=id_cols,
        constant_columns=constant_cols,
        sheet_names=session.sheet_names,
        created_at=session.created_at,
        active_sheet=session.active_sheet,
        memory_usage_mb=memory_mb
    )

