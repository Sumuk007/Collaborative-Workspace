from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, Literal, List, Union
from datetime import datetime

class TextSpan(BaseModel):
    """A span of text with its own inline styling"""
    text: str
    styles: Optional[Dict[str, Any]] = {}
    
    class Config:
        json_schema_extra = {
            "example": {
                "text": "bold text",
                "styles": {"fontWeight": "bold", "color": "#FF0000"}
            }
        }

class TextBlock(BaseModel):
    """A block of text with character-level styling support"""
    type: Optional[Literal["paragraph", "heading1", "heading2", "heading3", "list-item", "code", "quote"]] = "paragraph"
    # Support both simple text (backwards compatible) and structured content (character-level)
    text: Optional[str] = None  # Simple text (deprecated, use content instead)
    content: Optional[List[TextSpan]] = None  # Character-level styled content
    styles: Optional[Dict[str, Any]] = {}  # Block-level styles
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v, info):
        # If content is provided, text should not be used
        if v is not None and info.data.get('text') is not None:
            raise ValueError('Cannot use both "text" and "content" fields. Use "content" for character-level styling.')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "paragraph",
                "content": [
                    {"text": "This is ", "styles": {}},
                    {"text": "bold", "styles": {"fontWeight": "bold"}},
                    {"text": " and ", "styles": {}},
                    {"text": "italic", "styles": {"fontStyle": "italic"}},
                    {"text": " text.", "styles": {}}
                ],
                "styles": {"textAlign": "left"}
            }
        }

class DocumentContent(BaseModel):
    """Structured document content with inline styles"""
    blocks: List[TextBlock] = []
    
    class Config:
        json_schema_extra = {
            "example": {
                "blocks": [
                    {
                        "type": "heading1",
                        "content": [
                            {"text": "Document Title", "styles": {"fontWeight": "bold", "fontSize": 24}}
                        ]
                    },
                    {
                        "type": "paragraph",
                        "content": [
                            {"text": "Normal text with ", "styles": {}},
                            {"text": "bold", "styles": {"fontWeight": "bold"}},
                            {"text": " and ", "styles": {}},
                            {"text": "italic", "styles": {"fontStyle": "italic"}},
                            {"text": " formatting.", "styles": {}}
                        ]
                    }
                ]
            }
        }

class DocumentStyles(BaseModel):
    """Global document styling configuration"""
    fontFamily: Optional[str] = Field(None, example="Arial")
    fontSize: Optional[int] = Field(None, ge=8, le=72, example=14)
    fontWeight: Optional[str] = Field(None, pattern="^(normal|bold|lighter|bolder|[1-9]00)$", example="normal")
    fontStyle: Optional[str] = Field(None, pattern="^(normal|italic|oblique)$", example="normal")
    textAlign: Optional[str] = Field(None, pattern="^(left|center|right|justify)$", example="left")
    lineHeight: Optional[float] = Field(None, ge=0.5, le=3.0, example=1.5)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$", example="#000000")
    backgroundColor: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$", example="#FFFFFF")
    
    class Config:
        extra = "allow"  # Allow additional custom styles

class DocumentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: Optional[str] = ""  # For backwards compatibility or simple text
    content_type: Optional[Literal["plain", "html", "markdown", "structured"]] = "plain"
    content_blocks: Optional[List[Dict[str, Any]]] = None  # Structured content with inline styles
    styles: Optional[Dict[str, Any]] = None  # Global document styles

class DocumentCreate(DocumentBase):
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if v:
            v = v.strip()
            if len(v) == 0:
                raise ValueError('Title cannot be empty or only whitespace')
            if len(v) > 255:
                raise ValueError('Title cannot exceed 255 characters')
        return v
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        if v and len(v) > 1000000:  # 1MB limit
            raise ValueError('Content cannot exceed 1MB')
        return v
    
    @field_validator('content_blocks')
    @classmethod
    def validate_content_blocks(cls, v):
        if v:
            if not isinstance(v, list):
                raise ValueError('Content blocks must be a list')
            # Validate each block
            for block in v:
                if not isinstance(block, dict):
                    raise ValueError('Each block must be a dictionary')
                
                # Check if using character-level content
                if 'content' in block:
                    if not isinstance(block['content'], list):
                        raise ValueError('Block content must be a list of text spans')
                    for span in block['content']:
                        if not isinstance(span, dict):
                            raise ValueError('Each text span must be a dictionary')
                        if 'text' not in span:
                            raise ValueError('Each text span must have a "text" field')
                elif 'text' not in block:
                    # Neither content nor text provided
                    raise ValueError('Each block must have either "text" or "content" field')
        return v
    
    @field_validator('styles')
    @classmethod
    def validate_styles(cls, v):
        if v:
            if not isinstance(v, dict):
                raise ValueError('Styles must be a valid JSON object')
        return v

class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = None
    content_type: Optional[Literal["plain", "html", "markdown", "structured"]] = None
    content_blocks: Optional[List[Dict[str, Any]]] = None
    styles: Optional[Dict[str, Any]] = None
    
    @field_validator('title')
    @classmethod
    def validate_title(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) == 0:
                raise ValueError('Title cannot be empty or only whitespace')
            if len(v) > 255:
                raise ValueError('Title cannot exceed 255 characters')
        return v
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        if v is not None and len(v) > 1000000:  # 1MB limit
            raise ValueError('Content cannot exceed 1MB')
        return v
    
    @field_validator('content_blocks')
    @classmethod
    def validate_content_blocks(cls, v):
        if v is not None:
            if not isinstance(v, list):
                raise ValueError('Content blocks must be a list')
        return v
    
    @field_validator('styles')
    @classmethod
    def validate_styles(cls, v):
        if v is not None:
            if not isinstance(v, dict):
                raise ValueError('Styles must be a valid JSON object')
        return v

class DocumentOut(DocumentBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentWithOwner(DocumentOut):
    owner_email: str
    owner_username: Optional[str] = None
