from flask import Blueprint, request, jsonify
from services.vision_model import VisionManager

vision_bp = Blueprint('vision', __name__)
vision_ai = VisionManager()

@vision_bp.route('/api/vision', methods=['POST'])
def process_image():
    image_file = request.files.get('image')
    if not image_file:
        return jsonify({'error': 'No image file provided'}), 400
    predicted_ingredient = vision_ai.identify_ingredient(image_file)
    return jsonify({'status': 'success','label': predicted_ingredient}), 200