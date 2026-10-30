FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV ALLOWED_ORIGINS=http://localhost:5173
# trains once if no model exists yet, then serves
CMD ["sh", "-c", "[ -f vol_model.joblib ] || python vol.py; uvicorn serve:app --host 0.0.0.0 --port 8000"]
