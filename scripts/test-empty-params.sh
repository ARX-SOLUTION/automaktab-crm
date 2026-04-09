#!/bin/bash
set -euo pipefail

BASE="${BASE:-http://localhost:3000}"
OWNER_PHONE="${OWNER_PHONE:-+998900000000}"
OWNER_PASSWORD="${OWNER_PASSWORD:-admin123}"
MANAGER_PHONE="${MANAGER_PHONE:-+998901111111}"
MANAGER_PASSWORD="${MANAGER_PASSWORD:-manager123}"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to run this script."
  exit 1
fi

OWNER_COOKIE_JAR="$(mktemp)"
MANAGER_COOKIE_JAR="$(mktemp)"
trap 'rm -f "$OWNER_COOKIE_JAR" "$MANAGER_COOKIE_JAR"' EXIT

PASS=0
FAIL=0

check() {
  local desc="$1"
  local expected="$2"
  local actual="$3"

  if [ "$actual" -eq "$expected" ]; then
    echo "  PASS  $desc (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $desc - expected $expected, got $actual"
    FAIL=$((FAIL + 1))
  fi
}

echo "Logging in..."

OWNER_TOKEN="$(
  curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"$OWNER_PHONE\",\"password\":\"$OWNER_PASSWORD\"}" | jq -r '.accessToken // .token'
)"

MANAGER_TOKEN="$(
  curl -s -X POST "$BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"phone\":\"$MANAGER_PHONE\",\"password\":\"$MANAGER_PASSWORD\"}" | jq -r '.accessToken // .token'
)"

curl -s -o /dev/null -c "$OWNER_COOKIE_JAR" -X POST "$BASE/app/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "phone=$OWNER_PHONE" \
  --data-urlencode "password=$OWNER_PASSWORD"

curl -s -o /dev/null -c "$MANAGER_COOKIE_JAR" -X POST "$BASE/app/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "phone=$MANAGER_PHONE" \
  --data-urlencode "password=$MANAGER_PASSWORD"

AUTH_OWNER="Authorization: Bearer $OWNER_TOKEN"
AUTH_MANAGER="Authorization: Bearer $MANAGER_TOKEN"

echo
echo "=== API EMPTY PARAMS ==="

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_OWNER" "$BASE/students?courseType=&branchId=&status=&search=&page=&limit=")
check "GET /students (owner, all empty params)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_MANAGER" "$BASE/students?courseType=&branchId=&status=&search=")
check "GET /students (manager, all empty params)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_OWNER" "$BASE/students?courseType=express&branchId=&status=&page=&limit=")
check "GET /students (express + empty filters)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_OWNER" "$BASE/users?branchId=&search=")
check "GET /users (empty branchId/search)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_OWNER" "$BASE/groups?branchId=")
check "GET /groups (empty branchId)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_OWNER" "$BASE/reports/revenue?branchId=&courseType=&startDate=&endDate=")
check "GET /reports/revenue (all empty params)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_OWNER" "$BASE/reports/dashboard?branchId=&courseType=")
check "GET /reports/dashboard (ignored empty params)" 200 "$STATUS"

echo
echo "=== SSR EMPTY PARAMS ==="

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$OWNER_COOKIE_JAR" "$BASE/app/dashboard?branchId=&status=&search=")
check "GET /app/dashboard (owner, empty filters)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$OWNER_COOKIE_JAR" "$BASE/app/students?branchId=&status=&search=&courseType=&page=&limit=")
check "GET /app/students (owner, empty filters)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$OWNER_COOKIE_JAR" "$BASE/app/managers?branchId=&search=")
check "GET /app/managers (owner, empty filters)" 200 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b "$OWNER_COOKIE_JAR" "$BASE/app/reports?branchId=&courseType=&startDate=&endDate=")
check "GET /app/reports (owner, empty filters)" 200 "$STATUS"

echo
echo "=== INVALID PARAMS ==="

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_OWNER" "$BASE/students?courseType=INVALID")
check "GET /students (invalid courseType)" 400 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_OWNER" "$BASE/students?branchId=not-a-uuid")
check "GET /students (invalid branchId)" 400 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_OWNER" "$BASE/students?page=-5")
check "GET /students (negative page)" 400 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_OWNER" "$BASE/students?status=INVALID")
check "GET /students (invalid status)" 400 "$STATUS"

echo
echo "=== OWNER-ONLY SECURITY ==="

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_MANAGER" "$BASE/reports/revenue")
check "GET /reports/revenue (manager forbidden)" 403 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_MANAGER" "$BASE/reports/dashboard")
check "GET /reports/dashboard (manager forbidden)" 403 "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "$AUTH_MANAGER" "$BASE/groups/overview")
check "GET /groups/overview (manager forbidden)" 403 "$STATUS"

echo
echo "===================="
echo "PASSED: $PASS"
echo "FAILED: $FAIL"
echo "===================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
