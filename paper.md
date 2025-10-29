---
title: "Automated Statistical and Machine Learning Platform for Chemical Biology Research"
tags:
  - JavaScript
  - TypeScript
  - machine learning
  - statistical analysis
  - chemical informatics
  - data visualization
  - random forest
  - React
authors:
  - name: Rimmo Loyi Lego
    orcid: 0000-0002-1204-9325
    affiliation: "1, 2"
    email: rloyileg@stevens.edu
  - name: Denver Jn. Baptiste
    orcid: 0009-0006-5158-2532
    affiliation: "1, 2"
    email: djnbapti@stevens.edu
  - name: Samantha Gauthier
    orcid: 0009-0001-5817-2345
    affiliation: "3"
    email: sgauthie1@stevens.edu
affiliations:
  - name: Department of Biomedical Engineering, Charles V. Schaefer, Jr. School of Engineering and Science, Stevens Institute of Technology, Hoboken, NJ 07030, USA
    index: 1
  - name: Department of Chemistry and Chemical Biology, Charles V. Schaefer, Jr. School of Engineering and Science, Stevens Institute of Technology, Hoboken, NJ 07030, USA
    index: 2
  - name: Department of Computer Science, Charles V. Schaefer, Jr. School of Engineering and Science, Stevens Institute of Technology, Hoboken, NJ 07030, USA
    index: 3
date: October 22, 2025
bibliography: bibliography.bib    
csl: apa.csl                     
nocite: '@*'                    
---

# Summary

This software provides a browser-based platform combining machine learning and statistical analysis for chemical biology research. Researchers can upload CSV data, train Random Forest classification models with automated hyperparameter tuning, and perform statistical tests (t-tests, ANOVA, correlation analysis) through a unified interface requiring no programming or installation. The platform addresses the common workflow challenge of using multiple disconnected tools by integrating data preprocessing, model training, feature importance analysis, and interactive visualization in a single web application. Built with React and TypeScript, it runs entirely in the browser while handling typical research datasets efficiently. This accessibility enables experimental scientists to apply computational methods without extensive technical training.

# Statement of Need

Chemical and biomedical researchers routinely need to apply machine learning and statistics to experimental data, but existing tools create significant barriers. Powerful frameworks like scikit-learn [@Pedregosa2011] and R [@RCoreTeam2023] require programming expertise that many experimental scientists lack. Tools operate in isolation—researchers must manually transfer data between separate programs for statistical testing, machine learning, and visualization, reducing efficiency and introducing errors [@Baker2016].

This software addresses these gaps by providing a zero-installation web application that combines Random Forest classification [@Breiman2001] with standard statistical tests (t-tests, ANOVA, correlation) in one interface. Unlike desktop software or Jupyter notebooks [@Kluyver2016], it requires no installation or coding knowledge. Unlike visual tools like Orange [@Demsar2013], it includes comprehensive statistical testing alongside machine learning. The platform enables complete workflows—upload data, train models, test hypotheses, generate visualizations—without switching applications or writing code.

# Key Features

## Implementation

Built with React 18.3 and TypeScript, the application uses Vite for fast development and optimized production builds. Core functionality relies on `ml-random-forest` (v2.1) for machine learning, `papaparse` (v5.5) for CSV parsing, and `recharts` (v2.15) for interactive visualizations. The modular component architecture separates data processing, model training, statistical analysis, and visualization into independent units.

## Data Upload and Processing

Users upload CSV files via drag-and-drop or file browser. The system automatically detects file structure, displays preview tables with the first 100 rows, and computes summary statistics (mean, standard deviation, quartiles). Data validation checks for missing values with options for row deletion or imputation. Numerical columns can be normalized using z-score or min-max scaling, while categorical variables are automatically integer-encoded.

## Machine Learning

The platform implements Random Forest classification [@Breiman2001], proven effective for chemical property prediction [@Svetnik2003]. Users configure three hyperparameters: number of trees (default: 100), maximum depth (default: unlimited), and minimum samples per split (default: 2). Training runs asynchronously with progress indicators.

Data splits 80/20 for training/testing with stratified sampling to preserve class proportions. The system reports accuracy, precision, recall, and confusion matrices. Feature importance scores identify which variables most influence predictions, helping researchers understand which chemical descriptors drive classification.

## Statistical Testing

The platform includes parametric and non-parametric tests for hypothesis testing. Welch's t-test [@Welch1947] compares means between two groups without assuming equal variances. Mann-Whitney U test provides a non-parametric alternative. For relationships between variables, Pearson's [@Pearson1895] and Spearman's correlation coefficients quantify linear and monotonic associations respectively. All tests report p-values, effect sizes, and confidence intervals with guidance on assumption checking and test selection.

## Visualization

Interactive SVG-based charts include scatter plots, histograms, box plots, feature importance bars, confusion matrices, and correlation heatmaps. All plots support hover tooltips, zoom/pan, and legend toggling. Charts export as PNG for manuscripts and automatically resize for different screen sizes.

## User Interface

Tab-based navigation follows the analysis workflow: Data Upload → Model Training → Results → Statistical Analysis. Form validation provides real-time feedback. Models save to browser local storage (5MB) with versioning for comparing multiple configurations. Trained models export as JSON for future predictions.

# Research Applications

The platform supports chemical property prediction, bioactivity classification, and exploratory data analysis in chemical biology. Typical applications include QSAR modeling, compound screening, and comparative analysis of experimental conditions. The integrated workflow reduces analysis time and technical barriers for laboratory researchers.

# Acknowledgements

The authors acknowledge the Department of Biomedical Engineering and the Department of Chemistry and Chemical Biology at Stevens Institute of Technology for computational resources and institutional support.

# References
