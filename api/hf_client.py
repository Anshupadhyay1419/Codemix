import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Token (single token for all models)
HF_TOKEN = os.getenv("HF_TOKEN", "")

# ✅ Correct Hugging Face Inference API URLs
MODEL_1_URL = os.getenv(
    "MODEL_1_URL",
    "https://api-inference.huggingface.co/models/Ansh1419/xlm-roberta-codemix"
)

MODEL_2_URL = os.getenv(
    "MODEL_2_URL",
    "https://api-inference.huggingface.co/models/Ansh1419/xlm-fakenews"
)

MODEL_3_URL = os.getenv(
    "MODEL_3_URL",
    "https://api-inference.huggingface.co/models/Ansh1419/xlm-eno-sence-model"
)

# Request config
TIMEOUT = 10.0
MAX_RETRIES = 2


def call_hf_api(url: str, text: str) -> dict:
    if not url:
        return {"status": "error", "error": "Model URL not configured."}

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json"
    }

    payload = {"inputs": text}

    for attempt in range(MAX_RETRIES + 1):
        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=TIMEOUT
            )

            response.raise_for_status()
            data = response.json()

            return {
                "status": "success",
                "data": data
            }

        except requests.exceptions.HTTPError:
            if response.status_code == 503 and attempt < MAX_RETRIES:
                import time
                time.sleep(2 ** attempt)  # retry if model is loading
                continue

            return {
                "status": "error",
                "error": f"HTTP Error: {response.text}"
            }

        except requests.exceptions.RequestException as e:
            if attempt < MAX_RETRIES:
                import time
                time.sleep(2 ** attempt)
                continue

            return {
                "status": "error",
                "error": str(e)
            }

        except Exception as e:
            return {
                "status": "error",
                "error": str(e)
            }

    return {
        "status": "error",
        "error": "Max retries exceeded."
    }