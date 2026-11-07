import numpy as np
import pandas as pd
import os

os.makedirs("sample_datasets", exist_ok=True)

# 1. Student Lifestyle and Academic Performance (CMP7227 academic context)
np.random.seed(42)
n_students = 15000
majors = ["Computer Science", "Artificial Intelligence", "Data Science", "Software Engineering", "Cyber Security"]
genders = ["Female", "Male", "Non-Binary"]
student_data = {
    "StudentID": [f"BCU{100000 + i}" for i in range(n_students)],
    "Major": np.random.choice(majors, n_students, p=[0.25, 0.25, 0.2, 0.15, 0.15]),
    "Gender": np.random.choice(genders, n_students, p=[0.45, 0.5, 0.05]),
    "StudyHoursPerWeek": np.clip(np.random.normal(18, 6, n_students), 2, 45).round(1),
    "AttendanceRate": np.clip(np.random.normal(82, 12, n_students), 40, 100).round(1),
    "SleepHoursPerNight": np.clip(np.random.normal(6.8, 1.2, n_students), 4, 10).round(1),
    "ExtraCurricularActivities": np.random.choice(["None", "Sports", "Tech Club", "Arts", "Volunteering"], n_students),
    "ExamScore": np.clip(np.random.normal(68, 14, n_students), 25, 100).round(1)
}
# Inject correlation between StudyHours, Attendance and ExamScore
df_students = pd.DataFrame(student_data)
df_students["ExamScore"] = np.clip(
    30 + (df_students["StudyHoursPerWeek"] * 1.1) + (df_students["AttendanceRate"] * 0.3) + np.random.normal(0, 5, n_students),
    30, 100
).round(1)

# Add missing values & duplicates to demonstrate quality engine
df_students.loc[np.random.choice(n_students, 250, replace=False), "SleepHoursPerNight"] = np.nan
df_students.loc[np.random.choice(n_students, 180, replace=False), "ExtraCurricularActivities"] = np.nan
df_students = pd.concat([df_students, df_students.iloc[:75]], ignore_index=True) # 75 duplicates
df_students.to_csv("sample_datasets/student_performance_lifestyle.csv", index=False)
print("Generated student_performance_lifestyle.csv:", len(df_students), "rows")

# 2. Global E-Commerce & Retail Sales Dataset (100,000+ rows high-volume verification)
n_sales = 105000
categories = ["Electronics", "Fashion", "Home & Garden", "Health & Beauty", "Automotive", "Sports"]
regions = ["Europe", "North America", "Asia Pacific", "Latin America", "Middle East"]
payment_methods = ["Credit Card", "PayPal", "Bank Transfer", "Apple Pay", "Cryptocurrency"]

sales_data = {
    "OrderID": [f"ORD-{2026000000 + i}" for i in range(n_sales)],
    "TransactionDate": pd.date_range(start="2025-01-01", periods=n_sales, freq="5min").strftime("%Y-%m-%d %H:%M"),
    "ProductCategory": np.random.choice(categories, n_sales, p=[0.3, 0.25, 0.18, 0.12, 0.08, 0.07]),
    "Region": np.random.choice(regions, n_sales),
    "UnitPrice": np.random.exponential(scale=65, size=n_sales).round(2) + 5.0,
    "Quantity": np.random.randint(1, 8, size=n_sales),
    "Discount": np.random.choice([0.0, 0.05, 0.1, 0.15, 0.2, 0.3], n_sales, p=[0.4, 0.2, 0.15, 0.1, 0.1, 0.05]),
    "CustomerRating": np.random.choice([1, 2, 3, 4, 5], n_sales, p=[0.05, 0.08, 0.15, 0.42, 0.3]),
    "PaymentMethod": np.random.choice(payment_methods, n_sales)
}
df_sales = pd.DataFrame(sales_data)
df_sales["TotalRevenue"] = ((df_sales["UnitPrice"] * df_sales["Quantity"]) * (1 - df_sales["Discount"])).round(2)
# Save in CSV and sample Excel for verification
df_sales.to_csv("sample_datasets/global_retail_sales_100k.csv", index=False)
print("Generated global_retail_sales_100k.csv:", len(df_sales), "rows")

# Sample Excel file
df_students.head(2000).to_excel("sample_datasets/student_performance_sample.xlsx", index=False, sheet_name="Students_2026")
print("Generated student_performance_sample.xlsx")

