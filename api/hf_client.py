"""
hf_client.py — Local model inference using transformers pipeline.
Models are loaded once on first use (lazy loading) and cached in memory.
No external API calls — runs entirely within the HF Space.
"""

import os
import logging
from functools import lru_cache

logger = logging.getLogger(__name__)

MODEL_1_ID = os.getenv("MODEL_1_ID", "Ansh1419/xlm-roberta-codemix")
MODEL_2_ID = os.getenv("MODEL_2_ID", "Ansh1419/xlm-fakenews")
MODEL_3_ID = os.getenv("MODEL_3_ID", "Ansh1419/xlm-eno-sence-model")

# Keep URLs as aliases for backward compat with models.py
MODEL_1_URL = MODEL_1_ID
MODEL_2_URL = MODEL_2_ID
MODEL_3_URL = MODEL_3_ID

_pipelines = {}


def _get_pipeline(model_id: str):
    """Lazy-load and cache a transformers pipeline for the given model."""
    if model_id not in _pipelines:
        try:
            from transformers import pipeline
            logger.info(f"Loading model: {model_id}")
            _pipelines[model_id] = pipeline(
                "text-classification",
                model=model_id,
                top_k=None,          # return all label scores
                truncation=True,
                max_length=512,
            )
            logger.info(f"Model loaded: {model_id}")
        except Exception as e:
            logger.error(f"Failed to load model {model_id}: {e}")
            _pipelines[model_id] = None
    return _pipelines[model_id]


def call_hf_api(model_id: str, text: str) -> dict:
    """
    Run local inference using transformers pipeline.
    Returns same dict format as the old HTTP-based call_hf_api.
    """
    if not model_id:
        return {"status": "error", "error": "Model ID not configured."}

    try:
        pipe = _get_pipeline(model_id)
        if pipe is None:
            return {"status": "error", "error": f"Model {model_id} failed to load."}

        raw = pipe(text)
        # pipeline returns [[{"label": "LABEL_0", "score": 0.9}, ...]]
        # wrap in outer list to match old API format
        if isinstance(raw, list) and len(raw) > 0 and isinstance(raw[0], dict):
            data = [raw]  # wrap flat list
        else:
            data = raw

        return {"status": "success", "data": data}

    except Exception as e:
        logger.error(f"Inference error for {model_id}: {e}")
        return {"status": "error", "error": str(e)}
