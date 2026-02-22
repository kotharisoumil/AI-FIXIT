import json
import os
from typing import Dict, List

import cv2
import numpy as np


class CVEngine:
    """
    Computer-vision backend with pluggable providers.

    Providers:
    - gemini (default): Gemini image understanding via Google GenAI API.
    - yolo: local Ultralytics model for offline fallback.
    """

    def __init__(self):
        self.provider = os.getenv("CV_PROVIDER", "gemini").strip().lower()
        self.model = None
        self.gemini_client = None
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

        if self.provider == "gemini":
            self._init_gemini()
        else:
            self.provider = "yolo"
            self._init_yolo()

    def _init_gemini(self) -> None:
        try:
            from google import genai
        except Exception:
            print("Warning: google-genai package not installed. Falling back to YOLO.")
            self.provider = "yolo"
            self._init_yolo()
            return

        api_key = os.getenv("GOOGLE_API_KEY", "").strip()
        if not api_key:
            print("Warning: GOOGLE_API_KEY missing. Falling back to YOLO.")
            self.provider = "yolo"
            self._init_yolo()
            return

        self.gemini_client = genai.Client(api_key=api_key)

    def _init_yolo(self) -> None:
        from ultralytics import YOLO

        model_path = "best.pt"
        if os.path.exists(model_path):
            self.model = YOLO(model_path)
        else:
            print(f"Warning: {model_path} not found. Using generic yolov8n.pt")
            self.model = YOLO("yolov8n.pt")

    def process_frame(self, image_bytes: bytes, target_object: str, action: str) -> Dict:
        if self.provider == "gemini":
            return self._process_frame_gemini(image_bytes, target_object, action)
        return self._process_frame_yolo(image_bytes, target_object, action)

    def _process_frame_gemini(self, image_bytes: bytes, target_object: str, action: str) -> Dict:
        from google.genai import types

        prompt = (
            "You are verifying one electronics repair step from a single camera frame. "
            "Return ONLY strict JSON with this schema: "
            '{"step_complete": boolean, "feedback": string, "detected": string[], "scene_summary": string}. '
            f"Current target object: '{target_object}'. Current action: '{action}'. "
            "Rules: if action is 'detect', step_complete=true only if target appears visible. "
            "If action is 'remove', step_complete=true only if target no longer appears visible. "
            "detected should be short labels like screw, screwdriver, battery, connector, phone_frame, hand."
        )

        try:
            response = self.gemini_client.models.generate_content(
                model=self.gemini_model,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    prompt,
                ],
            )
            parsed = self._parse_model_json(response.text or "{}")
            detected = parsed.get("detected", [])
            if not isinstance(detected, list):
                detected = []

            return {
                "step_complete": bool(parsed.get("step_complete", False)),
                "feedback": str(parsed.get("feedback", "No feedback")),
                "detected": [str(item) for item in detected],
                "scene_summary": str(parsed.get("scene_summary", "")),
                "provider": "gemini",
            }
        except Exception as exc:
            return {
                "step_complete": False,
                "feedback": f"Gemini error: {exc}",
                "detected": [],
                "scene_summary": "",
                "provider": "gemini",
            }

    def _process_frame_yolo(self, image_bytes: bytes, target_object: str, action: str) -> Dict:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        results = self.model(img)
        detected_objects: List[str] = []

        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                class_name = self.model.names[class_id]
                detected_objects.append(class_name)

        step_complete, feedback_message = self._basic_step_logic(
            detected_objects, target_object, action
        )
        scene_summary = (
            f"Detected: {', '.join(detected_objects)}"
            if detected_objects
            else "No known objects detected."
        )
        return {
            "step_complete": step_complete,
            "feedback": feedback_message,
            "detected": detected_objects,
            "scene_summary": scene_summary,
            "provider": "yolo",
        }

    def _basic_step_logic(
        self, detected_objects: List[str], target_object: str, action: str
    ):
        step_complete = False
        feedback_message = ""

        if action == "remove":
            if target_object not in detected_objects:
                step_complete = True
                feedback_message = f"Great! {target_object} removed."
            else:
                feedback_message = f"{target_object} is still detected."
        elif action == "detect":
            if target_object in detected_objects:
                step_complete = True
                feedback_message = f"{target_object} identified."
            else:
                feedback_message = f"Cannot find {target_object}. Please adjust camera."
        else:
            feedback_message = f"Unsupported action '{action}'."

        return step_complete, feedback_message

    def _parse_model_json(self, text: str) -> Dict:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            start = text.find("{")
            end = text.rfind("}")
            if start >= 0 and end > start:
                return json.loads(text[start : end + 1])
            raise
