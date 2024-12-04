from ultralytics import YOLO

model = YOLO("F:/Quang/best.pt")
model.export(format='saved_model')
