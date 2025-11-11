#!/bin/bash

# Set CUDA environment variables
export CUDA_HOME=/usr/local/cuda-12.6
export PATH=/usr/local/cuda-12.6/bin:$PATH
export LD_LIBRARY_PATH=/usr/local/cuda-12.6/lib64:$LD_LIBRARY_PATH

# Activate virtual environment
source venv/bin/activate

# Start uvicorn server
python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
