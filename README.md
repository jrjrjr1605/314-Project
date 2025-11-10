# 314 Project

This is a web application built for the project..

## 🛠️ Tech Stack
**Frontend:** React (Vite), Tailwind CSS, shadcn/ui  
**Backend:** FastAPI, SQLAlchemy
**Database:** PostgreSQL

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository
```bash
git clone https://github.com/jrjrjr1605/314-Project.git
cd 314-Project

## **How to set up venv**
python -m venv venv
venv/Scripts/activate

## **How to run backend**
cd backend

venv\Scripts\activate  # Windows
# or source venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
py users.py (uncomment bottom part and paste into psql terminal, then comment it out again and run the python code)
uvicorn main:app --reload

## **How to run frontend**
cd frontend

npm run dev
