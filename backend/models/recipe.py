class Recipe:
    def __init__(self,id,title,image,url,source="unknown"):
        self.id=id
        self.title=title
        self.image=image
        self.url=url
        self.source=source

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "image": self.image,
            "url": self.url,
            "source": self.source
        }
