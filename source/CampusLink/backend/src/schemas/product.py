from datetime import datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, BeforeValidator, Field, field_validator

from src.models.product import ProductStatus
from src.schemas.user import SellerInfo


# ECMAScript WhiteSpace + LineTerminator, matching String.prototype.trim().
# Python's default strip() differs, notably for U+FEFF and U+0085.
TITLE_TRIM_CHARACTERS = (
    "\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680"
    "\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007"
    "\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"
)


def normalize_product_title(value: object) -> str:
    if not isinstance(value, str):
        raise ValueError("商品名称必须为字符串")
    title = value.strip(TITLE_TRIM_CHARACTERS)
    # Supplementary characters occupy two units in browser string.length.
    length = sum(2 if ord(character) > 0xFFFF else 1 for character in title)
    if not 1 <= length <= 30:
        raise ValueError("商品名称应为 1–30 个字符，部分表情占 2 个字符")
    return title


class ProductCreate(BaseModel):
    title: Annotated[str, BeforeValidator(normalize_product_title)] = Field(
        description="Trim surrounding JavaScript whitespace; 1–30 UTF-16 code units."
    )
    description: str | None = Field(default=None, max_length=5000)
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    category: str = Field(min_length=1, max_length=50)
    image_url: str = Field(
        default="/assets/images/goods_math_book.png", max_length=500
    )
    location: str | None = Field(default=None, max_length=120)

    @field_validator("category")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("字段不能为空")
        return value


class ProductUpdate(BaseModel):
    # The default represents omission only. A supplied null runs the validator
    # and is rejected before the service can persist any field in the request.
    title: Annotated[str | None, BeforeValidator(normalize_product_title)] = Field(
        default=None,
        description="Omit to preserve the title; supplied values follow the creation rule.",
    )
    description: str | None = Field(default=None, max_length=5000)
    price: Decimal | None = Field(
        default=None, gt=0, max_digits=10, decimal_places=2
    )
    category: str | None = Field(default=None, min_length=1, max_length=50)
    image_url: str | None = Field(default=None, max_length=500)
    location: str | None = Field(default=None, max_length=120)
    status: ProductStatus | None = None


class ProductStatusUpdate(BaseModel):
    status: ProductStatus


class ProductRead(BaseModel):
    id: int
    title: str
    description: str | None = None
    price: float
    category: str
    image_url: str
    status: ProductStatus
    location: str | None = None
    seller: SellerInfo
    time_ago: str
    created_at: datetime


class ProductListQuery(BaseModel):
    keyword: str | None = None
    category: str | None = None
    status: ProductStatus | None = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

