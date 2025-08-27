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

        // 공백 제거
        const cleanedNumber = registrationNumber.replace(/\s/g, '');

        // 길이 검증 (최소 10자, 최대 13자)
        if (cleanedNumber.length < 10 || cleanedNumber.length > 13) {
            return {
                isValid: false,
                message: '법인등록번호는 10자리 이상 13자리 이하로 입력해주세요.'
            };
        }

        // 법인등록번호 형식 검증 (XXX-XX-XXXXX 또는 XXXXXXXXX)
        const regNumberPatterns = [
            /^\d{3}-\d{2}-\d{5}$/,  // XXX-XX-XXXXX 형식
            /^\d{10}$/,             // XXXXXXXXXX 형식 (10자리)
            /^\d{12,13}$/           // 12~13자리 숫자
        ];

        const isValidFormat = regNumberPatterns.some(pattern => pattern.test(cleanedNumber));
        
        if (!isValidFormat) {
            return {
                isValid: false,
                message: '법인등록번호 형식이 올바르지 않습니다. (예: 123-45-67890 또는 1234567890)'
            };
        }

        // 법인등록번호 체크섬 검증 (선택적 - 정확한 알고리즘이 필요한 경우)
        if (cleanedNumber.length >= 10) {
            const validationResult = this.validateRegistrationChecksum(cleanedNumber);
            if (!validationResult.isValid) {
                return validationResult;
            }
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

    // 법인등록번호 체크섬 검증 (간단한 검증 로직)
    validateRegistrationChecksum(registrationNumber) {
        const cleanNumber = registrationNumber.replace(/\-/g, '');
        
        // 모든 자리가 같은 숫자인 경우 거부
        if (/^(\d)\1+$/.test(cleanNumber)) {
            return {
                isValid: false,
                message: '유효하지 않은 법인등록번호입니다. (모든 자리가 동일한 숫자)'
            };
        }

        // 연속된 숫자인 경우 거부 (1234567890 등)
        let isSequential = true;
        for (let i = 1; i < cleanNumber.length; i++) {
            if (parseInt(cleanNumber[i]) !== parseInt(cleanNumber[i-1]) + 1) {
                isSequential = false;
                break;
            }
        }
        
        if (isSequential) {
            return {
                isValid: false,
                message: '유효하지 않은 법인등록번호입니다. (연속된 숫자)'
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

        // 사업연도 중복 검사 (같은 법인 내)
        if (window.dataStorage.checkFiscalYearExists(companyId, fiscalYearData.fiscalYear, currentFiscalYearId)) {
            return {
                isValid: false,
                message: `사업연도 ${fiscalYearData.fiscalYear}은(는) 이미 등록되어 있습니다.`
            };
        }

        // 현재 화면의 다른 행과 사업연도 중복 검사
        const currentPageDuplicateCheck = this.checkCurrentPageFiscalYearDuplicate(
            fiscalYearData.fiscalYear, 
            currentFiscalYearId
        );
        if (!currentPageDuplicateCheck.isValid) {
            return currentPageDuplicateCheck;
        }

        // 날짜 겹침 검사 (저장된 데이터와)
        const savedDataOverlapCheck = window.dataStorage.checkDateOverlap(
            companyId, 
            fiscalYearData.startDate, 
            fiscalYearData.endDate, 
            currentFiscalYearId
        );
        
        if (savedDataOverlapCheck.isOverlap) {
            return {
                isValid: false,
                message: `입력한 기간(${fiscalYearData.startDate}~${fiscalYearData.endDate})이 기존 사업연도 ${savedDataOverlapCheck.conflictFiscalYear}(${savedDataOverlapCheck.conflictPeriod})와 겹칩니다.`
            };
        }

        // 현재 화면의 다른 행과 날짜 겹침 검사
        const currentPageOverlapCheck = this.checkCurrentPageDateOverlap(
            fiscalYearData.startDate,
            fiscalYearData.endDate,
            currentFiscalYearId
        );
        if (!currentPageOverlapCheck.isValid) {
            return currentPageOverlapCheck;
        }

        // 시작일이 종료일보다 늦은 경우 추가 검증
        if (fiscalYearData.startDate >= fiscalYearData.endDate) {
            return {
                isValid: false,
                message: '시작일은 종료일보다 빨라야 합니다.'
            };
        }

        return { isValid: true };
    }

    // 현재 화면의 다른 행과 사업연도 중복 검사
    checkCurrentPageFiscalYearDuplicate(fiscalYear, excludeId) {
        const rows = document.querySelectorAll('#fiscalYearTableBody tr');
        let duplicateCount = 0;
        
        rows.forEach(row => {
            const rowId = this.getRowId(row);
            const rowFiscalYear = row.querySelector('[data-field="fiscalYear"]')?.value?.trim();
            
            if (rowFiscalYear === fiscalYear && rowId !== excludeId && rowFiscalYear !== '') {
                duplicateCount++;
            }
        });

        if (duplicateCount > 0) {
            return {
                isValid: false,
                message: `사업연도 ${fiscalYear}이(가) 현재 화면에서 중복됩니다.`
            };
        }

        return { isValid: true };
    }

    // 현재 화면의 다른 행과 날짜 겹침 검사
    checkCurrentPageDateOverlap(startDate, endDate, excludeId) {
        const rows = document.querySelectorAll('#fiscalYearTableBody tr');
        
        for (let row of rows) {
            const rowId = this.getRowId(row);
            const rowStartDate = row.querySelector('[data-field="startDate"]')?.value?.trim();
            const rowEndDate = row.querySelector('[data-field="endDate"]')?.value?.trim();
            
            // 자기 자신은 제외
            if (rowId === excludeId) continue;
            
            // 빈 행은 제외
            if (!rowStartDate || !rowEndDate) continue;
            
            // 날짜 겹침 검사
            if (this.isDateRangeOverlap(startDate, endDate, rowStartDate, rowEndDate)) {
                return {
                    isValid: false,
                    message: `입력한 기간(${startDate}~${endDate})이 현재 화면의 다른 사업연도(${rowStartDate}~${rowEndDate})와 겹칩니다.`
                };
            }
        }
        
        return { isValid: true };
    }

    // 두 날짜 범위가 겹치는지 검사
    isDateRangeOverlap(start1, end1, start2, end2) {
        const date1Start = new Date(this.formatDateString(start1));
        const date1End = new Date(this.formatDateString(end1));
        const date2Start = new Date(this.formatDateString(start2));
        const date2End = new Date(this.formatDateString(end2));

        // 두 기간이 겹치는 조건:
        // (start1 <= end2) && (end1 >= start2)
        return (date1Start <= date2End) && (date1End >= date2Start);
    }

    // YYYYMMDD 형식을 YYYY-MM-DD로 변환
    formatDateString(dateString) {
        if (dateString.length === 8) {
            return `${dateString.substr(0, 4)}-${dateString.substr(4, 2)}-${dateString.substr(6, 2)}`;
        }
        return dateString;
    }

    // 행의 고유 ID를 안전하게 가져오기
    getRowId(row) {
        const hiddenId = row.querySelector('[data-field="id"]')?.value;
        const rowId = row.getAttribute('data-row-id');
        const tableIndex = Array.from(row.parentNode.children).indexOf(row);
        
        return hiddenId || rowId || `temp_${tableIndex}`;
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

        // 사업연도 그리드 실시간 검증 설정
        this.setupFiscalYearGridValidation();
    }

    // 사업연도 그리드 실시간 검증 설정
    setupFiscalYearGridValidation() {
        const tbody = document.getElementById('fiscalYearTableBody');
        if (!tbody) return;

        // 기존 이벤트 리스너 제거를 위한 플래그
        if (tbody.hasValidationListeners) return;

        // 이벤트 위임을 사용하여 동적으로 추가된 행에도 적용
        tbody.addEventListener('blur', (e) => {
            if (!e.target.matches('[data-field]')) return;

            const row = e.target.closest('tr');
            const field = e.target.getAttribute('data-field');
            
            this.validateFiscalYearField(e.target, row, field);
        }, true);

        // 체크박스 변경 시에도 검증
        tbody.addEventListener('change', (e) => {
            if (!e.target.matches('[data-field]')) return;

            const row = e.target.closest('tr');
            const field = e.target.getAttribute('data-field');
            
            // 날짜 필드가 변경될 때 다른 행들과의 겹침 검사
            if (['startDate', 'endDate'].includes(field)) {
                this.validateFiscalYearField(e.target, row, field);
            }
        });

        tbody.hasValidationListeners = true;
    }

    // 사업연도 개별 필드 검증
    validateFiscalYearField(element, row, fieldType) {
        const value = element.value.trim();
        let validation = { isValid: true };

        switch (fieldType) {
            case 'fiscalYear':
                if (value) {
                    validation = this.validateFiscalYear(value);
                    if (validation.isValid) {
                        // 중복 검사
                        const rowId = this.getRowId(row);
                        validation = this.checkCurrentPageFiscalYearDuplicate(value, rowId);
                    }
                }
                break;

            case 'startDate':
            case 'endDate':
                if (value) {
                    validation = this.validateDate(value, fieldType === 'startDate' ? '시작일' : '종료일');
                    if (validation.isValid) {
                        // 시작일과 종료일이 모두 있으면 범위 검사
                        const startDateInput = row.querySelector('[data-field="startDate"]');
                        const endDateInput = row.querySelector('[data-field="endDate"]');
                        const startDate = startDateInput?.value.trim();
                        const endDate = endDateInput?.value.trim();
                        
                        if (startDate && endDate) {
                            const rangeValidation = this.validateDateRange(startDate, endDate);
                            if (!rangeValidation.isValid) {
                                validation = rangeValidation;
                            } else {
                                // 다른 행들과의 겹침 검사
                                const rowId = this.getRowId(row);
                                validation = this.checkCurrentPageDateOverlap(startDate, endDate, rowId);
                            }
                        }
                    }
                }
                break;
        }

        // 결과 처리
        if (!validation.isValid) {
            this.showFieldError(element, validation.message);
        } else {
            this.clearFieldError(element);
        }
    }
}

// 전역 인스턴스 생성
window.validationHelper = new ValidationHelper();