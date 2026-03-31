from abc import ABC, abstractmethod
class RecipeProvider(ABC):
    def __init__(self,name):
        self.name=name
    @abstractmethod
    def search(self,query,cuisine_type=None):
        pass
    @abstractmethod
    def _convert_to_recipe(self,raw_data):
        pass
