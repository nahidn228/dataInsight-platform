from pydantic import BaseModel
from typing import List, Any, Optional
from app.schemas.dataset import FilterCondition

class DynamicAnalysisConfig(BaseModel):
    target_column: Optional[str] = None
    positive_values: Optional[List[Any]] = None
    filter_columns: Optional[List[str]] = None
    analysis_columns: Optional[List[str]] = None
    filters: Optional[List[FilterCondition]] = None
