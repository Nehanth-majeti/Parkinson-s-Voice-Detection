from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional

app = FastAPI(title="Parkinson's Disease Detection API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schema for the 22 voice features
class VoiceFeatures(BaseModel):
    fo: float              # 1. MDVP:Fo(Hz)
    fhi: float             # 2. MDVP:Fhi(Hz)
    flo: float             # 3. MDVP:Flo(Hz)
    jitter_percent: float  # 4. MDVP:Jitter(%)
    jitter_abs: float      # 5. MDVP:Jitter(Abs)
    rap: float             # 6. MDVP:RAP
    ppq: float             # 7. MDVP:PPQ
    ddp: float             # 8. Jitter:DDP
    shimmer: float         # 9. MDVP:Shimmer
    shimmer_db: float      # 10. MDVP:Shimmer(dB)
    apq3: float            # 11. Shimmer:APQ3
    apq5: float            # 12. Shimmer:APQ5
    apq: float             # 13. MDVP:APQ
    dda: float             # 14. Shimmer:DDA
    nhr: float             # 15. NHR
    hnr: float             # 16. HNR
    rpde: float            # 17. RPDE
    dfa: float             # 18. DFA
    spread1: float         # 19. spread1
    spread2: float         # 20. spread2
    d2: float              # 21. D2
    ppe: float             # 22. PPE
    selected_model: Optional[str] = "Bayesian Logistic Regression"


def mock_predict(features: VoiceFeatures) -> Dict[str, Any]:
    """
    TEMPORARY MOCK PREDICTION FUNCTION.
    -----------------------------------
    NOTE: This is a clearly marked heuristic placeholder and NOT the actual
    trained ML model from 'Unit2_Parkinsons_Voice_Detection.ipynb'.
    
    When you export your trained weights or model (Gaussian Generative Model,
    Logistic Regression, Bayesian Logistic Regression, Linear SVM, or RBF Kernel SVM),
    simply replace this function with your actual NumPy/Scikit-learn inference.
    """
    score = 0.0

    # Spread1 threshold (typically Parkinson's recordings have higher/less negative spread1, e.g. > -5.0)
    if features.spread1 > -5.0:
        score += 0.35
    # PPE (pitch period entropy) is usually higher in affected voices (> 0.20)
    if features.ppe > 0.20:
        score += 0.35
    # HNR (harmonic-to-noise ratio) is lower in dysphonia (< 20.0)
    if features.hnr < 20.0:
        score += 0.18
    # Jitter threshold (> 0.006)
    if features.jitter_percent > 0.006:
        score += 0.12

    # Clamp probability
    prob = round(min(max(score, 0.15), 0.95), 2)
    is_parkinsons = prob >= 0.5

    # Uncertainty distance from 0.5 threshold (Bayesian uncertainty estimation concept)
    uncertainty = round(abs(0.5 - prob), 2)

    model_name = features.selected_model or "Bayesian Logistic Regression"

    return {
        "prediction": 1 if is_parkinsons else 0,
        "label": "Parkinson's" if is_parkinsons else "Healthy",
        "probability": prob,
        "model": model_name,
        "uncertainty": uncertainty
    }


@app.get("/")
def read_root():
    return {"message": "Parkinson's Disease Detection API is running."}


@app.post("/predict")
def predict(features: VoiceFeatures):
    # Call the placeholder prediction function (easily swappable with actual model)
    result = mock_predict(features)
    return result
