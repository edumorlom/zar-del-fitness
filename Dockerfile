FROM python:3.14-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

# Railway (and most hosts) set PORT; main.py listens on it.
CMD ["python", "main.py"]
