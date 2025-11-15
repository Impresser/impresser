// app/dashboard/layout.tsx - 대시보드 전용 레이아웃 예시
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout bg-gray-50 min-h-screen">
      {/* 대시보드 상단 바 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
              <p className="text-gray-600">시스템 현황을 한눈에 확인하세요</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                마지막 업데이트: {new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                새로고침
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 대시보드 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>

      {/* 대시보드 하단 정보 */}
      <div className="bg-white border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <span>대시보드 v2.1.0</span>
            <span>데이터 새로고침 주기: 30초</span>
          </div>
        </div>
      </div>
    </div>
  );
}
