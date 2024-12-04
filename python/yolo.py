import onnx
import json

# Tải mô hình ONNX
onnx_model = onnx.load("F:/Quang/best.onnx")

# Chuyển mô hình ONNX thành dictionary
model_dict = {
    "ir_version": onnx_model.ir_version,
    "producer_name": onnx_model.producer_name,
    "graph": onnx_model.graph
}

# Lưu cấu trúc mô hình vào file JSON
with open('model.json', 'w') as json_file:
    json.dump(model_dict, json_file, indent=4)