// 현재 구조 (변경 전)
/_
app/
├── layout.tsx
├── page.tsx → /
├── dashboard/
│ └── page.tsx → /dashboard
├── performance/
│ └── page.tsx → /performance
├── imagegenerator/
│ └── page.tsx → /imagegenerator
├── imagecompressor/
│ └── page.tsx → /imagecompressor
└── test1/
└── page.tsx → /test1
_/

// 그룹 라우트 구조 (변경 후)
/_
app/
├── layout.tsx → 루트 레이아웃 (HTML 기본 구조)
├── page.tsx → / (홈페이지)
├── (auth)/ → 인증 관련 페이지 그룹
│ ├── layout.tsx → 인증 페이지용 레이아웃 (사이드바 없음)
│ ├── login/
│ │ └── page.tsx → /login
│ └── register/
│ └── page.tsx → /register
└── (app)/ → 메인 앱 페이지 그룹
├── layout.tsx → 앱 페이지용 레이아웃 (사이드바 + 네비게이션바)
├── dashboard/
│ └── page.tsx → /dashboard
├── performance/
│ └── page.tsx → /performance
├── imagegenerator/
│ └── page.tsx → /imagegenerator
├── imagecompressor/
│ └── page.tsx → /imagecompressor
└── test1/
└── page.tsx → /test1
_/
