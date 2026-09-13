import os
import io
import json
import tempfile
from flask import Flask, request, jsonify, send_from_directory
from PIL import Image
from predict import predict_disease, load_model, load_class_mapping
from video_detector import process_video_detection
from fecal_detector import predict_fecal, load_fecal_model

# Initialize Flask App with static folder pointing to frontend build dist
frontend_dist = os.path.join(os.path.dirname(__file__), 'frontend', 'dist')
app = Flask(__name__, static_folder=frontend_dist, static_url_path='')

# Preload PoulCare Neural Vision model into memory
print("Preloading PoulCare Neural Vision Detection Model...")
MODEL = load_model()
CLASS_MAPPING = load_class_mapping()
print(f"PoulCare Neural Vision Model loaded successfully! {len(CLASS_MAPPING)} classes registered.")

# Preload PoulCare Fecal Diagnostic model into memory
print("Preloading PoulCare Fecal Diagnostic Model...")
FECAL_MODEL = load_fecal_model()
print("PoulCare Fecal Diagnostic Model loaded successfully! 4 fecal classes registered.")

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "model_source": "PoulCare-YOLOv11-Vision",
        "model_loaded": MODEL is not None,
        "class_count": len(CLASS_MAPPING),
        "classes": CLASS_MAPPING,
        "fecal_model_loaded": FECAL_MODEL is not None,
        "fecal_classes": ["cocci", "healthy", "ncd", "salmo"]
    })

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        if 'file' not in request.files:
            return jsonify({"status": "error", "error": "No image file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"status": "error", "error": "Empty filename"}), 400
        
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        result = predict_disease(image, model=MODEL)
        
        return jsonify({
            "status": "success",
            "data": result
        })
    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route('/predict_fecal', methods=['POST', 'OPTIONS'])
def predict_fecal_route():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        if 'file' not in request.files:
            return jsonify({"status": "error", "error": "No image file uploaded"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"status": "error", "error": "Empty filename"}), 400

        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        result = predict_fecal(image, model=FECAL_MODEL)

        return jsonify({
            "status": "success",
            "data": result
        })
    except Exception as e:
        print(f"Fecal Prediction Error: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

@app.route('/predict_video', methods=['POST', 'OPTIONS'])
def predict_video():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    try:
        if 'file' not in request.files:
            return jsonify({"status": "error", "error": "No video file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"status": "error", "error": "Empty video filename"}), 400

        # Save uploaded video to temporary file
        ext = os.path.splitext(file.filename)[1] or '.mp4'
        temp_dir = os.path.join(os.path.dirname(__file__), 'temp_uploads')
        os.makedirs(temp_dir, exist_ok=True)
        
        temp_video_path = os.path.join(temp_dir, f"video_upload_{os.urandom(4).hex()}{ext}")
        file.save(temp_video_path)

        try:
            print(f"Processing uploaded video file: {temp_video_path}...")
            video_result = process_video_detection(temp_video_path)
            return jsonify({
                "status": "success",
                "data": video_result
            })
        finally:
            if os.path.exists(temp_video_path):
                os.remove(temp_video_path)

    except Exception as e:
        print(f"Video Detection Error: {e}")
        return jsonify({"status": "error", "error": str(e)}), 500

# Catch-all route to serve React frontend SPA
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    elif os.path.exists(os.path.join(app.static_folder, 'index.html')):
        return send_from_directory(app.static_folder, 'index.html')
    else:
        return jsonify({
            "status": "online",
            "message": "PoulCare AI ML Endpoint Server Online. Build frontend with 'npm run build' inside frontend/ to view web app."
        })

if __name__ == '__main__':
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting PoulCare AI Server at http://localhost:{port}")
    app.run(host=host, port=port, debug=False)
