def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_list_catalog(client):
    response = client.get("/api/v1/catalog")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == "etablissements-sante"


def test_get_catalog_dataset_not_found(client):
    response = client.get("/api/v1/catalog/inexistant")
    assert response.status_code == 404


def test_list_health_establishments(client):
    response = client.get("/api/v1/health-establishments", params={"region": "National"})
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["facility_type"] == "Centre de santé"


def test_list_trade_flows(client):
    response = client.get("/api/v1/trade", params={"flow_type": "export"})
    assert response.status_code == 200
    body = response.json()
    assert body[0]["country"] == "Mali"


def test_list_population(client):
    response = client.get("/api/v1/population", params={"region": "National"})
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["count"] == 18126390


def test_list_indicators(client):
    response = client.get("/api/v1/indicators", params={"category": "Économie"})
    assert response.status_code == 200
    body = response.json()
    assert body[0]["indicator"] == "Croissance du PIB"


def test_download_dataset_csv(client):
    response = client.get("/api/v1/catalog/etablissements-sante/download", params={"format": "csv"})
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    assert "Centre de sant" in response.text
