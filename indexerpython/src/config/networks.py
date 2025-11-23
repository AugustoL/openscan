from pydantic_settings import BaseSettings
from typing import Dict, List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # RPC URLs
    eth_mainnet_rpc_url: str = "https://eth.llamarpc.com"
    eth_sepolia_rpc_url: str = "https://rpc.sepolia.org"
    eth_local_rpc_url: str = "http://127.0.0.1:8545"

    # Default network
    default_network: str = "sepolia"

    # Database
    database_url: str = "sqlite:///./data/openscan.db"

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000

    # Indexer
    blocks_to_index: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = False


class NetworkConfig:
    """Network configuration for EVM chains"""

    NETWORKS = {
        1: {
            "name": "Ethereum Mainnet",
            "chain_id": 1,
            "rpc_key": "eth_mainnet_rpc_url",
            "explorer": "https://etherscan.io"
        },
        11155111: {
            "name": "Sepolia Testnet",
            "chain_id": 11155111,
            "rpc_key": "eth_sepolia_rpc_url",
            "explorer": "https://sepolia.etherscan.io"
        },
        31337: {
            "name": "Local Node",
            "chain_id": 31337,
            "rpc_key": "eth_local_rpc_url",
            "explorer": None
        }
    }

    NETWORK_NAMES = {
        "mainnet": 1,
        "sepolia": 11155111,
        "local": 31337
    }

    @classmethod
    def get_rpc_url(cls, network_id: int, settings: Settings) -> str:
        """Get RPC URL for a network ID"""
        if network_id not in cls.NETWORKS:
            raise ValueError(f"Unsupported network ID: {network_id}")

        rpc_key = cls.NETWORKS[network_id]["rpc_key"]
        return getattr(settings, rpc_key)

    @classmethod
    def get_network_id(cls, network_name: str) -> int:
        """Get network ID from name"""
        network_name = network_name.lower()
        if network_name not in cls.NETWORK_NAMES:
            raise ValueError(f"Unknown network name: {network_name}")
        return cls.NETWORK_NAMES[network_name]

    @classmethod
    def get_network_info(cls, network_id: int) -> Dict:
        """Get network information"""
        if network_id not in cls.NETWORKS:
            raise ValueError(f"Unsupported network ID: {network_id}")
        return cls.NETWORKS[network_id]


settings = Settings()
