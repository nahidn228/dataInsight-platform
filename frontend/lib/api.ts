import axios from "axios";
import {
  DatasetMetadata,
  DatasetPreview,
  OverallStatistics,
  DataQualityReport,
  ChartRecommendation,
  ChartDataResponse,
  AnalyticalInsight,
  FilterCondition,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

export const DatasetApi = {
  uploadDataset: async (file: File): Promise<DatasetMetadata> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<DatasetMetadata>("/datasets/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  getMetadata: async (datasetId: string): Promise<DatasetMetadata> => {
    const res = await api.get<DatasetMetadata>(`/datasets/${datasetId}/metadata`);
    return res.data;
  },

  getPreview: async (
    datasetId: string,
    page: number = 1,
    pageSize: number = 50,
    sortColumn?: string,
    sortAscending: boolean = true,
    searchQuery?: string
  ): Promise<DatasetPreview> => {
    const params: Record<string, any> = { page, page_size: pageSize, sort_ascending: sortAscending };
    if (sortColumn) params.sort_column = sortColumn;
    if (searchQuery) params.search_query = searchQuery;
    const res = await api.get<DatasetPreview>(`/datasets/${datasetId}/preview`, { params });
    return res.data;
  },

  getStatistics: async (datasetId: string): Promise<OverallStatistics> => {
    const res = await api.get<OverallStatistics>(`/datasets/${datasetId}/statistics`);
    return res.data;
  },

  getDataQuality: async (datasetId: string): Promise<DataQualityReport> => {
    const res = await api.get<DataQualityReport>(`/datasets/${datasetId}/quality`);
    return res.data;
  },

  getChartRecommendations: async (datasetId: string): Promise<ChartRecommendation[]> => {
    const res = await api.get<ChartRecommendation[]>(`/datasets/${datasetId}/charts/recommendations`);
    return res.data;
  },

  generateChart: async (
    datasetId: string,
    config: {
      chart_type: string;
      x_column: string;
      y_column?: string;
      group_by?: string;
      aggregation?: string;
      sort_by?: string;
      limit?: number;
      filters?: FilterCondition[];
    }
  ): Promise<ChartDataResponse> => {
    const res = await api.post<ChartDataResponse>(`/datasets/${datasetId}/charts/generate`, config);
    return res.data;
  },

  getInsights: async (datasetId: string): Promise<AnalyticalInsight[]> => {
    const res = await api.get<AnalyticalInsight[]>(`/datasets/${datasetId}/insights`);
    return res.data;
  },

  cleanDataset: async (datasetId: string, operations: any[]): Promise<any> => {
    const res = await api.post(`/datasets/${datasetId}/clean`, { operations });
    return res.data;
  },

  resetDataset: async (datasetId: string): Promise<any> => {
    const res = await api.post(`/datasets/${datasetId}/reset`);
    return res.data;
  },

  getExportUrl: (datasetId: string, format: "csv" | "xlsx" | "pdf"): string => {
    return `${API_BASE}/datasets/${datasetId}/export?format=${format}`;
  },
};
