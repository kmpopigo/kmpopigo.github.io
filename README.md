# KM-PoPiGo: High-Precision IPD Reconstruction from KM Curves

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Topic](https://img.shields.io/badge/Topic-Survival%20Analysis-blue)](https://github.com/topics/survival-analysis)
[![Web App](https://img.shields.io/badge/Web-Live%20Demo-green)](https://kmpopigo.github.io/)

## 📖 Description

**KM-PoPiGo** is a **user-friendly** and versatile tool designed for reconstructing **Individual Participant Data (IPD)** from published Kaplan-Meier (KM) survival curves. It offers flexible deployment options, running seamlessly both **Online (Web-based)** and **Offline (Local)** to suit diverse research environments.

👉 **Access the Web Tool:** [https://kmpopigo.github.io/](https://kmpopigo.github.io/)  

Unlike traditional digitizers, KM-PoPiGo employs a **multi-constraint optimization algorithm**. It integrates **Sample size (N)**, **Number of events (E)**, **At-risk tables (R)**, and **Censoring times(C)** to maximize reconstruction accuracy across eight distinct summary-statistic constraints (e.g., NERC, NER, N).

### 🚀 Key Features

* **Accessible & Flexible:** Features an intuitive interface that requires no coding skills, supporting both browser-based access and secure offline local execution.
* **High Precision:** Maximizes accuracy by utilizing available constraints (N, E, R, C) to calibrate the reconstruction algorithm.
* **Full Workflow:** Covers image preprocessing, coordinate calibration, key point marking, and final IPD generation.
* **Reproducibility:** Built-in **"Project Management"** module allows saving/loading sessions via JSON files, ensuring transparent peer review and workflow continuity.
---

## 🚀 Quick Start

### Online Mode
Access the tool directly via our web server: [https://kmpopigo.github.io/](https://kmpopigo.github.io/)

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


## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ✉️ Contact

If you have any questions or feedback, please open an issue or contact the authors.
