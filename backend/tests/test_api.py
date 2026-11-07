import pytest
import os
import pandas as pd
from fastapi.testclient import TestClient
from app.main import app
from app.services.dataset_service import session_manager, inspect_dataset, load_dataset_file
from app.analysis.statistics_service import compute_overall_statistics, evaluate_data_quality
from app.visualization.chart_builder import recommend_visualizations, build_chart_data
from app.insights.insight_engine import generate_rule_based_insights
from app.schemas.dataset import ChartConfigRequest, CleaningOperation, CleaningRequest

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_csv_upload_and_pipeline():
    test_csv_path = "sample_datasets/student_performance_lifestyle.csv"
    assert os.path.exists(test_csv_path)

    with open(test_csv_path, "rb") as f:
        response = client.post("/api/datasets/upload", files={"file": ("student_data.csv", f, "text/csv")})
    
    assert response.status_code == 200
    meta = response.json()
    dataset_id = meta["dataset_id"]
    assert dataset_id is not None
    assert meta["total_rows"] == 15075
    assert "StudyHoursPerWeek" in meta["numerical_columns"]
    assert "Major" in meta["categorical_columns"]

    # Test preview
    res_prev = client.get(f"/api/datasets/{dataset_id}/preview?page=1&page_size=10")
    assert res_prev.status_code == 200
    assert len(res_prev.json()["rows"]) == 10

    # Test statistics
    res_stats = client.get(f"/api/datasets/{dataset_id}/statistics")
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["total_records"] == 15075
    assert "StudyHoursPerWeek" in stats["numerical_stats"]
    assert stats["numerical_stats"]["StudyHoursPerWeek"]["mean"] > 10

    # Test quality
    res_qual = client.get(f"/api/datasets/{dataset_id}/quality")
    assert res_qual.status_code == 200
    qual = res_qual.json()
    assert qual["duplicate_rows"] == 75
    assert qual["overall_health_score"] > 80

    # Test recommendations
    res_recs = client.get(f"/api/datasets/{dataset_id}/charts/recommendations")
    assert res_recs.status_code == 200
    recs = res_recs.json()
    assert len(recs) > 0

    # Test chart generation
    chart_cfg = {
        "chart_type": "bar",
        "x_column": "Major",
        "y_column": "ExamScore",
        "aggregation": "mean"
    }
    res_chart = client.post(f"/api/datasets/{dataset_id}/charts/generate", json=chart_cfg)
    assert res_chart.status_code == 200
    chart_data = res_chart.json()
    assert len(chart_data["data"]) > 0

    # Test cleaning operations
    clean_payload = {
        "operations": [
            {"operation": "drop_duplicates"}
        ]
    }
    res_clean = client.post(f"/api/datasets/{dataset_id}/clean", json=clean_payload)
    assert res_clean.status_code == 200
    clean_res = res_clean.json()
    assert clean_res["rows_after"] == 15000

    # Test insights
    res_insights = client.get(f"/api/datasets/{dataset_id}/insights")
    assert res_insights.status_code == 200
    insights = res_insights.json()
    assert len(insights) > 0

def test_large_dataset_performance():
    test_100k = "sample_datasets/global_retail_sales_100k.csv"
    assert os.path.exists(test_100k)

    with open(test_100k, "rb") as f:
        res = client.post("/api/datasets/upload", files={"file": ("retail_100k.csv", f, "text/csv")})
    assert res.status_code == 200
    data = res.json()
    assert data["total_rows"] == 105000
    assert "TotalRevenue" in data["numerical_columns"]

def test_excel_upload():
    test_excel = "sample_datasets/student_performance_sample.xlsx"
    assert os.path.exists(test_excel)

    with open(test_excel, "rb") as f:
        res = client.post("/api/datasets/upload", files={"file": ("students.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    assert res.status_code == 200
    data = res.json()
    assert data["total_rows"] == 2000
    assert "Students_2026" in data["sheet_names"]

