from flask import Flask, request, jsonify
from ultralytics import YOLO
import os

app = Flask(__name__)

# Load the YOLO model
model = YOLO("F:/Quang/best.pt")  # Ensure the YOLOv8 model file exists in your working directory

# Create an uploads folder for temporary file storage
UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/detect', methods=['POST'])
def detect_objects():
    try:
        # Check if a file is present in the request
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        file = request.files['file']

        # Check if the file is valid
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Save the uploaded file to the server
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        # Perform detection using YOLO
        results = model(file_path)  # Run inference on the image

        # Process results and extract detections
        detections = []
        for result in results:
            for box in result.boxes:  # Iterate over detected boxes
                detection = {
                    'x1': float(box.xyxy[0][0]),  # Top-left X coordinate
                    'y1': float(box.xyxy[0][1]),  # Top-left Y coordinate
                    'x2': float(box.xyxy[0][2]),  # Bottom-right X coordinate
                    'y2': float(box.xyxy[0][3]),  # Bottom-right Y coordinate
                    'confidence': float(box.conf[0]),  # Confidence score
                    'class': int(box.cls[0]),  # Class ID
                    'name': result.names[int(box.cls[0])]  # Class name
                }
                detections.append(detection)

        # Clean up the uploaded file after processing
        os.remove(file_path)

        # Return detections as JSON
        return jsonify(detections)

    except Exception as e:
        # Log the error and return an error response
        app.logger.error(f"Error during detection: {str(e)}")
        return jsonify({'error': f"Internal Server Error: {str(e)}"}), 500


if __name__ == '__main__':
    # Run the Flask application
    app.run(host='0.0.0.0', port=5000)
