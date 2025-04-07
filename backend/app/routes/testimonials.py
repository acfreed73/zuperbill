# backend/app/routes/testimonials.py
from app.utils.auth import verify_token
from fastapi import APIRouter, Query, Depends
import random

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


@router.get("/generate-testimonial")
def generate_testimonial(theme: str = Query("overall"), token: dict = Depends(verify_token)):
    return random.choice(THEME_TEMPLATES.get(theme, THEME_TEMPLATES["overall"]))
