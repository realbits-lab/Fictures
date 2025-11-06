"""GPU memory management utilities."""

import gc
import logging
import torch

logger = logging.getLogger(__name__)


def cleanup_gpu_memory(force: bool = True) -> None:
    """
    Clean up GPU memory by clearing caches and running garbage collection.

    Args:
        force: If True, performs aggressive cleanup including synchronization
    """
    if not torch.cuda.is_available():
        return

    logger.info("Cleaning up GPU memory...")

    # Run garbage collection to free Python objects
    gc.collect()

    # Clear PyTorch's CUDA memory cache
    torch.cuda.empty_cache()

    if force:
        # Synchronize all CUDA operations
        torch.cuda.synchronize()

        # Clear cache again after synchronization
        torch.cuda.empty_cache()

    # Log memory stats
    if torch.cuda.is_available():
        allocated = torch.cuda.memory_allocated() / 1024**3  # GB
        reserved = torch.cuda.memory_reserved() / 1024**3  # GB
        logger.info(f"GPU Memory - Allocated: {allocated:.2f}GB, Reserved: {reserved:.2f}GB")


def get_gpu_memory_info() -> dict:
    """
    Get current GPU memory usage information.

    Returns:
        Dictionary with memory statistics in GB
    """
    if not torch.cuda.is_available():
        return {
            "available": False,
            "allocated": 0,
            "reserved": 0,
            "free": 0,
        }

    allocated = torch.cuda.memory_allocated() / 1024**3  # GB
    reserved = torch.cuda.memory_reserved() / 1024**3  # GB
    total = torch.cuda.get_device_properties(0).total_memory / 1024**3  # GB
    free = total - allocated

    return {
        "available": True,
        "allocated": allocated,
        "reserved": reserved,
        "total": total,
        "free": free,
    }
