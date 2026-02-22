from typing import List, Optional
from pydantic import BaseModel

class RepairStep(BaseModel):
    id: int
    instruction: str
    target_object: str  # The class name the CV model looks for (e.g., "battery", "screw")
    action: str         # "remove", "install", "tool_usage"
    image_reference: Optional[str] = None

# Mock Database of Repair Guides
IPHONE_REPAIR_STEPS = [
    RepairStep(
        id=1,
        instruction="Locate the two pentalobe screws at the bottom.",
        target_object="screw",
        action="detect" # Just need to see them to start
    ),
    RepairStep(
        id=2,
        instruction="Unscrew the bottom screws using the pentalobe screwdriver.",
        target_object="screw",
        action="remove" # Success when "screw" count decreases or becomes 0
    ),
    RepairStep(
        id=3,
        instruction="Use a suction cup to lift the screen.",
        target_object="screen_gap",
        action="detect"
    ),
    RepairStep(
        id=4,
        instruction="Disconnect the battery connector.",
        target_object="battery_connector",
        action="remove"
    )
]

class RepairSession:
    def __init__(self):
        self.current_step_index = 0
        self.steps = IPHONE_REPAIR_STEPS
        self.is_complete = False

    def get_current_step(self) -> RepairStep:
        if self.current_step_index >= len(self.steps):
            return None
        return self.steps[self.current_step_index]

    def advance_step(self):
        if self.current_step_index < len(self.steps) - 1:
            self.current_step_index += 1
        else:
            self.is_complete = True

    def reset(self):
        self.current_step_index = 0
        self.is_complete = False

# Global instance for the hackathon (in production, use a database per user session)
session_store = {
    "demo_user": RepairSession()
}