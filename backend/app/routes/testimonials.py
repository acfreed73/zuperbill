# backend/app/routes/testimonials.py
import re
from app.utils.auth import verify_token
from fastapi import APIRouter, Query, Depends
import random

# OpenAI Start
import os
import requests
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"
# HF_MODEL = "google/flan-t5-small"
# OpenAI End

router = APIRouter()

THEME_TEMPLATES = {
    "price": [
        "Very reasonable rates for the level of service.",
        "Didn’t feel overcharged—great value!",
        "Transparent pricing from the start.",
        "No surprises, just honest pricing.",
        "Fair and budget-friendly.",
        "Excellent work for the price.",
        "Totally worth every dollar.",
        "Clear rates and no hidden fees.",
        "Great deal for high-quality work.",
        "Price was right and results were great."
    ],
    "timely": [
        "They showed up exactly when they said they would.",
        "Quick to respond and got it done same-day.",
        "Really appreciated the prompt service.",
        "No delays, everything was on schedule.",
        "Very reliable with timing.",
        "Fast and on point from start to finish.",
        "They respected my time, which I value.",
        "Job was done faster than I expected.",
        "Scheduling was smooth and efficient.",
        "Came on time and worked efficiently."
    ],
    "cordial": [
        "Super friendly and easy to talk to.",
        "Felt like I was working with a neighbor.",
        "They were kind and respectful the entire time.",
        "Great attitude—made me feel comfortable.",
        "Very approachable and helpful.",
        "Down-to-earth and professional.",
        "Always smiling and polite.",
        "Listened carefully and explained things well.",
        "Treated my home and family with respect.",
        "Really good people doing solid work."
    ],
    "clean": [
        "Didn’t leave a speck behind.",
        "Cleaned up better than it was before.",
        "You’d never know any work was done—so neat!",
        "Very respectful of the space and cleanliness.",
        "Took care to protect my floors and furniture.",
        "Clean job site from start to finish.",
        "No dust, no mess, just great work.",
        "Left everything spotless and organized.",
        "Tidy and mindful every step of the way.",
        "I didn’t have to clean a thing afterward."
    ],
    "quality": [
        "Really solid craftsmanship.",
        "Every detail was done right.",
        "Built to last—that’s clear.",
        "Everything looks and works perfectly.",
        "You can tell they take pride in their work.",
        "No shortcuts—just high-quality results.",
        "Looks like it was always part of the house.",
        "Took the time to do it right.",
        "High standards and it shows.",
        "I was genuinely impressed with the finish."
    ],
    "overall": [
        "Zuper Handy lived up to the name!",
        "Would absolutely recommend to anyone.",
        "They made it so easy from beginning to end.",
        "I’ll definitely be calling them again.",
        "Fantastic all-around experience.",
        "Really happy with the entire process.",
        "Dependable, honest, and professional.",
        "Everything went smoothly, no stress at all.",
        "Top to bottom, a great job.",
        "Wish I’d called them sooner!"
    ]
}


# @router.get("/generate-testimonial")
# def generate_testimonial(theme: str = Query("overall"), token: dict = Depends(verify_token)):
#     return random.choice(THEME_TEMPLATES.get(theme, THEME_TEMPLATES["overall"]))

# Start OpenAI
def generate_ai_testimonial(theme: str) -> str:
    if not HF_TOKEN:
        raise HTTPException(status_code=500, detail="Hugging Face token not set")

    THEME_EXPLANATIONS = {
        "price": "affordable rates, fair pricing, and great value",
        "timely": "being punctual, finishing the work on time, and quick responses",
        "cordial": "friendly and respectful behavior, clear communication",
        "clean": "leaving the workspace spotless and respecting the home",
        "quality": "excellent craftsmanship, attention to detail, and lasting results",
        "overall": "the entire service experience from start to finish"
    }

    prompt = (
        f"Write a very positive and authentic customer testimonial for a handyman service named Zuper Handy, "
        f"specifically complimenting their '{theme}', which refers to {THEME_EXPLANATIONS.get(theme, 'their overall performance')}. "
        f"The testimonial should be under 3 sentences, sound natural and enthusiastic, and include no criticism. "
        f"Only output the testimonial text itself, nothing else."
    )

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 80,
            "temperature": 0.9,
            "top_p": 0.95,
            "do_sample": True,
            "repetition_penalty": 1.2
        }
    }

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}"
    }

    url = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    result = response.json()
    if isinstance(result, list) and "generated_text" in result[0]:
        raw_output = result[0]["generated_text"]
        # Try to extract the first quoted block or just the part after two newlines
        match = re.search(r'"([^"]+)"', raw_output)
        if match:
            return match.group(1).strip()
        else:
            # Fallback: strip the prompt and return the last part
            parts = raw_output.split("\n\n")
            return parts[-1].strip()

    elif isinstance(result, dict) and "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    raise HTTPException(status_code=500, detail="Unexpected response from Hugging Face API")
@router.get("/generate-testimonial")
def generate_testimonial(theme: str = Query("overall"), token: dict = Depends(verify_token)):
    return generate_ai_testimonial(theme)
# end OpenAI
