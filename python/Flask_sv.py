from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from ultralytics import YOLO
import cv2
import os

app = Flask(__name__)
CORS(app)

# Load YOLO model
model = YOLO("F:/Quang/best.pt")  # Đường dẫn đến file mô hình YOLO

# Create upload directory
UPLOAD_FOLDER = './uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/uploads/<filename>', methods=['GET'])
def serve_file(filename):
    """
    Serve a file from the uploads folder.
    """
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/detect', methods=['POST'])
def detect_objects():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        # Perform object detection
        results = model(file_path)

        # Load the image for drawing bounding boxes
        image = cv2.imread(file_path)

        # Extract detections
        detections = []
        for result in results:
            for box in result.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])  # Convert to int
                confidence = float(box.conf[0])
                name = result.names[int(box.cls[0])]

                # Draw bounding box
                cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 255), 15)

                # Thêm tên đối tượng và độ tin cậy, cũng hiển thị bằng màu đỏ
                cv2.putText(image, f"{name} ({confidence:.2f})", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 10, (0, 0, 255), 6)

                detections.append({
                    "x1": x1, "y1": y1, "x2": x2, "y2": y2,
                    "confidence": confidence, "name": name
                })

        # Save the annotated image
        annotated_image_path = os.path.join(UPLOAD_FOLDER, "annotated_" + file.filename)
        cv2.imwrite(annotated_image_path, image)

        # Remove the original file after processing
        os.remove(file_path)

        # Return URL of the annotated image
        return jsonify({
            "detections": detections,
            "image_url": f"uploads/annotated_{file.filename}"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
