from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class ColumnMeta(BaseModel):
    name: str
    dtype: str
    inferred_type: str  # 'numerical', 'categorical', 'datetime', 'boolean', 'text', 'id', 'constant'
    non_null_count: int
    null_count: int
    null_percentage: float
    unique_count: int
    sample_values: List[Any] = []
    is_unique: bool = False
    is_constant: bool = False

class DatasetMetadata(BaseModel):
    dataset_id: str
    filename: str
    file_size_bytes: int
    file_size_formatted: str
    total_rows: int
    total_columns: int
    columns: List[ColumnMeta]
    numerical_columns: List[str]
    categorical_columns: List[str]
    datetime_columns: List[str]
    boolean_columns: List[str]
    text_columns: List[str]
    id_columns: List[str]
    constant_columns: List[str]
    sheet_names: Optional[List[str]] = None
    created_at: datetime
    active_sheet: Optional[str] = None
    memory_usage_mb: float

class DatasetPreview(BaseModel):
    dataset_id: str
    total_rows: int
    page: int
    page_size: int
    total_pages: int
    columns: List[str]
    rows: List[Dict[str, Any]]

class NumericalStats(BaseModel):
    column: str
    count: int
    mean: Optional[float] = None
    std: Optional[float] = None
    variance: Optional[float] = None
    min: Optional[float] = None
    q25: Optional[float] = None
    median: Optional[float] = None
    q75: Optional[float] = None
    max: Optional[float] = None
    iqr: Optional[float] = None
    skewness: Optional[float] = None
    kurtosis: Optional[float] = None
    outliers_count: int = 0
    zeros_count: int = 0

class CategoryFrequency(BaseModel):
    value: str
    count: int
    percentage: float

class CategoricalStats(BaseModel):
    column: str
    count: int
    unique_count: int
    top_value: Optional[str] = None
    top_frequency: Optional[int] = None
    least_value: Optional[str] = None
    least_frequency: Optional[int] = None
    frequencies: List[CategoryFrequency] = []

class CorrelationEntry(BaseModel):
    var1: str
    var2: str
    pearson: Optional[float] = None
    spearman: Optional[float] = None

class OverallStatistics(BaseModel):
    total_records: int
    total_columns: int
    numerical_count: int
    categorical_count: int
    datetime_count: int
    total_missing_cells: int
    missing_percentage: float
    duplicate_rows_count: int
    duplicate_percentage: float
    completeness_percentage: float
    numerical_stats: Dict[str, NumericalStats]
    categorical_stats: Dict[str, CategoricalStats]
    correlations: List[CorrelationEntry]

class DataQualityMetric(BaseModel):
    column: str
    inferred_type: str
    completeness: float
    missing_count: int
    distinct_count: int
    outlier_count: int = 0
    duplicate_values: int = 0
    data_health_score: float  # 0 to 100

class DataQualityReport(BaseModel):
    dataset_id: str
    overall_health_score: float
    total_cells: int
    total_missing: int
    missing_cells_percentage: float
    duplicate_rows: int
    duplicate_rows_percentage: float
    columns_quality: List[DataQualityMetric]
    recommendations: List[str]

class FilterCondition(BaseModel):
    column: str
    operator: str  # 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'between', 'contains'
    value: Any
    value2: Optional[Any] = None

class FilterRequest(BaseModel):
    filters: List[FilterCondition] = []
    page: int = 1
    page_size: int = 50
    sort_column: Optional[str] = None
    sort_ascending: bool = True
    search_query: Optional[str] = None

class ChartRecommendation(BaseModel):
    chart_id: str
    chart_type: str  # 'bar', 'horizontal_bar', 'line', 'scatter', 'box', 'violin', 'histogram', 'donut', 'pie', 'heatmap', 'area', 'treemap'
    title: str
    reason: str
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    group_by: Optional[str] = None
    aggregation: Optional[str] = None  # 'count', 'sum', 'mean', 'median', 'min', 'max'
    category_limit: int = 15
    sort_order: Optional[str] = "desc"  # 'asc', 'desc', 'natural'

class ChartConfigRequest(BaseModel):
    chart_type: str
    title: Optional[str] = None
    x_column: str
    y_column: Optional[str] = None
    group_by: Optional[str] = None
    aggregation: Optional[str] = "count"
    color_column: Optional[str] = None
    bins: Optional[int] = 30
    sort_by: Optional[str] = "desc"
    limit: Optional[int] = 20
    filters: Optional[List[FilterCondition]] = None

class ChartDataResponse(BaseModel):
    chart_type: str
    title: str
    data: List[Dict[str, Any]]
    x_axis_label: str
    y_axis_label: str
    metadata: Dict[str, Any] = {}
    is_sampled: bool = False
    sample_rate: float = 1.0

class AnalyticalInsight(BaseModel):
    id: str
    type: str  # 'trend', 'anomaly', 'distribution', 'correlation', 'comparison', 'quality'
    importance: str  # 'high', 'medium', 'info'
    title: str
    description: str
    metric_name: str
    metric_value: str
    supporting_columns: List[str]
    suggested_chart_type: Optional[str] = None
    evidence_stats: Dict[str, Any] = {}

class CleaningOperation(BaseModel):
    operation: str  # 'drop_duplicates', 'fill_missing_mean', 'fill_missing_median', 'fill_missing_mode', 'fill_missing_constant', 'drop_missing_rows', 'drop_column', 'strip_whitespace', 'remove_outliers_iqr'
    column: Optional[str] = None
    constant_value: Optional[Any] = None
    threshold: Optional[float] = None

class CleaningRequest(BaseModel):
    operations: List[CleaningOperation]

class CleanResponse(BaseModel):
    success: bool
    message: str
    applied_operations: List[str]
    rows_before: int
    rows_after: int
    columns_before: int
    columns_after: int
    dataset_id: str

