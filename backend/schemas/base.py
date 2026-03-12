from pydantic import BaseModel

class ConfigBase(BaseModel):
    class Config:
        from_attributes = True
