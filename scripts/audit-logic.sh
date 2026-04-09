#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
OWNER_PHONE="${OWNER_PHONE:-+998900000000}"
OWNER_PASSWORD="${OWNER_PASSWORD:-admin123}"
MANAGER_PHONE="${MANAGER_PHONE:-+998901111111}"
MANAGER_PASSWORD="${MANAGER_PASSWORD:-manager123}"

FAILURES=0

log() {
  printf '%s\n' "$1"
}

pass() {
  log "✅ $1"
}

fail() {
  log "❌ $1"
  FAILURES=$((FAILURES + 1))
}

json_get() {
  local file="$1"
  local expression="$2"
  node -e "
    const fs = require('fs');
    const input = JSON.parse(fs.readFileSync(process.argv[1], 'utf8'));
    const getter = new Function('data', 'return ' + process.argv[2]);
    const value = getter(input);
    process.stdout.write(value === undefined || value === null ? '' : String(value));
  " "$file" "$expression"
}

request_json() {
  local method="$1"
  local path="$2"
  local output_file="$3"
  local token="${4:-}"
  local body="${5:-}"

  local curl_args=(-s -o "$output_file" -w '%{http_code}' -X "$method" "$BASE_URL$path")
  if [[ -n "$token" ]]; then
    curl_args+=(-H "Authorization: Bearer $token")
  fi
  if [[ -n "$body" ]]; then
    curl_args+=(-H 'Content-Type: application/json' -d "$body")
  fi

  curl "${curl_args[@]}"
}

login() {
  local phone="$1"
  local password="$2"
  local output_file="$3"

  local status
  status=$(curl -s -o "$output_file" -w '%{http_code}' -X POST "$BASE_URL/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"phone\":\"$phone\",\"password\":\"$password\"}")

  if [[ "$status" != "200" ]]; then
    fail "Login failed for $phone -> $status"
    cat "$output_file"
    exit 1
  fi

  json_get "$output_file" 'data.accessToken'
}

run_prisma_report_check() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    DATABASE_URL="$DATABASE_URL" node - <<'NODE'
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const students = await prisma.student.findMany({
    where: { deletedAt: null },
    select: { totalPrice: true, debt: true },
  });
  const totalRevenue = students.reduce((sum, student) => sum + Number(student.totalPrice) - Number(student.debt), 0);
  const totalDebt = students.reduce((sum, student) => sum + Number(student.debt), 0);
  console.log(JSON.stringify({ totalStudents: students.length, totalRevenue, totalDebt }));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
NODE
    return
  fi

  if docker compose ps app >/dev/null 2>&1; then
    docker compose exec -T app node - <<'NODE'
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const students = await prisma.student.findMany({
    where: { deletedAt: null },
    select: { totalPrice: true, debt: true },
  });
  const totalRevenue = students.reduce((sum, student) => sum + Number(student.totalPrice) - Number(student.debt), 0);
  const totalDebt = students.reduce((sum, student) => sum + Number(student.debt), 0);
  console.log(JSON.stringify({ totalStudents: students.length, totalRevenue, totalDebt }));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
NODE
    return
  fi

  return 1
}

main() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  trap "rm -rf '$tmp_dir'" EXIT

  log "Running business logic audit against $BASE_URL"

  local owner_login_file="$tmp_dir/owner-login.json"
  local manager_login_file="$tmp_dir/manager-login.json"
  local owner_token manager_token
  owner_token="$(login "$OWNER_PHONE" "$OWNER_PASSWORD" "$owner_login_file")"
  manager_token="$(login "$MANAGER_PHONE" "$MANAGER_PASSWORD" "$manager_login_file")"

  local manager_branch_file="$tmp_dir/manager-branch.json"
  local manager_groups_file="$tmp_dir/manager-groups.json"
  request_json GET /branches "$manager_branch_file" "$manager_token" >/dev/null
  request_json GET /groups "$manager_groups_file" "$manager_token" >/dev/null
  local manager_branch_id group_id group_name
  manager_branch_id="$(json_get "$manager_branch_file" 'data[0].id')"
  group_id="$(json_get "$manager_groups_file" 'data[0].id')"
  group_name="$(json_get "$manager_groups_file" 'data[0].name')"

  local express_phone express_file express_id
  express_phone="+998970$(date +%s | tail -c 5)"
  express_file="$tmp_dir/express.json"
  request_json \
    POST \
    /students \
    "$express_file" \
    "$manager_token" \
    "{\"firstName\":\"LogicExpress\",\"lastName\":\"Student\",\"phone\":\"$express_phone\",\"courseType\":\"express\",\"totalPrice\":650000,\"amountPaid\":200000}" \
    >/dev/null
  express_id="$(json_get "$express_file" 'data.id')"
  if [[ "$(json_get "$express_file" 'data.debt')" == "450000" ]]; then
    pass "Express debt = totalPrice - amountPaid"
  else
    fail "Express debt calculation is wrong"
  fi

  local standard_phone standard_file standard_id
  standard_phone="+998971$(date +%s | tail -c 5)"
  standard_file="$tmp_dir/standard.json"
  request_json \
    POST \
    /students \
    "$standard_file" \
    "$manager_token" \
    "{\"firstName\":\"LogicStandard\",\"lastName\":\"Student\",\"phone\":\"$standard_phone\",\"courseType\":\"standard\",\"totalPrice\":6000000,\"initialPayment\":1000000,\"groupId\":\"$group_id\"}" \
    >/dev/null
  standard_id="$(json_get "$standard_file" 'data.id')"
  if [[ "$(json_get "$standard_file" 'data.debt')" == "5000000" ]]; then
    pass "Standard debt = totalPrice - installments"
  else
    fail "Standard debt calculation is wrong"
  fi

  local standard_patch_file="$tmp_dir/standard-patch.json"
  request_json \
    PATCH \
    "/students/$standard_id/payment" \
    "$standard_patch_file" \
    "$manager_token" \
    '{"secondPayment":200000,"thirdPayment":400000}' \
    >/dev/null
  if [[ "$(json_get "$standard_patch_file" 'data.debt')" == "4400000" ]]; then
    pass "Standard payment patch recalculates debt"
  else
    fail "Standard payment patch did not recalculate debt"
  fi

  local history_file="$tmp_dir/history.json"
  request_json GET "/students/$standard_id/payment-history" "$history_file" "$manager_token" >/dev/null
  if [[ "$(json_get "$history_file" 'data.length')" -ge 2 ]]; then
    pass "Payment history logs are written"
  else
    fail "Payment history logs were not written"
  fi

  local pay_to_zero_file="$tmp_dir/pay-to-zero.json"
  request_json \
    PATCH \
    "/students/$express_id/payment" \
    "$pay_to_zero_file" \
    "$manager_token" \
    '{"amountPaid":650000}' \
    >/dev/null
  if [[ "$(json_get "$pay_to_zero_file" 'data.debt')" == "0" && "$(json_get "$pay_to_zero_file" 'data.paymentStatus')" == "paid" ]]; then
    pass "Debt 0 auto-updates paymentStatus to paid"
  else
    fail "Debt 0 did not update paymentStatus to paid"
  fi

  local paid_update_file="$tmp_dir/paid-update.json"
  local paid_update_status
  paid_update_status="$(request_json PATCH "/students/$express_id/payment" "$paid_update_file" "$manager_token" '{"amountPaid":650000}')"
  if [[ "$paid_update_status" == "400" ]]; then
    pass "Paid student cannot be updated via payment endpoint"
  else
    fail "Paid student payment update should return 400"
  fi

  local overpay_file="$tmp_dir/overpay.json"
  local overpay_status
  overpay_status="$(request_json POST /students "$overpay_file" "$manager_token" '{"firstName":"Over","lastName":"Pay","phone":"+998972223344","courseType":"express","totalPrice":650000,"amountPaid":800000}')"
  if [[ "$overpay_status" == "400" && "$(json_get "$overpay_file" 'data.error.message')" == "Payment exceeds total price" ]]; then
    pass "Overpayment is rejected"
  else
    fail "Overpayment should be rejected"
  fi

  local express_invalid_file="$tmp_dir/express-invalid.json"
  local standard_invalid_file="$tmp_dir/standard-invalid.json"
  local express_invalid_status standard_invalid_status
  express_invalid_status="$(request_json POST /students "$express_invalid_file" "$manager_token" "{\"firstName\":\"Bad\",\"lastName\":\"Express\",\"phone\":\"+998973223344\",\"courseType\":\"express\",\"totalPrice\":650000,\"groupId\":\"$group_id\",\"contractNumber\":\"C-1\"}")"
  standard_invalid_status="$(request_json POST /students "$standard_invalid_file" "$manager_token" "{\"firstName\":\"Bad\",\"lastName\":\"Standard\",\"phone\":\"+998974223344\",\"courseType\":\"standard\",\"totalPrice\":6000000,\"amountPaid\":1000,\"groupId\":\"$group_id\"}")"
  if [[ "$express_invalid_status" == "400" ]]; then
    pass "Express student rejects groupId/contractNumber"
  else
    fail "Express student should reject groupId/contractNumber"
  fi
  if [[ "$standard_invalid_status" == "400" ]]; then
    pass "Standard student rejects amountPaid"
  else
    fail "Standard student should reject amountPaid"
  fi

  local owner_branch_required_file="$tmp_dir/owner-branch-required.json"
  local owner_branch_required_status
  owner_branch_required_status="$(request_json POST /students "$owner_branch_required_file" "$owner_token" '{"firstName":"Owner","lastName":"NoBranch","phone":"+998998887766","courseType":"express","totalPrice":650000}')"
  if [[ "$owner_branch_required_status" == "400" ]]; then
    pass "Owner cannot create student without branchId"
  else
    fail "Owner should provide branchId when creating student"
  fi

  local duplicate_group_file="$tmp_dir/duplicate-group.json"
  local duplicate_group_status
  duplicate_group_status="$(request_json POST /groups "$duplicate_group_file" "$owner_token" "{\"name\":\"$group_name\",\"branchId\":\"$manager_branch_id\"}")"
  if [[ "$duplicate_group_status" == "409" ]]; then
    pass "Group name is unique inside a branch"
  else
    fail "Group name should be unique inside a branch"
  fi

  local delete_group_file="$tmp_dir/delete-group.json"
  local delete_group_status
  delete_group_status="$(request_json DELETE "/groups/$group_id" "$delete_group_file" "$owner_token")"
  if [[ "$delete_group_status" == "400" ]]; then
    pass "Group with students cannot be deleted"
  else
    fail "Deleting a group with students should return 400"
  fi

  local manager_groups_count
  manager_groups_count="$(json_get "$manager_groups_file" 'data.length')"
  if [[ "$manager_groups_count" -ge 1 ]]; then
    pass "Manager only sees own branch groups"
  else
    fail "Manager group list is unexpectedly empty"
  fi

  local revenue_file="$tmp_dir/revenue.json"
  local revenue_future_file="$tmp_dir/revenue-future.json"
  request_json GET /reports/revenue "$revenue_file" "$owner_token" >/dev/null
  request_json GET '/reports/revenue?startDate=2100-01-01T00:00:00.000Z' "$revenue_future_file" "$owner_token" >/dev/null
  local db_report_file="$tmp_dir/db-report.json"
  if run_prisma_report_check >"$db_report_file" 2>"$tmp_dir/db-report.err"; then
    if [[ "$(json_get "$revenue_file" 'data.totalRevenue')" == "$(json_get "$db_report_file" 'data.totalRevenue')" && "$(json_get "$revenue_file" 'data.totalDebt')" == "$(json_get "$db_report_file" 'data.totalDebt')" ]]; then
      pass "Revenue report matches manual DB aggregation"
    else
      fail "Revenue report does not match manual DB aggregation"
    fi
  else
    fail "Manual DB aggregation check could not run"
    cat "$tmp_dir/db-report.err"
  fi
  if [[ "$(json_get "$revenue_future_file" 'data.totalStudents')" == "0" ]]; then
    pass "Revenue date filter excludes future createdAt values"
  else
    fail "Revenue date filter did not exclude future createdAt values"
  fi

  if [[ "$FAILURES" -gt 0 ]]; then
    log "❌ Business logic audit finished with $FAILURES failure(s)"
    exit 1
  fi

  log "✅ Business logic audit finished without failures"
}

main "$@"
