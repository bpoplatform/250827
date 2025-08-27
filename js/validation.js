// 유효성 검증 클래스
class ValidationHelper {
    constructor() {
        this.errorMessages = {
            REQUIRED_FIELD: '필수 입력 항목입니다.',
            INVALID_FORMAT: '입력 형식이 올바르지 않습니다.',
            DUPLICATE_REGISTRATION: '이미 등록된 법인등록번호입니다.',
            DUPLICATE_FISCAL_YEAR: '이미 등록된 사업연도입니다.',
            DATE_OVERLAP: '기간이 기존 사업연도와 겹칩니다.',
            INVALID_DATE_RANGE: '종료일은 시작일보다 늦어야 합니다.',
            INVALID_DATE_FORMAT: '날짜 형식이 올바르지 않습니다. (YYYYMMDD)',
            MAX_LENGTH_EXCEEDED: '입력 가능한 최대 길이를 초과했습니다.'
        };
    }

    // 필수 필드 검증
    validateRequired(value, fieldName) {
        if (!value || value.toString().trim() === '') {
            return {
                isValid: false,
                message: `${fieldName}은(는) ${this.errorMessages.REQUIRED_FIELD}`
            };
        }
        return { isValid: true };
    }

    // 법인명 유효성 검증
    validateCompanyName(companyName) {
        // 필수 검증
        const requiredCheck = this.validateRequired(companyName, '법인명');
        if (!requiredCheck.isValid) return requiredCheck;

        // 길이 검증 (최대 100자)
        if (companyName.length > 100) {
            return {
                isValid: false,
                message: `법인명은 ${this.errorMessages.MAX_LENGTH_EXCEEDED} (최대 100자)`
            };
        }

        // TEXT 형식 검증 (특수문자 제한 등은 요구사항에 따라 추가 가능)
        return { isValid: true };
    }

    // 법인등록번호 유효성 검증
    validateRegistrationNumber(registrationNumber, currentCompanyId = null) {
        // 필수 검증
        const requiredCheck = this.validateRequired(registrationNumber, '법인등록번호');
        if (!requiredCheck.isValid) return requiredCheck;

        // 길이 검증 (최대 13자)
        if (registrationNumber.length > 13) {
            return {
                isValid: false,
                message: `법인등록번호는 ${this.errorMessages.MAX_LENGTH_EXCEEDED} (최대 13자)`
            };
        }

        // 숫자와 하이픈만 허용하는 기본 형식 검증
        const regNumberPattern = /^[0-9\-]+$/;
        if (!regNumberPattern.test(registrationNumber)) {
            return {
                isValid: false,
                message: '법인등록번호는 숫자와 하이픈(-)만 입력 가능합니다.'
            };
        }

        // 중복 검사
        if (window.dataStorage.checkRegistrationNumberExists(registrationNumber, currentCompanyId)) {
            return {
                isValid: false,
                message: this.errorMessages.DUPLICATE_REGISTRATION
            };
        }

        return { isValid: true };
    }

    // 사업연도 유효성 검증 (YYYY 형식)
    validateFiscalYear(fiscalYear) {
        // 필수 검증
        const requiredCheck = this.validateRequired(fiscalYear, '사업연도');
        if (!requiredCheck.isValid) return requiredCheck;

        // YYYY 형식 검증
        const yearPattern = /^\d{4}$/;
        if (!yearPattern.test(fiscalYear)) {
            return {
                isValid: false,
                message: '사업연도는 4자리 연도(YYYY) 형식으로 입력해주세요.'
            };
        }

        // 연도 범위 검증 (1900~2100)
        const year = parseInt(fiscalYear);
        if (year < 1900 || year > 2100) {
            return {
                isValid: false,
                message: '사업연도는 1900년부터 2100년 사이의 값을 입력해주세요.'
            };
        }

        return { isValid: true };
    }

    // 날짜 형식 검증 (YYYYMMDD)
    validateDate(dateString, fieldName) {
        // 필수 검증
        const requiredCheck = this.validateRequired(dateString, fieldName);
        if (!requiredCheck.isValid) return requiredCheck;

        // YYYYMMDD 형식 검증
        const datePattern = /^\d{8}$/;
        if (!datePattern.test(dateString)) {
            return {
                isValid: false,
                message: `${fieldName}은(는) YYYYMMDD 형식으로 입력해주세요.`
            };
        }

        // 실제 날짜 유효성 검증
        const year = parseInt(dateString.substr(0, 4));
        const month = parseInt(dateString.substr(4, 2));
        const day = parseInt(dateString.substr(6, 2));

        const date = new Date(year, month - 1, day);
        
        if (date.getFullYear() !== year || 
            date.getMonth() !== month - 1 || 
            date.getDate() !== day) {
            return {
                isValid: false,
                message: `${fieldName}에 올바른 날짜를 입력해주세요.`
            };
        }

        return { isValid: true, date: date };
    }

    // 날짜 범위 검증
    validateDateRange(startDate, endDate) {
        const startValidation = this.validateDate(startDate, '시작일');
        if (!startValidation.isValid) return startValidation;

        const endValidation = this.validateDate(endDate, '종료일');
        if (!endValidation.isValid) return endValidation;

        // 시작일이 종료일보다 늦으면 안됨
        if (startValidation.date > endValidation.date) {
            return {
                isValid: false,
                message: this.errorMessages.INVALID_DATE_RANGE
            };
        }

        return { isValid: true };
    }

    // 사업연도 전체 유효성 검증
    validateFiscalYearData(fiscalYearData, companyId, currentFiscalYearId = null) {
        // 개별 필드 검증
        const fiscalYearValidation = this.validateFiscalYear(fiscalYearData.fiscalYear);
        if (!fiscalYearValidation.isValid) return fiscalYearValidation;

        const dateRangeValidation = this.validateDateRange(fiscalYearData.startDate, fiscalYearData.endDate);
        if (!dateRangeValidation.isValid) return dateRangeValidation;

        // 사업연도 중복 검사
        if (window.dataStorage.checkFiscalYearExists(companyId, fiscalYearData.fiscalYear, currentFiscalYearId)) {
            return {
                isValid: false,
                message: this.errorMessages.DUPLICATE_FISCAL_YEAR
            };
        }

        // 날짜 겹침 검사
        if (window.dataStorage.checkDateOverlap(companyId, fiscalYearData.startDate, fiscalYearData.endDate, currentFiscalYearId)) {
            return {
                isValid: false,
                message: this.errorMessages.DATE_OVERLAP
            };
        }

        return { isValid: true };
    }

    // 비고 필드 검증 (선택사항)
    validateRemarks(remarks) {
        if (remarks && remarks.length > 200) {
            return {
                isValid: false,
                message: `비고는 ${this.errorMessages.MAX_LENGTH_EXCEEDED} (최대 200자)`
            };
        }
        return { isValid: true };
    }

    // 체크박스 필드의 boolean 값 검증
    validateBoolean(value) {
        return {
            isValid: true,
            value: Boolean(value)
        };
    }

    // 입력 필드에 에러 스타일 적용
    showFieldError(element, message) {
        element.classList.add('validation-error');
        element.title = message;
        
        // 기존 에러 메시지 제거
        const existingError = element.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // 에러 메시지 요소 생성
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = '#d32f2f';
        errorElement.style.fontSize = '10px';
        errorElement.style.marginTop = '2px';
        
        element.parentNode.appendChild(errorElement);
    }

    // 입력 필드 에러 스타일 제거
    clearFieldError(element) {
        element.classList.remove('validation-error');
        element.removeAttribute('title');
        
        // 에러 메시지 제거
        const existingError = element.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    // 모든 에러 스타일 제거
    clearAllErrors() {
        const errorFields = document.querySelectorAll('.validation-error');
        errorFields.forEach(field => {
            this.clearFieldError(field);
        });

        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
    }

    // 필수 필드 표시
    markRequiredFields() {
        const requiredFields = [
            'companyName',
            'registrationNumber'
        ];

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.classList.add('required');
            }
        });
    }

    // 실시간 유효성 검증 설정
    setupRealTimeValidation() {
        // 법인명 실시간 검증
        const companyNameField = document.getElementById('companyName');
        if (companyNameField) {
            companyNameField.addEventListener('blur', (e) => {
                const validation = this.validateCompanyName(e.target.value);
                if (!validation.isValid) {
                    this.showFieldError(e.target, validation.message);
                } else {
                    this.clearFieldError(e.target);
                }
            });
        }

        // 법인등록번호 실시간 검증
        const regNumberField = document.getElementById('registrationNumber');
        if (regNumberField) {
            regNumberField.addEventListener('blur', (e) => {
                const validation = this.validateRegistrationNumber(e.target.value);
                if (!validation.isValid) {
                    this.showFieldError(e.target, validation.message);
                } else {
                    this.clearFieldError(e.target);
                }
            });
        }
    }
}

// 전역 인스턴스 생성
window.validationHelper = new ValidationHelper();