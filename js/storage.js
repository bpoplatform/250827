// LocalStorage 기반 데이터 관리 클래스
class DataStorage {
    constructor() {
        this.COMPANY_KEY = 'company_data';
        this.FISCAL_YEAR_KEY = 'fiscal_year_data';
        this.initializeStorage();
    }

    // 스토리지 초기화
    initializeStorage() {
        if (!localStorage.getItem(this.COMPANY_KEY)) {
            localStorage.setItem(this.COMPANY_KEY, JSON.stringify([]));
        }
        if (!localStorage.getItem(this.FISCAL_YEAR_KEY)) {
            localStorage.setItem(this.FISCAL_YEAR_KEY, JSON.stringify([]));
        }
    }

    // 고유 ID 생성
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Company CRUD 메소드들
    
    // 모든 회사 정보 조회
    getAllCompanies() {
        try {
            const data = localStorage.getItem(this.COMPANY_KEY);
            return JSON.parse(data) || [];
        } catch (error) {
            console.error('회사 정보 조회 오류:', error);
            return [];
        }
    }

    // 회사 정보 저장
    saveCompany(companyData) {
        try {
            const companies = this.getAllCompanies();
            const existingIndex = companies.findIndex(c => c.COM_ID === companyData.COM_ID);
            
            if (existingIndex >= 0) {
                // 기존 데이터 업데이트
                companies[existingIndex] = { ...companies[existingIndex], ...companyData };
            } else {
                // 새 데이터 추가
                companyData.COM_ID = this.generateId();
                companies.push(companyData);
            }
            
            localStorage.setItem(this.COMPANY_KEY, JSON.stringify(companies));
            return companyData;
        } catch (error) {
            console.error('회사 정보 저장 오류:', error);
            throw error;
        }
    }

    // 회사 정보 조회 (법인명 또는 등록번호로)
    findCompany(companyName, registrationNumber) {
        try {
            const companies = this.getAllCompanies();
            return companies.find(c => 
                (companyName && c.COM_NAME === companyName) ||
                (registrationNumber && c.COM_NO_NO === registrationNumber)
            );
        } catch (error) {
            console.error('회사 정보 조회 오류:', error);
            return null;
        }
    }

    // 등록번호 중복 검사
    checkRegistrationNumberExists(registrationNumber, excludeId = null) {
        try {
            const companies = this.getAllCompanies();
            return companies.some(c => 
                c.COM_NO_NO === registrationNumber && 
                (excludeId ? c.COM_ID !== excludeId : true)
            );
        } catch (error) {
            console.error('등록번호 중복 검사 오류:', error);
            return false;
        }
    }

    // 회사 정보 삭제
    deleteCompany(companyId) {
        try {
            let companies = this.getAllCompanies();
            companies = companies.filter(c => c.COM_ID !== companyId);
            localStorage.setItem(this.COMPANY_KEY, JSON.stringify(companies));
            
            // 관련된 사업연도 데이터도 삭제
            this.deleteFiscalYearsByCompanyId(companyId);
            
            return true;
        } catch (error) {
            console.error('회사 정보 삭제 오류:', error);
            return false;
        }
    }

    // Fiscal Year CRUD 메소드들
    
    // 특정 회사의 모든 사업연도 조회
    getFiscalYearsByCompanyId(companyId) {
        try {
            const data = localStorage.getItem(this.FISCAL_YEAR_KEY);
            const fiscalYears = JSON.parse(data) || [];
            return fiscalYears.filter(fy => fy.CORP_ID === companyId);
        } catch (error) {
            console.error('사업연도 조회 오류:', error);
            return [];
        }
    }

    // 사업연도 저장
    saveFiscalYear(fiscalYearData) {
        try {
            const fiscalYears = this.getAllFiscalYears();
            const existingIndex = fiscalYears.findIndex(fy => fy.FY_ID === fiscalYearData.FY_ID);
            
            if (existingIndex >= 0) {
                // 기존 데이터 업데이트
                fiscalYears[existingIndex] = { ...fiscalYears[existingIndex], ...fiscalYearData };
            } else {
                // 새 데이터 추가
                fiscalYearData.FY_ID = this.generateId();
                fiscalYears.push(fiscalYearData);
            }
            
            localStorage.setItem(this.FISCAL_YEAR_KEY, JSON.stringify(fiscalYears));
            return fiscalYearData;
        } catch (error) {
            console.error('사업연도 저장 오류:', error);
            throw error;
        }
    }

    // 모든 사업연도 조회
    getAllFiscalYears() {
        try {
            const data = localStorage.getItem(this.FISCAL_YEAR_KEY);
            return JSON.parse(data) || [];
        } catch (error) {
            console.error('사업연도 전체 조회 오류:', error);
            return [];
        }
    }

    // 사업연도 삭제
    deleteFiscalYear(fiscalYearId) {
        try {
            let fiscalYears = this.getAllFiscalYears();
            fiscalYears = fiscalYears.filter(fy => fy.FY_ID !== fiscalYearId);
            localStorage.setItem(this.FISCAL_YEAR_KEY, JSON.stringify(fiscalYears));
            return true;
        } catch (error) {
            console.error('사업연도 삭제 오류:', error);
            return false;
        }
    }

    // 회사별 사업연도 전체 삭제
    deleteFiscalYearsByCompanyId(companyId) {
        try {
            let fiscalYears = this.getAllFiscalYears();
            fiscalYears = fiscalYears.filter(fy => fy.CORP_ID !== companyId);
            localStorage.setItem(this.FISCAL_YEAR_KEY, JSON.stringify(fiscalYears));
            return true;
        } catch (error) {
            console.error('회사별 사업연도 삭제 오류:', error);
            return false;
        }
    }

    // 사업연도 중복 검사 (같은 회사 내에서)
    checkFiscalYearExists(companyId, fiscalYear, excludeId = null) {
        try {
            const fiscalYears = this.getFiscalYearsByCompanyId(companyId);
            return fiscalYears.some(fy => 
                fy.FISCAL_YEAR === fiscalYear && 
                (excludeId ? fy.FY_ID !== excludeId : true)
            );
        } catch (error) {
            console.error('사업연도 중복 검사 오류:', error);
            return false;
        }
    }

    // 날짜 겹침 검사
    checkDateOverlap(companyId, startDate, endDate, excludeId = null) {
        try {
            const fiscalYears = this.getFiscalYearsByCompanyId(companyId);
            
            for (let fy of fiscalYears) {
                if (excludeId && fy.FY_ID === excludeId) continue;
                
                // YYYYMMDD 형식을 Date 객체로 변환
                const existingStart = this.parseDate(fy.START_DATE);
                const existingEnd = this.parseDate(fy.END_DATE);
                const newStart = this.parseDate(startDate);
                const newEnd = this.parseDate(endDate);
                
                // 유효하지 않은 날짜는 건너뛰기
                if (!existingStart || !existingEnd || !newStart || !newEnd) {
                    continue;
                }
                
                // 날짜 겹침 검사: (newStart <= existingEnd) && (newEnd >= existingStart)
                if (newStart <= existingEnd && newEnd >= existingStart) {
                    return {
                        isOverlap: true,
                        conflictFiscalYear: fy.FISCAL_YEAR,
                        conflictPeriod: `${fy.START_DATE}~${fy.END_DATE}`
                    };
                }
            }
            
            return { isOverlap: false };
        } catch (error) {
            console.error('날짜 겹침 검사 오류:', error);
            return { isOverlap: false };
        }
    }

    // YYYYMMDD 문자열을 Date 객체로 변환
    parseDate(dateString) {
        if (!dateString || dateString.length !== 8) return null;
        
        const year = parseInt(dateString.substr(0, 4));
        const month = parseInt(dateString.substr(4, 2)) - 1; // 월은 0부터 시작
        const day = parseInt(dateString.substr(6, 2));
        
        const date = new Date(year, month, day);
        
        // 유효한 날짜인지 확인
        if (date.getFullYear() !== year || 
            date.getMonth() !== month || 
            date.getDate() !== day) {
            return null;
        }
        
        return date;
    }

    // 데이터 내보내기 (Excel용)
    exportData() {
        try {
            const companies = this.getAllCompanies();
            const fiscalYears = this.getAllFiscalYears();
            
            const exportData = companies.map(company => {
                const companyFiscalYears = fiscalYears.filter(fy => fy.CORP_ID === company.COM_ID);
                return {
                    company,
                    fiscalYears: companyFiscalYears
                };
            });
            
            return exportData;
        } catch (error) {
            console.error('데이터 내보내기 오류:', error);
            return [];
        }
    }

    // 전체 데이터 초기화
    clearAllData() {
        try {
            localStorage.setItem(this.COMPANY_KEY, JSON.stringify([]));
            localStorage.setItem(this.FISCAL_YEAR_KEY, JSON.stringify([]));
            return true;
        } catch (error) {
            console.error('데이터 초기화 오류:', error);
            return false;
        }
    }
}

// 전역 인스턴스 생성
window.dataStorage = new DataStorage();