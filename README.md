# BigQuery Release Notes Dashboard

A modern, visually stunning web application built with a **Python Flask** backend and a **Vanilla HTML/CSS/JavaScript** frontend. It fetches, parses, and displays Google Cloud's official BigQuery release notes feed in real-time, allowing you to easily search, filter, and share updates on Twitter (X).

---

## ✨ Features

- 🔄 **Real-Time Feed Fetching:** Downloads and parses Google Cloud's official Atom release notes feed automatically or on-demand.
- 🧩 **Granular Update Separation:** Google Cloud publishes notes grouped by date. This application automatically parses and splits these daily summaries into individual, category-specific cards (e.g., separating Features from deprecations).
- 🎨 **Premium Glassmorphic Design:** A modern dark-theme user interface crafted with Vanilla CSS, responsive grids, sleek background radial glows, and micro-interactions.
- 🔍 **Live Search:** Filter notes dynamically by typing keywords in the search bar.
- 🏷️ **Category Filter Chips:** Quick-toggle filters to narrow down updates by **Features**, **Changes**, or **Deprecations**.
- 🐦 **Twitter (X) Share Integration:** A custom, character-limited compose modal that auto-generates engaging tweet drafts complete with relevant hashtags (`#BigQuery #GoogleCloud`) and official links.
- 📋 **Shareable Links:** Click to copy individual update links to your clipboard.

---

## 🛠️ Tech Stack

- **Backend:** Python, Flask
- **Frontend:** Plain HTML5, Vanilla CSS3 (custom CSS variables & gradients), Vanilla JavaScript (ES6+)
- **Icons:** [Lucide Icons](https://lucide.dev/) (loaded via CDN)
- **Fonts:** [Google Fonts](https://fonts.google.com/) (Inter & Outfit)

---

## 📂 Project Structure

```text
bigquery-release-notes/
│
├── app.py                # Flask server, feed fetcher, and API endpoint
├── templates/
│   └── index.html        # Main dashboard HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Premium dark theme and layout styling
│   └── js/
│       └── app.js        # Feed fetching, sub-update parsing, search, and modal logic
├── .gitignore            # Standard git ignore file for Python Flask project
└── README.md             # Project documentation (this file)
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have **Python 3.x** and `pip` installed on your machine.

### 1. Clone the repository

```bash
git clone https://github.com/shakibsyed603-gif/bigquery-release-notes.git
cd bigquery-release-notes
```

### 2. Install dependencies

Install Flask:

```bash
pip install flask
```

### 3. Run the application

Start the Flask development server:

```bash
python app.py
```

### 4. Open in browser

Go to your web browser and open:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 📝 License

This project is open-source and available under the Apache 2.0 License.
