export interface ColumnMeta {
  name: string;
  dtype: string;
  inferred_type: "numerical" | "categorical" | "datetime" | "boolean" | "text" | "id" | "constant";
  non_null_count: number;
  null_count: number;
  null_percentage: number;
  unique_count: number;
  sample_values: any[];
  is_unique: boolean;
  is_constant: boolean;
}

export interface DatasetMetadata {
  dataset_id: string;
  filename: string;
  file_size_bytes: number;
  file_size_formatted: string;
  total_rows: number;
  total_columns: number;
  columns: ColumnMeta[];
  numerical_columns: string[];
  categorical_columns: string[];
  datetime_columns: string[];
  boolean_columns: string[];
  text_columns: string[];
  id_columns: string[];
  constant_columns: string[];
  sheet_names?: string[];
  created_at: string;
  active_sheet?: string;
  memory_usage_mb: number;
}

export interface DatasetPreview {
  dataset_id: string;
  total_rows: number;
  page: number;
  page_size: number;
  total_pages: number;
  columns: string[];
  rows: Record<string, any>[];
}

export interface NumericalStats {
  column: string;
  count: number;
  mean: number | null;
  std: number | null;
  variance: number | null;
  min: number | null;
  q25: number | null;
  median: number | null;
  q75: number | null;
  max: number | null;
  iqr: number | null;
  skewness: number | null;
  kurtosis: number | null;
  outliers_count: number;
  zeros_count: number;
}

export interface CategoryFrequency {
  value: string;
  count: number;
  percentage: number;
}

export interface CategoricalStats {
  column: string;
  count: number;
  unique_count: number;
  top_value: string | null;
  top_frequency: number | null;
  least_value: string | null;
  least_frequency: number | null;
  frequencies: CategoryFrequency[];
}

export interface CorrelationEntry {
  var1: string;
  var2: string;
  pearson: number | null;
  spearman: number | null;
}

export interface OverallStatistics {
  total_records: number;
  total_columns: number;
  numerical_count: number;
  categorical_count: number;
  datetime_count: number;
  total_missing_cells: number;
  missing_percentage: number;
  duplicate_rows_count: number;
  duplicate_percentage: number;
  completeness_percentage: number;
  numerical_stats: Record<string, NumericalStats>;
  categorical_stats: Record<string, CategoricalStats>;
  correlations: CorrelationEntry[];
}

export interface DataQualityMetric {
  column: string;
  inferred_type: string;
  completeness: number;
  missing_count: number;
  distinct_count: number;
  outlier_count: number;
  duplicate_values: number;
  data_health_score: number;
}

export interface DataQualityReport {
  dataset_id: string;
  overall_health_score: number;
  total_cells: number;
  total_missing: number;
  missing_cells_percentage: number;
  duplicate_rows: number;
  duplicate_rows_percentage: number;
  columns_quality: DataQualityMetric[];
  recommendations: string[];
}

export interface ChartRecommendation {
  chart_id: string;
  chart_type: string;
  title: string;
  reason: string;
  x_column?: string;
  y_column?: string;
  group_by?: string;
  aggregation?: string;
  category_limit: number;
  sort_order?: string;
}

export interface ChartDataResponse {
  chart_type: string;
  title: string;
  data: any[];
  x_axis_label: string;
  y_axis_label: string;
  metadata?: Record<string, any>;
  is_sampled: boolean;
  sample_rate: number;
}

export interface AnalyticalInsight {
  id: string;
  type: string;
  importance: "high" | "medium" | "info";
  title: string;
  description: string;
  metric_name: string;
  metric_value: string;
  supporting_columns: string[];
  suggested_chart_type?: string;
  evidence_stats: Record<string, any>;
}

export interface FilterCondition {
  column: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "between" | "contains";
  value: any;
  value2?: any;
}
