# KM-PoPiGo: High-Precision IPD Reconstruction from KM Curves

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Topic](https://img.shields.io/badge/Topic-Survival%20Analysis-blue)](https://github.com/topics/survival-analysis)

## 📖 Description

**KM-PoPiGo** is a **user-friendly** and versatile tool designed for reconstructing **Individual Participant Data (IPD)** from published Kaplan-Meier (KM) survival curves. It offers flexible deployment options, running seamlessly both **Online (Web-based)** and **Offline (Local)** to suit diverse research environments.

Unlike traditional digitizers, KM-PoPiGo employs a **multi-constraint optimization algorithm**. It integrates **Sample size (N)**, **Events (E)**, **At-risk tables (R)**, and **Censoring (C)** to maximize reconstruction accuracy across eight distinct data scenarios (e.g., NERC, NER, N).

### Key Features
* **Accessible & Flexible:** Features an intuitive interface that requires no coding skills, supporting both browser-based access and secure offline local execution.
* **High Precision:** Maximizes accuracy by utilizing available constraints (N, E, R, C) to calibrate the reconstruction algorithm.
* **Full Workflow:** Covers image preprocessing, coordinate calibration, key point marking, and final IPD generation.
* **Reproducibility:** Built-in **"Project Management"** module allows saving/loading sessions via JSON files, ensuring transparent peer review and workflow continuity.
* **Rigorous Validation:** Validated against **Real IPD**, **Synthetic KM**, and **Published KM** benchmark datasets for distributional fidelity and statistical precision.

---

## 🚀 Quick Start

### Online Mode
Access the tool directly via our web server: [Link to your hosted page] (Coming Soon)

### Offline Mode
To ensure data privacy or work without an internet connection:
1.  Clone this repository:
    ```bash
    git clone [https://github.com/ZheqingZhu/kmpopigo.git](https://github.com/ZheqingZhu/kmpopigo.git)
    ```
2.  Open the `index.html` file in any modern web browser (Chrome, Edge, Firefox).

---

## 🛠️ User Guide

### Workflow Overview
The reconstruction process follows a structured 7-step pipeline:

1.  **Load Image:** Upload the KM curve image (Step 1).
2.  **Image Preprocessing:** Crop the region of interest (Step 2.1) and apply masks to remove interfering elements like text or legends (Step 2.2).
3.  **Calibrate Origin:** Locate the (0,0) point on the axes (Step 3).
4.  **Calibrate Axis Limits:** Set the maximum X (Time) and Y (Probability) values (Step 4).
5.  **Mark Key Points:**
    * **Trace Curve:** Manually add points along the curve.
    * **Add Censoring:** Mark vertical tick marks representing censored subjects.
    * **Edit/Delete:** Fine-tune points using the "Edit" or "Delete" modes.
6.  **Set Study Parameters (Constraints):** Input available data such as Total Sample Size (N), Total Events (E), At-risk Table (R), and Censoring Times (C).
7.  **Run Reconstruction:** Generate the IPD.

### Example Cases (Tutorial Module)
New users are encouraged to explore the **"Example Cases"** module.
* This module provides pre-configured workspaces representing **8 distinct constraint combinations** (e.g., NERC, NER, N).
* **Goal:** By examining these presets, users can intuitively learn the expected marking patterns and input requirements for "Set Study Parameters" under different scenarios.

### Project Management (Save/Load)
* **Save Project:** Exports the current session (image, calibration, marks, parameters) as a `.json` file. This file can be shared with reviewers for **collaborative reproduction**.
* **Load Project:** Restores a previously saved session to verify results or continue work.

---

## 📊 Benchmark Datasets

The repository includes three benchmark datasets used to validate the algorithm:

1.  **Real IPD Dataset:** Derived from raw individual patient data. Used to assess **distributional fidelity** (Weibull parameters).
2.  **Published KM Dataset:** Curated from literature. Used to evaluate **statistical precision** (Survival statistics).
3.  **Synthetic KM Dataset:** Computer-generated curves covering theoretical scenarios.

> **Note on Outcome Labels:**
> The Real IPD Dataset comprises diverse survival outcomes (labeled as OS, PFS, etc., based on original metadata) to ensure the validation covers a wide range of curve morphologies and censoring patterns. **It is important to note that the specific outcome labels serve to demonstrate the diversity of the test data distributions and do not mathematically influence the calculation of reconstruction accuracy.** Therefore, while original column names are preserved for traceability, any potential labeling discrepancies in the source metadata do not affect the validity of the benchmarking results.

---

## 📂 Output Data Structure

The exported JSON project file contains the following key components, facilitating both reproduction and secondary analysis:

| Field | Name | Description |
| :--- | :--- | :--- |
| `posList` | Key Point Coordinates | A 2D array recording the (x, y) pixel coordinates of all digitized **Key Points**. |
| `censorPointList` | Censoring Mark Coordinates | A 2D array recording the (x, y) pixel coordinates of all marked **Censoring Events**. |
| `zero` | Origin Coordinates | The pixel coordinates of the origin (0, 0). |
| `maxY` | Axis Limit Coordinates | The pixel coordinates of the calibration point ($X_{max}$, 1.0). |
| `maxYtime` | Maximum X-Axis Value | The numerical value corresponding to the maximum scale of the X-axis. |
| `groupname` | Group Name | User-defined identifier for the experimental group. |
| `timeseq` | At-risk Table Interval | A **single numerical value** representing the fixed time step (interval) between columns in the At-risk table (e.g., 5). |
| `atrisk` | At-risk Numbers (R) | The number of subjects at risk corresponding to the intervals defined by `timeseq`. |
| `total` | Total Sample Size (N) | The initial number of subjects. |
| `events` | Number of Events (E) | The total count of events observed. |
| `canvas` | Image Data | The raw image string encoded in **Base64** format. |

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ✉️ Contact

If you have any questions or feedback, please open an issue or contact the authors.
