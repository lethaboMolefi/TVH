# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (needed for psycopg2)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first to leverage Docker cache
COPY backend/requirements.txt ./backend/

# Install dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the rest of the application code and the db-init folder
COPY backend/ ./backend/
COPY db-init/ ./db-init/

# Expose port (Render sets this dynamically, but defaults to 10000 or 8000)
EXPOSE 8000

# Set the working directory to backend to run the scripts
WORKDIR /app/backend

# Run the DB init script and then start the Uvicorn server
# Uses the PORT environment variable if available (required for Render)
CMD ["sh", "-c", "python init_db.py && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
