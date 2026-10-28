
import io
import os

import torch
import torch.nn.functional as F
from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from transformers import CLIPModel, CLIPProcessor

MODEL_NAME = "openai/clip-vit-base-patch32"
MAX_IMAGE_BYTES = 5 * 1024 * 1024

app = FastAPI(title="Ecommerce Visual Search AI")

device = "cuda" if torch.cuda.is_available() else "cpu"
model = None
processor = None


@app.on_event("startup")
def load_model():
    global model, processor

    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model = CLIPModel.from_pretrained(MODEL_NAME).to(device)
    model.eval()


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "device": device,
        "ready": model is not None,
    }


@app.post("/embed")
async def create_embedding(image: UploadFile = File(...)):
    if image.content_type not in {
        "image/jpeg",
        "image/png",
        "image/webp",
    }:
        raise HTTPException(
            status_code=400,
            detail="Upload a JPEG, PNG, or WebP image.",
        )

    raw = await image.read(MAX_IMAGE_BYTES + 1)

    if not raw or len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Image must be between 1 byte and 5 MB.",
        )

    try:
        with Image.open(io.BytesIO(raw)) as source:
            source.verify()

        with Image.open(io.BytesIO(raw)) as source:
            picture = source.convert("RGB")

    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    inputs = processor(images=picture, return_tensors="pt")
    inputs = {key: value.to(device) for key, value in inputs.items()}

    try:
        with torch.inference_mode():
            features = model.get_image_features(**inputs)

            # Support tensor outputs and model-output objects.
            if not isinstance(features, torch.Tensor):
                features = getattr(features, "pooler_output", None)

            if features is None:
                raise RuntimeError("The model returned no image features.")

            features = F.normalize(features, p=2, dim=-1)
            embedding = features[0].float().cpu().tolist()

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Could not generate the image embedding.",
        ) from exc

    if len(embedding) != 512:
        raise HTTPException(
            status_code=500,
            detail="Unexpected embedding dimensions.",
        )

    return {
        "model": MODEL_NAME,
        "dimensions": len(embedding),
        "embedding": embedding,
    }
