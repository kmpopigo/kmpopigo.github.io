"""AI-friendly KM-PoPiGo reconstruction from annotated curves (not raw images)."""

from .api import reconstruct, validate
from .inputs import InputError

__all__ = ["reconstruct", "validate", "InputError"]
__version__ = "0.1.0"
