// 메인 애플리케이션 클래스
class CorporateManagementApp {
    constructor() {
        this.currentCompanyId = null;
        this.selectedFiscalYearRows = [];
        this.fiscalYearRowCounter = 0;
        
        this.initializeApp();
    }

    // 앱 초기화
    initializeApp() {
        this.bindEvents();
        this.setupValidation();
        
        // 기존 값이 있는지 확인
        const hasExistingData = document.getElementById('companyName').value || 
                               document.getElementById('registrationNumber').value;
        
        if (!hasExistingData) {
            this.clearForm();
        } else {
            // 사업연도 테이블에 행이 없다면 하나 추가
            const tbody = document.getElementById('fiscalYearTableBody');
            if (tbody.children.length === 0) {
                this.addFiscalYearRow();
            }
        }
    }

    // 이벤트 바인딩
    bindEvents() {
        // 메뉴 버튼 이벤트
        document.getElementById('btnNew').addEventListener('click', () => this.newRecord());
        document.getElementById('btnQuery').addEventListener('click', () => this.queryRecord());
        document.getElementById('btnSave').addEventListener('click', () => this.saveRecord());
        document.getElementById('btnExcel').addEventListener('click', () => this.exportToExcel());
        document.getElementById('btnDelete').addEventListener('click', () => this.deleteRecord());

        // 그리드 컨트롤 이벤트
        document.getElementById('btnAddRow').addEventListener('click', () => this.addFiscalYearRow());
        document.getElementById('btnRemoveRow').addEventListener('click', () => this.removeSelectedRows());

        // 입력 필드 이벤트
        document.getElementById('companyName').addEventListener('input', (e) => this.onCompanyFieldChange(e));
        document.getElementById('registrationNumber').addEventListener('input', (e) => this.onCompanyFieldChange(e));
    }

    // 유효성 검증 설정
    setupValidation() {
        validationHelper.markRequiredFields();
        validationHelper.setupRealTimeValidation();
    }

    // 새로 작성
    newRecord() {
        this.clearForm();
        this.showMessage('새로운 법인 정보를 입력해주세요.', 'info');
    }

    // 조회
    queryRecord() {
        const companyName = document.getElementById('companyName').value.trim();
        const registrationNumber = document.getElementById('registrationNumber').value.trim();

        if (!companyName && !registrationNumber) {
            this.showMessage('법인명 또는 법인등록번호를 입력해주세요.', 'error');
            return;
        }

        const company = dataStorage.findCompany(companyName, registrationNumber);
        
        if (!company) {
            this.showMessage('조회된 법인 정보가 없습니다.', 'warning');
            this.clearFiscalYearGrid();
            return;
        }

        // 법인 정보 표시
        this.loadCompanyData(company);
        this.showMessage('법인 정보를 조회했습니다.', 'success');
    }

    // 저장
    async saveRecord() {
        validationHelper.clearAllErrors();

        // 법인 정보 유효성 검증
        const companyData = this.getCompanyFormData();
        
        if (!this.validateCompanyData(companyData)) {
            return;
        }

        try {
            // 법인 정보 저장
            const savedCompany = dataStorage.saveCompany({
                COM_ID: this.currentCompanyId,
                COM_NAME: companyData.companyName,
                COM_NO_NO: companyData.registrationNumber
            });

            this.currentCompanyId = savedCompany.COM_ID;

            // 사업연도 정보 저장
            await this.saveFiscalYearData();

            this.showMessage('데이터가 성공적으로 저장되었습니다.', 'success');
            
        } catch (error) {
            console.error('저장 오류:', error);
            this.showMessage(`저장 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    }

    // 삭제
    deleteRecord() {
        if (!this.currentCompanyId) {
            this.showMessage('삭제할 법인을 선택해주세요.', 'warning');
            return;
        }

        if (confirm('선택한 법인과 관련된 모든 데이터가 삭제됩니다. 계속하시겠습니까?')) {
            if (dataStorage.deleteCompany(this.currentCompanyId)) {
                this.clearForm();
                this.showMessage('데이터가 삭제되었습니다.', 'success');
            } else {
                this.showMessage('삭제 중 오류가 발생했습니다.', 'error');
            }
        }
    }

    // Excel 내보내기
    exportToExcel() {
        try {
            const exportData = dataStorage.exportData();
            
            if (exportData.length === 0) {
                this.showMessage('내보낼 데이터가 없습니다.', 'warning');
                return;
            }

            this.generateExcelFile(exportData);
            this.showMessage('Excel 파일이 다운로드됩니다.', 'success');
            
        } catch (error) {
            console.error('Excel 내보내기 오류:', error);
            this.showMessage('Excel 내보내기 중 오류가 발생했습니다.', 'error');
        }
    }

    // Excel 파일 생성
    generateExcelFile(data) {
        // CSV 형태로 데이터 변환
        let csvContent = '\uFEFF'; // UTF-8 BOM
        
        // 헤더 생성
        csvContent += '법인명,법인등록번호,사업연도,시작일,종료일,사업연도여부,비고\n';
        
        // 데이터 행 생성
        data.forEach(item => {
            const company = item.company;
            
            if (item.fiscalYears.length === 0) {
                // 사업연도 없는 법인
                csvContent += `"${company.COM_NAME}","${company.COM_NO_NO}",,,,\n`;
            } else {
                // 사업연도 있는 법인
                item.fiscalYears.forEach(fy => {
                    const isMainFy = fy.IS_MAIN_FY ? 'Y' : 'N';
                    const remarks = fy.REMARKS || '';
                    csvContent += `"${company.COM_NAME}","${company.COM_NO_NO}","${fy.FISCAL_YEAR}","${fy.START_DATE}","${fy.END_DATE}","${isMainFy}","${remarks}"\n`;
                });
            }
        });

        // 파일 다운로드
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `법인정보_${this.getCurrentDateString()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // 현재 날짜 문자열 생성
    getCurrentDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    // 법인 데이터 로드
    loadCompanyData(company) {
        this.currentCompanyId = company.COM_ID;
        
        document.getElementById('companyName').value = company.COM_NAME;
        document.getElementById('registrationNumber').value = company.COM_NO_NO;

        // 사업연도 데이터 로드
        this.loadFiscalYearData();
    }

    // 사업연도 데이터 로드
    loadFiscalYearData() {
        if (!this.currentCompanyId) return;

        const fiscalYears = dataStorage.getFiscalYearsByCompanyId(this.currentCompanyId);
        this.clearFiscalYearGrid();

        fiscalYears.forEach(fy => {
            this.addFiscalYearRow(fy);
        });

        if (fiscalYears.length === 0) {
            this.addFiscalYearRow(); // 빈 행 하나 추가
        }
    }

    // 사업연도 행 추가
    addFiscalYearRow(data = null) {
        const tbody = document.getElementById('fiscalYearTableBody');
        const row = document.createElement('tr');
        const rowId = `row_${this.fiscalYearRowCounter++}`;
        row.setAttribute('data-row-id', rowId);
        
        const fiscalYearId = data ? data.FY_ID : '';
        const fiscalYear = data ? data.FISCAL_YEAR : '';
        const startDate = data ? data.START_DATE : '';
        const endDate = data ? data.END_DATE : '';
        const isMainFy = data ? data.IS_MAIN_FY : false;
        const remarks = data ? data.REMARKS || '' : '';

        row.innerHTML = `
            <td><input type="text" value="${fiscalYear}" maxlength="4" placeholder="YYYY" data-field="fiscalYear"></td>
            <td><input type="text" value="${startDate}" maxlength="8" placeholder="YYYYMMDD" data-field="startDate"></td>
            <td><input type="text" value="${endDate}" maxlength="8" placeholder="YYYYMMDD" data-field="endDate"></td>
            <td><input type="checkbox" ${isMainFy ? 'checked' : ''} data-field="isMainFy"></td>
            <td><input type="text" value="${remarks}" maxlength="200" data-field="remarks"></td>
            <td>
                <input type="checkbox" class="row-selector">
                <input type="hidden" value="${fiscalYearId}" data-field="id">
            </td>
        `;

        tbody.appendChild(row);

        // 행 선택 이벤트 바인딩
        const selector = row.querySelector('.row-selector');
        selector.addEventListener('change', (e) => this.onRowSelectionChange(e, row));

        // 새로 추가된 행에 유효성 검증 이벤트 바인딩 (이미 tbody 레벨에서 이벤트 위임으로 처리됨)
        // validationHelper.setupFiscalYearGridValidation() 에서 처리됨
        
        return row;
    }

    // 선택된 행 삭제
    removeSelectedRows() {
        const allRows = document.querySelectorAll('#fiscalYearTableBody tr');
        const selectedRows = [];
        
        allRows.forEach(row => {
            const selector = row.querySelector('.row-selector');
            if (selector && selector.checked) {
                selectedRows.push(row);
            }
        });
        
        if (selectedRows.length === 0) {
            this.showMessage('삭제할 행을 선택해주세요.', 'warning');
            return;
        }

        if (confirm(`선택한 ${selectedRows.length}개 행을 삭제하시겠습니까?`)) {
            selectedRows.forEach(row => {
                const fiscalYearId = row.querySelector('[data-field="id"]').value;
                if (fiscalYearId) {
                    dataStorage.deleteFiscalYear(fiscalYearId);
                }
                row.remove();
            });

            this.showMessage('선택한 행이 삭제되었습니다.', 'success');
        }
    }

    // 행 선택 변경 이벤트
    onRowSelectionChange(event, row) {
        if (event.target.checked) {
            row.classList.add('selected');
        } else {
            row.classList.remove('selected');
        }
    }

    // 법인 필드 변경 이벤트
    onCompanyFieldChange(event) {
        // 기존 데이터와 다르면 새로운 데이터로 간주
        this.currentCompanyId = null;
    }

    // 폼 데이터 수집
    getCompanyFormData() {
        return {
            companyName: document.getElementById('companyName').value.trim(),
            registrationNumber: document.getElementById('registrationNumber').value.trim()
        };
    }

    // 법인 데이터 유효성 검증
    validateCompanyData(data) {
        let isValid = true;

        // 법인명 검증
        const nameValidation = validationHelper.validateCompanyName(data.companyName);
        if (!nameValidation.isValid) {
            validationHelper.showFieldError(
                document.getElementById('companyName'), 
                nameValidation.message
            );
            isValid = false;
        }

        // 법인등록번호 검증
        const regValidation = validationHelper.validateRegistrationNumber(
            data.registrationNumber, 
            this.currentCompanyId
        );
        if (!regValidation.isValid) {
            validationHelper.showFieldError(
                document.getElementById('registrationNumber'), 
                regValidation.message
            );
            isValid = false;
        }

        return isValid;
    }

    // 사업연도 데이터 저장
    async saveFiscalYearData() {
        const rows = document.querySelectorAll('#fiscalYearTableBody tr');
        
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            
            let fiscalYearData;
            try {
                fiscalYearData = this.getFiscalYearRowData(row);
            } catch (error) {
                throw new Error(`행 ${i+1}에서 데이터 수집 오류: ${error.message}`);
            }
            
            // 빈 행은 건너뛰기
            if (!fiscalYearData.fiscalYear && !fiscalYearData.startDate && !fiscalYearData.endDate) {
                continue;
            }

            // 유효성 검증
            const validation = validationHelper.validateFiscalYearData(
                fiscalYearData, 
                this.currentCompanyId, 
                fiscalYearData.id
            );

            if (!validation.isValid) {
                this.showRowError(row, validation.message);
                throw new Error(validation.message);
            }

            // 데이터 저장
            try {
                dataStorage.saveFiscalYear({
                    FY_ID: fiscalYearData.id,
                    CORP_ID: this.currentCompanyId,
                    FISCAL_YEAR: fiscalYearData.fiscalYear,
                    START_DATE: fiscalYearData.startDate,
                    END_DATE: fiscalYearData.endDate,
                    IS_MAIN_FY: fiscalYearData.isMainFy,
                    REMARKS: fiscalYearData.remarks
                });
            } catch (error) {
                throw new Error(`행 ${i+1} 저장 실패: ${error.message}`);
            }
        }
    }

    // 행 데이터 수집
    getFiscalYearRowData(row) {
        const idElement = row.querySelector('[data-field="id"]');
        const fiscalYearElement = row.querySelector('[data-field="fiscalYear"]');
        const startDateElement = row.querySelector('[data-field="startDate"]');
        const endDateElement = row.querySelector('[data-field="endDate"]');
        const isMainFyElement = row.querySelector('[data-field="isMainFy"]');
        const remarksElement = row.querySelector('[data-field="remarks"]');

        if (!fiscalYearElement || !startDateElement || !endDateElement || !isMainFyElement || !remarksElement) {
            throw new Error('필수 입력 요소를 찾을 수 없습니다');
        }

        return {
            id: idElement ? idElement.value : '',
            fiscalYear: fiscalYearElement.value.trim(),
            startDate: startDateElement.value.trim(),
            endDate: endDateElement.value.trim(),
            isMainFy: isMainFyElement.checked,
            remarks: remarksElement.value.trim()
        };
    }

    // 행 에러 표시
    showRowError(row, message) {
        row.style.backgroundColor = '#ffebee';
        this.showMessage(message, 'error');
        
        setTimeout(() => {
            row.style.backgroundColor = '';
        }, 3000);
    }

    // 사업연도 그리드 초기화
    clearFiscalYearGrid() {
        const tbody = document.getElementById('fiscalYearTableBody');
        tbody.innerHTML = '';
        this.fiscalYearRowCounter = 0;
    }

    // 폼 초기화
    clearForm() {
        this.currentCompanyId = null;
        
        document.getElementById('companyName').value = '';
        document.getElementById('registrationNumber').value = '';
        
        this.clearFiscalYearGrid();
        this.addFiscalYearRow(); // 빈 행 하나 추가
        
        validationHelper.clearAllErrors();
        this.hideMessage();
    }

    // 메시지 표시
    showMessage(message, type = 'info') {
        const messageArea = document.getElementById('messageArea');
        
        // 기존 클래스 제거
        messageArea.className = 'message-area';
        
        // 새 클래스 추가
        switch (type) {
            case 'success':
                messageArea.classList.add('message-success');
                break;
            case 'error':
                messageArea.classList.add('message-error');
                break;
            case 'warning':
                messageArea.classList.add('message-warning');
                break;
            default:
                break;
        }
        
        messageArea.textContent = message;
        messageArea.style.display = 'block';
        
        // 3초 후 자동 숨김
        setTimeout(() => {
            this.hideMessage();
        }, 3000);
    }

    // 메시지 숨김
    hideMessage() {
        const messageArea = document.getElementById('messageArea');
        messageArea.style.display = 'none';
    }
}

// DOM 로드 완료 후 앱 시작
document.addEventListener('DOMContentLoaded', function() {
    window.app = new CorporateManagementApp();
});