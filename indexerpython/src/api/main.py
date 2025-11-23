from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import blocks, transactions, address, network, logs
from src.database.connection import init_db

app = FastAPI(
    title="OpenScan Indexer API",
    description="Blockchain block explorer API - Index and query EVM blockchain data",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()
    print("Database initialized")

# Include routers
app.include_router(blocks.router)
app.include_router(transactions.router)
app.include_router(address.router)
app.include_router(network.router)
app.include_router(logs.router)


@app.get("/")
def root():
    """Root endpoint with API information"""
    return {
        "name": "OpenScan Indexer API",
        "version": "1.0.0",
        "description": "Blockchain block explorer API for EVM chains",
        "endpoints": {
            "blocks": "/blocks",
            "transactions": "/transactions",
            "address": "/address",
            "network": "/network",
            "logs": "/logs",
            "docs": "/docs",
            "openapi": "/openapi.json"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    from src.config.networks import settings

    uvicorn.run(
        "src.api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
