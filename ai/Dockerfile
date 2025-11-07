# Production container for FinSmart AI Service (FastAPI)
FROM python:3.11-slim

WORKDIR /app

# Prevent Python from writing pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Copy requirements first for layer caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app ./app

EXPOSE 8001

# Run uvicorn server
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8001"]
