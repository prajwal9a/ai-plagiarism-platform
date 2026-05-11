from fastapi import APIRouter
from pydantic import BaseModel
from app.services.paraphrase_service import paraphrase_text

from app.services.similarity_service import analyze_similarity

router = APIRouter()

class TextRequest(BaseModel):
    text: str

@router.post("/check-plagiarism")
async def check_plagiarism(request: TextRequest):

    result = analyze_similarity(request.text)

    return result
@router.post("/paraphrase")
async def paraphrase(request: TextRequest):

    rewritten_text = paraphrase_text(request.text)

    return {
        "paraphrased_text": rewritten_text
    }