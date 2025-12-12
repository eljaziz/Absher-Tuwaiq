import os
import numpy as np

try:
    import joblib
except ImportError:
    joblib = None

class CheckpointService:
    def __init__(self, model_path=None):
        self.model_path = model_path or os.getenv("CHECKPOINT_MODEL_PATH", "main/models/suspicious_driving_model.pkl")
        self.model = None
        self.ready = False
        self.load()

    def load(self):
        if joblib is None:
            self.ready = False
            return
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
            self.ready = True

    def predict(self, features: dict):
        """
        features dict -> vector in the exact order your model expects
        You MUST keep the same column order used during training.
        """
        if not self.ready:
            return 0, 0.0, 0

        cols = ['Speed', 'Acceleration', 'laneChange', 'PastHistory', 'latitude', 'longitude', 'is_high_speed', 'speed_lane_interaction', 'is_sudden', 'combined_risk']
        X = np.array([float(features.get(c, 0)) for c in cols], dtype=float).reshape(1, -1)

        if hasattr(self.model, "predict_proba"):
            p = float(self.model.predict_proba(X)[0][1])  # prob of suspicious
        else:
            pred = int(self.model.predict(X)[0])
            p = 0.75 if pred == 1 else 0.25

        is_suspicious = 1 if p >= 0.5 else 0
        risk_score = int(round(p * 100))
        return is_suspicious, p, risk_score
