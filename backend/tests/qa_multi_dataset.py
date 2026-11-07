import requests
import json

def test_dataset(file_path):
    print("=" * 60)
    print(f"TESTING DATASET: {file_path}")
    print("=" * 60)
    with open(file_path, "rb") as f:
        r = requests.post("http://127.0.0.1:8000/api/datasets/upload", files={"file": f})
    assert r.status_code == 200, f"Upload failed: {r.text}"
    meta = r.json()
    did = meta["dataset_id"]
    print(f"Ingested ID: {did}")
    print(f"Filename: {meta['filename']}")
    print(f"Total Rows: {meta['total_rows']:,} | Total Columns: {meta['total_columns']}")
    print(f"Numerical Columns ({len(meta['numerical_columns'])}): {meta['numerical_columns']}")
    print(f"Categorical Columns ({len(meta['categorical_columns'])}): {meta['categorical_columns']}")
    print(f"Boolean Columns ({len(meta['boolean_columns'])}): {meta['boolean_columns']}")
    print(f"ID Columns ({len(meta['id_columns'])}): {meta['id_columns']}")

    # Statistics
    r_stats = requests.get(f"http://127.0.0.1:8000/api/datasets/{did}/statistics")
    assert r_stats.status_code == 200
    st = r_stats.json()
    print(f"Completeness: {st['completeness_percentage']}% | Missing Cells: {st['total_missing_cells']:,} | Duplicates: {st['duplicate_rows_count']:,}")
    print(f"Correlation pairs calculated: {len(st['correlations'])}")

    # Quality Report
    r_qual = requests.get(f"http://127.0.0.1:8000/api/datasets/{did}/quality")
    assert r_qual.status_code == 200
    print(f"Data Health Index: {r_qual.json()['overall_health_score']}/100")

    # Chart Recommendations
    r_recs = requests.get(f"http://127.0.0.1:8000/api/datasets/{did}/charts/recommendations")
    assert r_recs.status_code == 200
    recs = r_recs.json()
    print(f"Chart Recommendations count: {len(recs)}")

    for rec in recs:
        c_req = {
            "chart_type": rec["chart_type"],
            "x_column": rec["x_column"],
            "y_column": rec.get("y_column"),
            "aggregation": rec.get("aggregation", "count"),
            "group_by": rec.get("group_by")
        }
        r_c = requests.post(f"http://127.0.0.1:8000/api/datasets/{did}/charts/generate", json=c_req)
        assert r_c.status_code == 200, f"Chart generation failed for {rec}: {r_c.text}"
        c_data = r_c.json()
        print(f"  ✓ [{rec['chart_type']}] '{c_data['title']}': {len(c_data['data'])} data points generated (Sampled: {c_data['is_sampled']})")

    # Insights
    r_ins = requests.get(f"http://127.0.0.1:8000/api/datasets/{did}/insights")
    assert r_ins.status_code == 200
    insights = r_ins.json()
    print(f"Evidence-based Insights count: {len(insights)}")
    for ins in insights:
        print(f"  • [{ins['type'].upper()}] {ins['title']} -> {ins['metric_name']}: {ins['metric_value']}")

    # PDF & CSV Export
    r_pdf = requests.get(f"http://127.0.0.1:8000/api/datasets/{did}/export?format=pdf")
    assert r_pdf.status_code == 200
    print(f"  ✓ PDF Export generated successfully ({len(r_pdf.content):,} bytes)")

    r_csv = requests.get(f"http://127.0.0.1:8000/api/datasets/{did}/export?format=csv")
    assert r_csv.status_code == 200
    print(f"  ✓ CSV Export generated successfully ({len(r_csv.content):,} bytes)")

    return did

if __name__ == "__main__":
    # Test 1: User's Actual 100k Student Lifestyle Dataset
    did_student = test_dataset("backend/sample_datasets/actual_student_lifestyle_100k.csv")
    
    # Test 2: Completely different domain: Telco Customer Churn
    did_telco = test_dataset("backend/sample_datasets/telco_churn.csv")
    
    # Verify separation of sessions
    assert did_student != did_telco
    print("\nALL MULTI-DATASET ACCEPTANCE CHECKS PASSED PERFECTLY!")

