from flask import Flask 
#from routes.emotion_detection_routes import bp as emotion_exp_bp
from routes.checkpoints_routes import bp as checkpoints_bp

def create_app():
    app = Flask(__name__)

    #app.register_blueprint(emotion_exp_bp)
    app.register_blueprint(checkpoints_bp)


    @app.route("/api/health", methods=["GET"])
    def health():
        return {"ok": True}
    
    return app

if __name__ =="__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=5000, debug=True)