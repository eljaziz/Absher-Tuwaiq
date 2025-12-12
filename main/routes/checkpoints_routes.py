from flask import Blueprint, request, jsonify
from datetime import datetime
from features.checkpoints_feature import CheckpointService

bp = Blueprint("checkpoints", __name__, url_prefix="/api/checkpoints")
svc = CheckpointService()

# Demo storage 
EVENTS = []  # each item: dict with lat/lon + prediction

@bp.get("/status")
def status():
    return jsonify({
        "ok": True,
        "model_ready": bool(svc.ready),
        "model_path": svc.model_path,
        "events_cached": len(EVENTS)
    })

@bp.post("/predict")
def predict():
    payload = request.get_json(force=True) or {}

    # Required for map pinning
    lat = payload.get("latitude")
    lon = payload.get("longitude")
    if lat is None or lon is None:
        return jsonify({"ok": False, "error": "lat and lon are required"}), 400

    features = payload.get("features", {})  # your engineered features
    is_suspicious, prob, risk = svc.predict(features)

    event = {
        "id": len(EVENTS) + 1,
        "timestamp": payload.get("timestamp") or datetime.utcnow().isoformat() + "Z",
        #"checkpoint_id": payload.get("checkpoint_id"),
        "Letter": payload.get("vehicle_id"),  # vehicle ID 
        "latitude": float(lat),
        "longitude": float(lon),
        "is_suspicious": int(is_suspicious),
        "probability": float(prob),
        "combined_risk": int(risk),
        #"features": features,
    }
    EVENTS.append(event)

    return jsonify({"ok": True, "event": event})

@bp.post("/predict-batch")
def predict_batch():
    payload = request.get_json(force=True) or {}
    items = payload.get("items", [])
    if not isinstance(items, list) or len(items) == 0:
        return jsonify({"ok": False, "error": "items (list) is required"}), 400

    results = []
    for it in items:
        lat, lon = it.get("latitude"), it.get("longitude")
        if lat is None or lon is None:
            continue
        #features = it.get("features", {})
        is_suspicious, prob, risk = svc.predict(features)
        results.append({
            "checkpoint_id": it.get("checkpoint_id"),
            "vehicle_id": it.get("vehicle_id"),
            "lat": float(lat),
            "lon": float(lon),
            "is_suspicious": int(is_suspicious),
            "probability": float(prob),
            "risk_score": int(risk),
        })

    return jsonify({"ok": True, "results": results})

'''
@bp.get("/geojson")
def geojson():
    """
    Query params:
      - only_suspicious=1
      - min_risk=60
      - limit=500
    """
    only_susp = request.args.get("only_suspicious", "1") == "1"
    min_risk = int(request.args.get("min_risk", "0"))
    limit = int(request.args.get("limit", "500"))

    filtered = EVENTS[::-1]  # newest first
    if only_susp:
        filtered = [e for e in filtered if e["is_suspicious"] == 1]
    if min_risk > 0:
        filtered = [e for e in filtered if e["risk_score"] >= min_risk]
    filtered = filtered[:limit]

    features = []
    for e in filtered:
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [e["lon"], e["lat"]]},
            "properties": {
                "id": e["id"],
                "timestamp": e["timestamp"],
                "checkpoint_id": e.get("checkpoint_id"),
                "vehicle_id": e.get("vehicle_id"),
                "risk_score": e["risk_score"],
                "probability": e["probability"],
                "is_suspicious": e["is_suspicious"],
            }
        })

    return jsonify({"type": "FeatureCollection", "features": features})
'''