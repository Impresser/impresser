// 로그인 요청 타입
export interface LoginRequest {
  employeeNo: string;
  password: string;
}

// 로그인 응답 결과 타입
export interface LoginResult {
  accessToken: string;
  userUuid: string;
  employeeNo: string;
  userName: string;
  userRole: "ADMIN" | "USER" | string;
  profileUrl: string;
}

// API 응답 래퍼 타입
export interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
  details?: Record<string, string>;
}

// 로그인 응답 타입
export type LoginResponse = ApiResponse<LoginResult>;

// 로그아웃 응답 타입 (result가 없을 수 있음)
export type LogoutResponse = Omit<ApiResponse<null>, 'result'> & { result?: null };

// 토큰 재발급 응답 결과 타입
export interface ReissueResult {
  accessToken: string;
}

// 토큰 재발급 응답 타입
export type ReissueResponse = ApiResponse<ReissueResult>;

