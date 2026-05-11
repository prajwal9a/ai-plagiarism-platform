import re
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

model = SentenceTransformer("all-MiniLM-L6-v2")

HIGH_THRESHOLD = 0.75
MEDIUM_THRESHOLD = 0.55

def split_sentences(text: str):
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if s.strip()]

def analyze_similarity(text: str):
    sentences = split_sentences(text)

    if len(sentences) < 2:
        return {
            "plagiarism_percent": 0,
            "copied_percent": 0,
            "self_similarity_percent": 0,
            "originality_percent": 100,
            "flagged_sentences": []
        }

    embeddings = model.encode(sentences)

    flagged_sentences = []
    high_matches = 0
    medium_matches = 0
    total_pairs = 0
    total_score = 0

    for i in range(len(sentences)):
        for j in range(i + 1, len(sentences)):
            similarity = float(cosine_similarity([embeddings[i]], [embeddings[j]])[0][0])
            total_pairs += 1
            total_score += similarity

            if similarity >= HIGH_THRESHOLD:
                high_matches += 1
                flagged_sentences.append({
                    "sentence1": sentences[i],
                    "sentence2": sentences[j],
                    "similarity_percent": round(similarity * 100, 2),
                    "status": "Highly Similar"
                })
            elif similarity >= MEDIUM_THRESHOLD:
                medium_matches += 1
                flagged_sentences.append({
                    "sentence1": sentences[i],
                    "sentence2": sentences[j],
                    "similarity_percent": round(similarity * 100, 2),
                    "status": "Moderately Similar"
                })

    avg_similarity = total_score / total_pairs if total_pairs else 0

    copied_percent = round((high_matches / total_pairs) * 100, 2)
    self_similarity_percent = round(((high_matches + medium_matches) / total_pairs) * 100, 2)
    plagiarism_percent = round(avg_similarity * 100, 2)
    originality_percent = max(0, round(100 - plagiarism_percent, 2))

    return {
        "plagiarism_percent": plagiarism_percent,
        "copied_percent": copied_percent,
        "self_similarity_percent": self_similarity_percent,
        "originality_percent": originality_percent,
        "flagged_sentences": flagged_sentences
    }