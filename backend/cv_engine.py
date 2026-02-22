import cv2
import numpy as np
from ultralytics import YOLO
import os

class CVEngine:
    def __init__(self):
        # Load the custom model if it exists, otherwise fallback to generic YOLO
        model_path = "best.pt" 
        if os.path.exists(model_path):
            self.model = YOLO(model_path)
        else:
            print(f"Warning: {model_path} not found. Using generic yolov8n.pt")
            self.model = YOLO("yolov8n.pt")

    def process_frame(self, image_bytes, target_object: str, action: str):
        """
        Analyzes the image to see if the target_object is in the state required by action.
        """
        # 1. Convert bytes to OpenCV format
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # 2. Run Inference
        results = self.model(img)
        detected_objects = []
        
        for result in results:
            for box in result.boxes:
                # Get the class name (e.g., 'screw', 'battery')
                class_id = int(box.cls[0])
                class_name = self.model.names[class_id]
                detected_objects.append(class_name)
        
        # 3. Verify Logic
        step_complete = False
        feedback_message = ""

        if action == "remove":
            # If we are removing a battery, we expect NOT to see it, 
            # or we expect to see an empty slot.
            if target_object not in detected_objects:
                step_complete = True
                feedback_message = f"Great! {target_object} removed."
            else:
                step_complete = False
                feedback_message = f"{target_object} is still detected."
        
        elif action == "detect":
            if target_object in detected_objects:
                step_complete = True
                feedback_message = f"{target_object} identified."
            else:
                feedback_message = f"Cannot find {target_object}. Please adjust camera."

        return {
            "step_complete": step_complete,
            "feedback": feedback_message,
            "detected": detected_objects
        }