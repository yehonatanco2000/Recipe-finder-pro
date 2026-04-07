import os
from dotenv import load_dotenv
from transformers import pipeline, CLIPTokenizer
from PIL import Image

load_dotenv()

class VisionManager:
    def __init__(self):
        print("Loading Zero-Shot AI Model (CLIP)... Please wait!")
        
        # מושכים את תצורת המודל מקובץ סביבה לפי סטנדרט אחידות הקוד
        model_name = os.getenv('VISION_MODEL_NAME', 'openai/clip-vit-base-patch32')
        
        # 1. טעינת מנתח הטקסט באופן ספציפי ופיזי (מונע משגיאת ה-AutoTokenizer לקרוס בווינדוס)
        safe_tokenizer = CLIPTokenizer.from_pretrained(model_name)
        
        # 2. הזרקת המנתח הבטוח ישירות לתוך בניית הצינור
        self.classifier = pipeline("zero-shot-image-classification", model=model_name, tokenizer=safe_tokenizer)

        # הרשימה הגדולה אדריכלית! ~200 מצרכים שונים באנגלית יחידה (ללא משפטים) כדי שאדמם יבין.
        self.fridge_ingredients = [
            # Vegetables
            "tomato", "onion", "garlic", "potato", "carrot", "bell pepper", "broccoli", 
            "cauliflower", "cucumber", "zucchini", "eggplant", "spinach", "lettuce", 
            "cabbage", "mushroom", "celery", "asparagus", "sweet potato", "green bean", 
            "peas", "corn", "radish", "turnip", "artichoke", "brussels sprout", "leek",
            "okra", "butternut squash", "pumpkin", "shallot", "jalapeno", "chili pepper",
            # Fruits (Many used in cooking)
            "apple", "banana", "orange", "lemon", "lime", "strawberry", "blueberry", 
            "raspberry", "blackberry", "grape", "watermelon", "cantaloupe", "honeydew", 
            "peach", "nectarine", "plum", "cherry", "pear", "pineapple", "mango", 
            "papaya", "kiwi", "pomegranate", "coconut", "avocado", "olive", "grapefruit",
            # Meat & Poultry
            "chicken breast", "chicken thigh", "chicken wing", "ground beef", "beef steak", 
            "beef roast", "pork chop", "pork loin", "bacon", "sausage", "lamb chop", 
            "ground turkey", "turkey breast", "duck", "salami", "pepperoni", "ham",
            # Seafood
            "salmon", "tuna", "cod", "tilapia", "trout", "shrimp", "crab", "lobster", 
            "scallop", "mussel", "clam", "oyster", "squid", "octopus",
            # Dairy & Eggs
            "egg", "butter", "milk", "cheddar cheese", "mozzarella cheese", "parmesan cheese", 
            "swiss cheese", "feta cheese", "cream cheese", "sour cream", "yogurt", "heavy cream",
            # Carbs, Grains & Breads
            "rice", "brown rice", "pasta", "spaghetti", "macaroni", "noodles", "bread", 
            "tortilla", "bagel", "pita", "oats", "quinoa", "barley", "flour", "cornmeal",
            # Fats & Oils
            "olive oil", "vegetable oil", "canola oil", "coconut oil", "sesame oil", 
            "peanut butter", "almond butter", "mayonnaise",
            # Spices & Herbs
            "salt", "black pepper", "cinnamon", "cumin", "paprika", "oregano", "basil", 
            "parsley", "cilantro", "thyme", "rosemary", "mint", "dill", "nutmeg", "ginger", 
            "turmeric", "chili powder", "cayenne pepper", "coriander", "cloves", "saffron",
            # Nuts & Seeds
            "almond", "walnut", "pecan", "cashew", "pistachio", "peanut", "sunflower seed", 
            "pumpkin seed", "chia seed", "flaxseed", "sesame seed",
            # Sweeteners & Baking
            "sugar", "brown sugar", "honey", "maple syrup", "chocolate", "cocoa powder", 
            "baking soda", "baking powder", "yeast", "vanilla extract",
            # Condiments & Sauces
            "soy sauce", "ketchup", "mustard", "vinegar", "balsamic vinegar", "hot sauce", 
            "worcestershire sauce", "fish sauce", "salsa", "barbecue sauce"
        ]

    def identify_ingredient(self, image_path):
        img = Image.open(image_path)
        
        # מחפש בדיוק את המילה שהכי מתאימה מתוך ה-200.
        results = self.classifier(img, candidate_labels=self.fridge_ingredients)
        
        # התוצאה חוזרת ממדורגת, אנחנו לוקחים את [0] שזה הציון הגבוה ביותר
        best_match = results[0]['label']
        return best_match

