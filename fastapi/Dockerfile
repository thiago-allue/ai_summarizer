# Dockerfile for FastAPI application
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all FastAPI project files into the container
COPY . .

# Expose the FastAPI port
EXPOSE 6677

# Run the server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "6677"]
