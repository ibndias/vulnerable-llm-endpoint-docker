# Dockerfile for Ollama
FROM ollama/ollama:latest

# Expose Ollama API port
EXPOSE 11434

# Create a startup script that pulls the model if not present
RUN echo '#!/bin/bash\n\
ollama serve &\n\
sleep 5\n\
ollama pull qwen3:0.6b\n\
wait' > /start.sh && chmod +x /start.sh

# Set the entrypoint
ENTRYPOINT ["/start.sh"]
