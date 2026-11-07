import io
import pandas as pd
from typing import List, Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from app.schemas.dataset import DatasetMetadata, OverallStatistics, AnalyticalInsight, DataQualityReport

def generate_pdf_report(
    metadata: DatasetMetadata,
    stats: OverallStatistics,
    quality: DataQualityReport,
    insights: List[AnalyticalInsight]
) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#0f172a'),
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=15
    )
    h2_style = ParagraphStyle(
        'Heading2Custom',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=14,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    )
    body_style = ParagraphStyle(
        'BodyCustom',
        parent=styles['Normal'],
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    callout_style = ParagraphStyle(
        'Callout',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0369a1'),
        backColor=colors.HexColor('#f0f9ff'),
        borderColor=colors.HexColor('#bae6fd'),
        borderWidth=1,
        borderPadding=6,
        spaceBefore=6,
        spaceAfter=6
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("DataInsight Analytical Report", title_style))
    story.append(Paragraph(f"Dataset: <b>{metadata.filename}</b> | Module: CMP7227 Data Visualisation | Assessment 2026/2027", subtitle_style))
    story.append(Spacer(1, 10))

    # Executive Summary Table
    story.append(Paragraph("1. Dataset Architecture & Health Overview", h2_style))
    summary_data = [
        ["Total Records", f"{metadata.total_rows:,}", "Total Attributes", f"{metadata.total_columns}"],
        ["Numerical Fields", f"{len(metadata.numerical_columns)}", "Categorical Fields", f"{len(metadata.categorical_columns)}"],
        ["Completeness Score", f"{stats.completeness_percentage}%", "Duplicate Rows", f"{stats.duplicate_rows_count:,} ({stats.duplicate_percentage}%)"],
        ["Data Health Index", f"{quality.overall_health_score}/100", "Memory Footprint", f"{metadata.memory_usage_mb} MB"]
    ]
    t1 = Table(summary_data, colWidths=[130, 130, 130, 130])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0f172a')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]))
    story.append(t1)
    story.append(Spacer(1, 12))

    # Data Quality & Cleaning Recommendations
    story.append(Paragraph("2. Data Quality & Pre-processing Assessment", h2_style))
    for rec in quality.recommendations[:4]:
        story.append(Paragraph(f"• {rec}", body_style))
    story.append(Spacer(1, 10))

    # Descriptive Statistics Sample
    story.append(Paragraph("3. Parametric & Distributional Metrics", h2_style))
    stat_rows = [["Metric / Column", "Mean", "Std Dev", "Min", "Median", "Max", "Skewness", "Outliers"]]
    for col, ns in list(stats.numerical_stats.items())[:6]:
        stat_rows.append([
            col[:18],
            str(ns.mean) if ns.mean is not None else "-",
            str(ns.std) if ns.std is not None else "-",
            str(ns.min) if ns.min is not None else "-",
            str(ns.median) if ns.median is not None else "-",
            str(ns.max) if ns.max is not None else "-",
            str(ns.skewness) if ns.skewness is not None else "-",
            str(ns.outliers_count)
        ])
    
    if len(stat_rows) > 1:
        t_stat = Table(stat_rows, colWidths=[105, 58, 58, 55, 58, 58, 62, 58])
        t_stat.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0284c7')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(t_stat)
    else:
        story.append(Paragraph("No numerical variables available for parametric statistics.", body_style))

    story.append(Spacer(1, 12))

    # Rule-Based Analytical Insights
    story.append(Paragraph("4. Evidence-Based Analytical Discoveries", h2_style))
    for idx, insight in enumerate(insights[:5], 1):
        story.append(Paragraph(f"<b>4.{idx} {insight.title}</b> ({insight.metric_name}: <i>{insight.metric_value}</i>)", ParagraphStyle('InsightH', parent=body_style, fontName='Helvetica-Bold', textColor=colors.HexColor('#0369a1'))))
        story.append(Paragraph(insight.description, body_style))
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 12))

    # Analytical Limitations & Conclusion
    story.append(Paragraph("5. Methodological Scope & Academic Limitations", h2_style))
    limitations_text = (
        "This dynamic analytical summary is calculated algorithmically directly on raw data tables. "
        "Any linear correlations presented (e.g., Pearson coefficients) describe mathematical associations only "
        "and must not be interpreted as causal relationships without domain-specific causal inference. "
        "High-dimensional non-linear patterns or multi-collinear structures should be evaluated via multivariate "
        "machine learning models within the DataInsight platform."
    )
    story.append(Paragraph(limitations_text, callout_style))
    story.append(Spacer(1, 15))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()

