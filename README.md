# Query Engine API

A REST API that provides advanced filtering, sorting, pagination and natural language search over a dataset of 2035 profiles.

## Base URL
`https://query-engine-production.up.railway.app`

## Endpoints

### GET /api/profiles
Returns paginated profiles with optional filters and sorting.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| gender | string | Filter by gender (male/female) |
| age_group | string | Filter by age group (child/teenager/adult/senior) |
| country_id | string | Filter by country code (NG, KE, etc.) |
| min_age | number | Minimum age filter |
| max_age | number | Maximum age filter |
| min_gender_probability | number | Minimum gender probability (0-1) |
| min_country_probability | number | Minimum country probability (0-1) |
| sort_by | string | Sort field (age, created_at, gender_probability) |
| order | string | Sort order (asc, desc) |
| page | number | Page number (default: 1) |
| limit | number | Results per page (default: 10, max: 50) |

**Example:**
**Response:**
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "total": 64,
    "page": 1,
    "limit": 10,
    "total_pages": 7
  }
}
```

---

### GET /api/profiles/search
Natural language search endpoint.

**Query Parameters:**
| Parameter | Description |
|-----------|-------------|
| q | Plain English search query |
| page | Page number |
| limit | Results per page |

**How Natural Language Parsing Works:**

The parser detects 4 things from the query:

1. **Gender** — detects words like "males", "females", "men", "women"
2. **Age group** — detects "young", "adult", "teenager", "senior", "child"
3. **Age range** — detects "above 30", "below 20", "between 20 and 40"
4. **Country** — detects "from nigeria", "from kenya" and maps to ISO codes

**Supported query examples:**
- `young males` → gender=male, min_age=16, max_age=24
- `females above 30` → gender=female, min_age=30
- `people from nigeria` → country_id=NG
- `adult males from kenya` → gender=male, age_group=adult, country_id=KE
- `male and female teenagers above 17` → age_group=teenager, min_age=17

**Example:**
**Response:**
```json
{
  "status": "success",
  "data": [...],
  "pagination": {
    "total": 9,
    "page": 1,
    "limit": 10,
    "total_pages": 1
  }
}
```

---

## Natural Language Parsing Approach

The parser uses keyword detection and regex patterns — no AI or external services.

**Step 1 — Gender detection:**
Regex matches gender words. If both male and female words appear, no gender filter is applied.

**Step 2 — Age group detection:**
Keywords like "young" (16-24), "adult", "teenager", "senior", "child" map to age filters.

**Step 3 — Age range detection:**
Regex patterns detect "above N", "below N", "between N and M", "aged N to M".

**Step 4 — Country detection:**
"from <country>" pattern extracts country name and maps it to ISO 3166 country code using a lookup table.

## Setup

```bash
npm install
npm run seed   # seed 2026 profiles
npm start
```