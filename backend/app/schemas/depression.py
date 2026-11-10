from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class FactorPrevalenceItem(BaseModel):
    name: str
    rate: float
    count: int
    total: int

class FactorPrevalenceChart(BaseModel):
    factor_column: str
    title: str
    subtitle: str
    chart_type: str  # 'bar', 'horizontal_bar', 'line', 'pie', 'table'
    primary_color: str
    data: List[FactorPrevalenceItem]

class LifestyleGapItem(BaseModel):
    metric: str
    gap: float
    dep_mean: float
    non_dep_mean: float

class LifestyleGapsChart(BaseModel):
    title: str
    subtitle: str
    data: List[LifestyleGapItem]

class DepressionKpis(BaseModel):
    total_students: int
    depressed_count: int
    non_depressed_count: int
    depression_rate: float
    avg_social_media: Optional[float] = None
    avg_sleep: Optional[float] = None
    avg_stress: Optional[float] = None
    avg_activity: Optional[float] = None
    avg_cgpa: Optional[float] = None
    avg_age: Optional[float] = None

class SlicerOption(BaseModel):
    column: str
    label: str
    type: str  # 'select' | 'range'
    options: List[str] = []
    min: Optional[float] = None
    max: Optional[float] = None

class DepressionAnalysisResponse(BaseModel):
    has_depression_data: bool
    target_column: Optional[str] = None
    kpis: DepressionKpis
    available_factors: List[str]
    detected_columns_map: Dict[str, str]
    slicers: List[SlicerOption]
    charts: List[FactorPrevalenceChart]
    lifestyle_gaps: Optional[LifestyleGapsChart] = None
    key_findings: List[str]
