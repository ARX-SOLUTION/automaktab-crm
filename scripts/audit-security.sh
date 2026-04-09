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

assert_status() {
  local label="$1"
  local expected="$2"
  local actual="$3"

  if [[ "$actual" == "$expected" ]]; then
    pass "$label -> $actual"
  else
    fail "$label -> expected $expected, got $actual"
  fi
}

request_json() {
  local method="$1"
  local path="$2"
  local output_file="$3"
  local token="${4:-}"
  local body="${5:-}"
  shift $(( $# > 5 ? 5 : $# ))

  local extra_args=("$@")
  local curl_args=(-s -o "$output_file" -w '%{http_code}' -X "$method" "$BASE_URL$path")

  if [[ -n "$token" ]]; then
    curl_args+=(-H "Authorization: Bearer $token")
  fi

  if [[ -n "$body" ]]; then
    curl_args+=(-H 'Content-Type: application/json' -d "$body")
  fi

  curl_args+=("${extra_args[@]}")
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

run_password_hash_check() {
  if [[ -n "${DATABASE_URL:-}" ]]; then
    DATABASE_URL="$DATABASE_URL" node - <<'NODE'
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const owner = await prisma.user.findFirst({
    where: { role: 'owner', deletedAt: null },
    select: { password: true },
  });
  const manager = await prisma.user.findFirst({
    where: { role: 'manager', deletedAt: null },
    select: { password: true },
  });
  console.log(
    JSON.stringify({
      ownerHashed: /^\$2[aby]\$/.test(owner?.password ?? ''),
      managerHashed: /^\$2[aby]\$/.test(manager?.password ?? ''),
    }),
  );
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
  const owner = await prisma.user.findFirst({
    where: { role: 'owner', deletedAt: null },
    select: { password: true },
  });
  const manager = await prisma.user.findFirst({
    where: { role: 'manager', deletedAt: null },
    select: { password: true },
  });
  console.log(
    JSON.stringify({
      ownerHashed: /^\$2[aby]\$/.test(owner?.password ?? ''),
      managerHashed: /^\$2[aby]\$/.test(manager?.password ?? ''),
    }),
  );
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
NODE
    return
  fi

  log "❌ Password hash check skipped: DATABASE_URL or running docker compose app required"
  FAILURES=$((FAILURES + 1))
}

main() {
  local tmp_dir
  tmp_dir="$(mktemp -d)"
  trap "rm -rf '$tmp_dir'" EXIT

  log "Running security audit against $BASE_URL"

  local owner_login_file="$tmp_dir/owner-login.json"
  local manager_login_file="$tmp_dir/manager-login.json"
  local owner_token manager_token
  owner_token="$(login "$OWNER_PHONE" "$OWNER_PASSWORD" "$owner_login_file")"
  manager_token="$(login "$MANAGER_PHONE" "$MANAGER_PASSWORD" "$manager_login_file")"

  local jwt_check_file="$tmp_dir/jwt-check.json"
  node - <<'NODE' "$owner_token" >"$jwt_check_file"
const token = process.argv[2];
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
const keys = Object.keys(payload).sort();
const sensitive = ['password', 'hash', 'email', 'fullName'].filter((key) => key in payload);
console.log(JSON.stringify({ keys, sensitive }));
NODE
  local jwt_sensitive jwt_keys
  jwt_sensitive="$(json_get "$jwt_check_file" 'data.sensitive.length')"
  jwt_keys="$(json_get "$jwt_check_file" 'data.keys.join(",")')"
  if [[ "$jwt_sensitive" == "0" && "$jwt_keys" == "branchId,exp,iat,id,role" ]]; then
    pass "JWT payload only contains id, role, branchId, iat, exp"
  else
    fail "JWT payload contains unexpected fields -> $jwt_keys"
  fi

  local health_file="$tmp_dir/health.json"
  local tokenless_me_file="$tmp_dir/tokenless-me.json"
  assert_status "GET /health is public" "200" "$(request_json GET /health "$health_file")"
  assert_status "GET /auth/me without token is blocked" "401" "$(request_json GET /auth/me "$tokenless_me_file")"

  local branches_file="$tmp_dir/branches.json"
  request_json GET /branches "$branches_file" "$owner_token" >/dev/null
  local other_branch_id
  other_branch_id="$(json_get "$branches_file" 'data.find((branch) => branch.name === "Samarqand").id')"

  local other_student_file="$tmp_dir/other-student.json"
  request_json GET "/students?courseType=express&limit=1&branchId=$other_branch_id" "$other_student_file" "$owner_token" >/dev/null
  local other_student_id
  other_student_id="$(json_get "$other_student_file" 'data.data[0].id')"

  local manager_other_get_file="$tmp_dir/manager-other-get.json"
  local manager_other_patch_file="$tmp_dir/manager-other-patch.json"
  local manager_other_delete_file="$tmp_dir/manager-other-delete.json"
  assert_status \
    "Manager cannot GET another branch student" \
    "403" \
    "$(request_json GET "/students/$other_student_id" "$manager_other_get_file" "$manager_token")"
  assert_status \
    "Manager cannot PATCH another branch student" \
    "403" \
    "$(request_json PATCH "/students/$other_student_id" "$manager_other_patch_file" "$manager_token" '{"notes":"forbidden"}')"
  assert_status \
    "Manager cannot DELETE another branch student" \
    "403" \
    "$(request_json DELETE "/students/$other_student_id" "$manager_other_delete_file" "$manager_token")"

  local manager_reports_file="$tmp_dir/manager-reports.json"
  local manager_branch_post_file="$tmp_dir/manager-branch-post.json"
  local manager_user_post_file="$tmp_dir/manager-user-post.json"
  local manager_branch_file="$tmp_dir/manager-branch.json"
  request_json GET /branches "$manager_branch_file" "$manager_token" >/dev/null
  local manager_branch_id
  manager_branch_id="$(json_get "$manager_branch_file" 'data[0].id')"
  assert_status \
    "Manager cannot access /reports/revenue" \
    "403" \
    "$(request_json GET /reports/revenue "$manager_reports_file" "$manager_token")"
  assert_status \
    "Manager cannot POST /branches" \
    "403" \
    "$(request_json POST /branches "$manager_branch_post_file" "$manager_token" '{"name":"Blocked Branch","address":"Nowhere"}')"
  assert_status \
    "Manager cannot POST /users" \
    "403" \
    "$(request_json POST /users "$manager_user_post_file" "$manager_token" "{\"fullName\":\"Blocked User\",\"phone\":\"+998991100011\",\"password\":\"manager123\",\"branchId\":\"$manager_branch_id\"}")"

  local temp_phone temp_name branch_override_body branch_override_id branch_override_branch_id
  temp_phone="+998977$(date +%s | tail -c 5)"
  temp_name="AuditSecurity$(date +%s)"
  branch_override_body="$tmp_dir/branch-override.json"
  assert_status \
    "Manager can create student in own branch even if foreign branchId is sent" \
    "201" \
    "$(request_json POST /students "$branch_override_body" "$manager_token" "{\"firstName\":\"$temp_name\",\"lastName\":\"Student\",\"phone\":\"$temp_phone\",\"courseType\":\"express\",\"totalPrice\":650000,\"amountPaid\":100000,\"branchId\":\"$other_branch_id\"}")"
  branch_override_id="$(json_get "$branch_override_body" 'data.id')"
  branch_override_branch_id="$(json_get "$branch_override_body" 'data.branch.id')"
  if [[ "$branch_override_branch_id" == "$manager_branch_id" ]]; then
    pass "Manager branchId override is ignored on student create"
  else
    fail "Manager was able to override branchId on student create"
  fi

  local delete_body="$tmp_dir/delete-temp.json"
  local get_after_delete_body="$tmp_dir/get-after-delete.json"
  local search_after_delete_body="$tmp_dir/search-after-delete.json"
  assert_status \
    "Soft delete student returns 204" \
    "204" \
    "$(request_json DELETE "/students/$branch_override_id" "$delete_body" "$manager_token")"
  assert_status \
    "Soft deleted student GET returns 404" \
    "404" \
    "$(request_json GET "/students/$branch_override_id" "$get_after_delete_body" "$manager_token")"
  request_json GET "/students?courseType=express&search=$temp_phone" "$search_after_delete_body" "$owner_token" >/dev/null
  if [[ "$(json_get "$search_after_delete_body" 'data.meta.total')" == "0" ]]; then
    pass "Soft deleted student is hidden from search results"
  else
    fail "Soft deleted student still appears in search results"
  fi

  local allowed_origin_headers="$tmp_dir/cors-allowed.txt"
  local blocked_origin_headers="$tmp_dir/cors-blocked.txt"
  curl -s -D "$allowed_origin_headers" -o /dev/null -H 'Origin: http://localhost:5173' "$BASE_URL/health"
  curl -s -D "$blocked_origin_headers" -o /dev/null -H 'Origin: https://evil.example' "$BASE_URL/health"
  if grep -qi '^access-control-allow-origin: http://localhost:5173' "$allowed_origin_headers"; then
    pass "CORS allows configured frontend origin"
  else
    fail "CORS did not allow configured frontend origin"
  fi
  if grep -qi '^access-control-allow-origin:' "$blocked_origin_headers"; then
    fail "CORS allowed unexpected origin"
  else
    pass "CORS blocks unexpected origin"
  fi

  local password_hash_file="$tmp_dir/password-hash.json"
  if run_password_hash_check >"$password_hash_file" 2>"$tmp_dir/password-hash.err"; then
    if [[ "$(json_get "$password_hash_file" 'data.ownerHashed')" == "true" && "$(json_get "$password_hash_file" 'data.managerHashed')" == "true" ]]; then
      pass "Passwords are stored as bcrypt hashes"
    else
      fail "Password hash check failed"
    fi
  else
    fail "Password hash check could not run"
    cat "$tmp_dir/password-hash.err"
  fi

  local login_rate_limit_hit="false"
  for _ in $(seq 1 18); do
    local rate_limit_body="$tmp_dir/login-rate-limit.json"
    local rate_limit_status
    rate_limit_status="$(curl -s -o "$rate_limit_body" -w '%{http_code}' -X POST "$BASE_URL/auth/login" \
      -H 'Content-Type: application/json' \
      -d "{\"phone\":\"$OWNER_PHONE\",\"password\":\"wrong-password\"}")"
    if [[ "$rate_limit_status" == "429" ]]; then
      login_rate_limit_hit="true"
      break
    fi
  done
  if [[ "$login_rate_limit_hit" == "true" ]]; then
    pass "Login endpoint rate limit returns 429"
  else
    fail "Login endpoint rate limit did not trigger"
  fi

  if [[ "$FAILURES" -gt 0 ]]; then
    log "❌ Security audit finished with $FAILURES failure(s)"
    exit 1
  fi

  log "✅ Security audit finished without failures"
}

main "$@"
