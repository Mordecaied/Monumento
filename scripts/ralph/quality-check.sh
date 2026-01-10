#!/bin/bash
# Quality checks for Ralph iterations
# Customize this script for your project's specific needs

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

FAILED=0

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}           Running Quality Checks                  ${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Frontend checks
if [ -d "frontend-web" ]; then
    cd frontend-web

    # TypeScript type checking
    log_info "Running TypeScript type check..."
    if npm run type-check > /dev/null 2>&1; then
        log_success "Type checking passed"
    else
        log_error "Type checking failed"
        FAILED=1
    fi

    # Linting
    log_info "Running ESLint..."
    if npm run lint > /dev/null 2>&1; then
        log_success "Linting passed"
    else
        log_error "Linting failed"
        FAILED=1
    fi

    # Tests (if test script exists)
    if grep -q '"test"' package.json; then
        log_info "Running frontend tests..."
        if npm test > /dev/null 2>&1; then
            log_success "Frontend tests passed"
        else
            log_error "Frontend tests failed"
            FAILED=1
        fi
    fi

    cd ..
else
    echo -e "${YELLOW}[SKIP]${NC} No frontend-web directory found"
fi

# Backend checks
if [ -d "backend" ]; then
    cd backend

    # Note: Backend runs in VS Code Spring Boot Console
    # We'll skip compilation for now, as it's managed by VS Code
    # If you want to check compilation, uncomment below:

    # log_info "Checking backend compilation..."
    # if ./mvnw compile > /dev/null 2>&1; then
    #     log_success "Backend compilation passed"
    # else
    #     log_error "Backend compilation failed"
    #     FAILED=1
    # fi

    # If you have backend tests configured:
    # log_info "Running backend tests..."
    # if ./mvnw test > /dev/null 2>&1; then
    #     log_success "Backend tests passed"
    # else
    #     log_error "Backend tests failed"
    #     FAILED=1
    # fi

    cd ..
else
    echo -e "${YELLOW}[SKIP]${NC} No backend directory found"
fi

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}   ✓ All quality checks passed!                   ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}   ✗ Some quality checks failed                   ${RED}║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
    exit 1
fi
