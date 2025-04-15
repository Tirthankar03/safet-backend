# 🛡️ SafeT – Crime Reporting and Public Safety App

**Empowering Communities, Ensuring Safety**  
_A Microservices-based public safety platform built to transform everyday citizens into first responders._


---

## 🚨 Overview

SafeT is a full-stack public safety and crime reporting platform designed to address three major issues in urban safety:

1. **Delayed Crime Reporting**
2. **Limited Community Awareness**
3. **Insufficient Emergency Support**

Built with a **microservices architecture** using `Express.js`, `FastAPI`, `PostgreSQL`, `PostGIS`, and `pgvector`, SafeT introduces powerful, real-time safety features like incident clustering, face-based missing person search, and radius-based SOS alerts to empower communities and improve emergency response times.

---

## 🌟 Features

### 📍 Crime Reporting
- Users can report crimes with:
  - Descriptions
  - Images
  - Geo-coordinates (automatically pinned on a dynamic map)

### 🧠 Dynamic Clustering (DBSCAN + PostGIS)
- Real-time clustering of reports within a **10km radius**
- Uses **DBSCAN** algorithm via **PostGIS**
- Helps identify high-risk and crime-prone zones visually on a map

### 🧬 Missing Person Detection
- Upload a photo of a missing person
- Embedding generated via FastAPI + AI model
- Image is compared against other uploaded images using **pgvector**
- Quickly scans for facial matches in existing crime reports

### 🆘 SOS Alert System
- Users can add emergency contacts
- If SOS is triggered:
  - All trusted contacts are notified immediately
  - App users within **4km** of the sender are also alerted
- Integration with **OneSignal** for real-time mobile/web notifications

### 💾 Technology Stack

| Area | Technology |
|------|------------|
| Core Backend | **Express.js** (Node.js) |
| Face Recognition Microservice | **FastAPI** (Python) |
| Database | **PostgreSQL** |
| Geospatial Queries | **PostGIS** |
| Vector Search | **pgvector** |
| Notifications | **OneSignal API** |
| Deployment | Vercel / Railway / Render (recommendation) |

---

## 🔁 System Architecture

SafeT is built using **microservices**, dividing responsibilities clearly:

```
+---------------------+        +--------------------------+
|  User Mobile / Web  |  <---> |     Express.js Backend   |
+---------------------+        +--------------------------+
                                         |
                                         v
                            +----------------------------+
                            | PostgreSQL + PostGIS +     |
                            | pgvector (Unified DB)      |
                            +----------------------------+
                                         |
                                         v
                            +----------------------------+
                            |   FastAPI (Face Recognition)|
                            +----------------------------+
```

---

## 🧑‍💻 Developer Responsibilities

As the **Backend Developer**, I:

- Architected the entire backend using microservices and PostgreSQL
- Integrated **geospatial clustering** with PostGIS
- Implemented **vector-based image similarity search** using pgvector
- Built a real-time **SOS alert system** with contact and geofencing logic
- Optimized query performance and data structures for large-scale reports
- Ensured high reliability through robust error handling and modular service design

---

## 🗺️ Key Functional Flows

### 1. Incident Reporting

```text
User submits a report → Image + coordinates saved → Marker shown on live map
```

### 2. Clustering (PostGIS + DBSCAN)

```text
When 2+ reports are within 10km radius → Cluster created → Cluster visualized on frontend
```

### 3. Missing Person Matching

```text
Image uploaded → Vector embedding generated (FastAPI) → Search across all embeddings → Return closest matches
```

### 4. SOS Trigger

```text
User presses SOS → All contacts + nearby users (within 4km) get instant alert via OneSignal
```

---

## 📊 Real-World Impact

> “Every alert matters. Every second saved could save a life.”

- 📉 Potential 20% reduction in crime impact in high-alert zones
- 👩‍🦰 Empowers women and vulnerable communities with immediate support access
- 👥 Turns citizens into real-time responders by enabling smart notifications

---

## 📈 Why SafeT?

Traditional systems are broken:

- Reports take too long to reach law enforcement
- Communities remain unaware of local dangers
- Emergency responses lack coordination

**SafeT fixes that** with real-time, community-first tools backed by modern geospatial and AI technologies.

---


## 🧪 Future Improvements

- Role-based access control for police/admin dashboards
- Live crime heatmaps using real-time WebSockets
- NLP-based report parsing to auto-categorize crimes
- Integration with government safety APIs
- Offline-first support for areas with poor connectivity

---


Make sure to configure `.env` with your PostgreSQL credentials, OneSignal API keys, and FastAPI endpoint URL.

---

## 🔗 Useful Links

- 📲 [Download SafeT (Coming Soon)](https://safet.app)
- 🧠 [What is pgvector?](https://github.com/pgvector/pgvector)
- 🌍 [PostGIS Documentation](https://postgis.net/docs/)
- 🔔 [OneSignal Notification Docs](https://documentation.onesignal.com/)

---

> _SafeT isn’t just an app—it’s a movement toward a safer, more connected community._
