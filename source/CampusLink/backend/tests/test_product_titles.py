"""Sprint 2 title contract: Unicode boundaries and persisted API behavior."""

from contextlib import contextmanager

import pytest
from pydantic import ValidationError

from src.database.session import get_db
from src.main import app
from src.models.product import Product
from src.schemas.product import ProductCreate, ProductUpdate


PRODUCT = {"title": "Original title", "price": 25.5, "category": "教材"}
VALID_TITLES = [
    ("A", "A"),
    ("A" * 30, "A" * 30),
    ("  Valid title  ", "Valid title"),
    ("\ufeff " + "A" * 30 + "\u3000", "A" * 30),
    ("A  B", "A  B"),
    ("中" * 30, "中" * 30),
    ("😀" * 15, "😀" * 15),
    ("A" * 28 + "😀", "A" * 28 + "😀"),
    # ECMAScript trim preserves these, unlike Python str.strip().
    ("\u0085A\u0085", "\u0085A\u0085"),
    ("\u001cA\u001c", "\u001cA\u001c"),
]
INVALID_TITLES = [
    "A" * 31, "", "   ", "\t\n\r", "\u00a0", "\u3000", "\ufeff",
    "😀" * 16, "A" * 29 + "😀", None, 123, True, [], {},
]
JS_TRIM_CHARACTERS = [
    "\t", "\n", "\v", "\f", "\r", " ", "\u00a0", "\u1680",
    *[chr(code) for code in range(0x2000, 0x200B)],
    "\u2028", "\u2029", "\u202f", "\u205f", "\u3000", "\ufeff",
]


@pytest.mark.parametrize("model", [ProductCreate, ProductUpdate])
@pytest.mark.parametrize("supplied,expected", VALID_TITLES)
def test_title_schema_normalizes_before_counting(model, supplied, expected):
    result = model.model_validate({**PRODUCT, "title": supplied})
    assert result.title == expected


@pytest.mark.parametrize("model", [ProductCreate, ProductUpdate])
@pytest.mark.parametrize("supplied", INVALID_TITLES)
def test_title_schema_rejects_invalid_supplied_values(model, supplied):
    with pytest.raises(ValidationError) as error:
        model.model_validate({**PRODUCT, "title": supplied})
    assert error.value.errors()[0]["loc"] == ("title",)


@pytest.mark.parametrize("whitespace", JS_TRIM_CHARACTERS)
def test_title_trims_each_ecmascript_whitespace_character(whitespace):
    supplied = whitespace + "A" * 30 + whitespace
    assert ProductCreate(**{**PRODUCT, "title": supplied}).title == "A" * 30
    assert ProductUpdate(title=supplied).title == "A" * 30
    with pytest.raises(ValidationError):
        ProductUpdate(title=whitespace)


def test_title_is_required_for_creation_but_update_omission_is_preserved():
    with pytest.raises(ValidationError):
        ProductCreate(price=25.5, category="教材")
    assert ProductUpdate(price=19.8).model_dump(exclude_unset=True) == {
        "price": ProductUpdate(price=19.8).price,
    }


def create_product(client, auth_header):
    response = client.post("/api/products", headers=auth_header, json=PRODUCT)
    assert response.status_code == 201
    return response.json()["data"]


def assert_title_error(response):
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == 422
    assert isinstance(body["message"], str)
    assert any(error["field"] == "title" for error in body["data"])


@pytest.mark.parametrize("supplied,expected", VALID_TITLES[:8])
def test_create_and_update_persist_the_same_normalized_title(
    client, auth_header, supplied, expected,
):
    created = client.post(
        "/api/products", headers=auth_header, json={**PRODUCT, "title": supplied},
    )
    assert created.status_code == 201
    product = created.json()["data"]
    assert product["title"] == expected
    product_id = product["id"]
    # Reset to a different title so update normalization is independently checked.
    assert client.put(
        f"/api/products/{product_id}", headers=auth_header,
        json={"title": "Reset title"},
    ).status_code == 200
    updated = client.put(
        f"/api/products/{product_id}", headers=auth_header,
        json={"title": supplied, "price": 19.8},
    )
    assert updated.status_code == 200
    assert updated.json()["data"]["title"] == expected
    stored = client.get(f"/api/products/{product_id}").json()["data"]
    assert stored["title"] == expected
    assert stored["price"] == 19.8


@pytest.mark.parametrize("supplied", INVALID_TITLES)
def test_invalid_title_rejects_creation_and_entire_update(
    client, auth_header, supplied,
):
    product = create_product(client, auth_header)
    before = client.get("/api/products").json()["data"]
    assert_title_error(client.post(
        "/api/products", headers=auth_header, json={**PRODUCT, "title": supplied},
    ))
    assert len(client.get("/api/products").json()["data"]) == len(before)
    product_id = product["id"]
    assert_title_error(client.put(
        f"/api/products/{product_id}", headers=auth_header,
        json={"title": supplied, "price": 19.8, "description": "Must not persist"},
    ))
    stored = client.get(f"/api/products/{product_id}").json()["data"]
    for field in ("title", "price", "description", "category", "image_url", "location", "status"):
        assert stored[field] == product[field]


def test_missing_creation_title_uses_existing_error_envelope(client, auth_header):
    assert_title_error(client.post(
        "/api/products", headers=auth_header, json={"price": 25.5, "category": "教材"},
    ))


@pytest.mark.parametrize("legacy_title", ["L" * 40, "  Legacy title  ", "   "])
def test_price_only_update_preserves_legacy_title_exactly(
    client, auth_header, legacy_title,
):
    product = create_product(client, auth_header)
    product_id = product["id"]
    # Insert a historical value directly; the new API must not create it.
    with contextmanager(app.dependency_overrides[get_db])() as db:
        db.get(Product, product_id).title = legacy_title
        db.commit()
    assert client.get(f"/api/products/{product_id}").json()["data"]["title"] == legacy_title
    response = client.put(
        f"/api/products/{product_id}", headers=auth_header, json={"price": 19.8},
    )
    assert response.status_code == 200
    stored = client.get(f"/api/products/{product_id}").json()["data"]
    assert stored["title"] == legacy_title
    assert stored["price"] == 19.8
    if not legacy_title.strip() or len(legacy_title) > 30:
        assert_title_error(client.put(
            f"/api/products/{product_id}", headers=auth_header,
            json={"title": legacy_title, "price": 1},
        ))
        after = client.get(f"/api/products/{product_id}").json()["data"]
        assert after["title"] == legacy_title
        assert after["price"] == 19.8


def test_price_only_update_preserves_valid_title(client, auth_header):
    product = create_product(client, auth_header)
    response = client.put(
        f"/api/products/{product['id']}", headers=auth_header, json={"price": 19.8},
    )
    assert response.status_code == 200
    assert response.json()["data"]["title"] == PRODUCT["title"]
