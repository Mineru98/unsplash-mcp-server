import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { UnsplashMcpServer } from "./server";
import { getServerConfig } from "./config";

export async function startServer(): Promise<void> {
  // 서버가 stdio 모드로 실행되는지 확인
  // NODE_ENV가 'cli'이거나 명령줄 인수에 '--stdio'가 포함된 경우 true
  const isStdioMode = process.env.NODE_ENV === "cli" || process.argv.includes("--stdio");

  // stdio 모드 여부에 따라 서버 설정 가져오기 (포트, API 키 등 포함)
  const config = getServerConfig(isStdioMode);
  
  // Unsplash API 키를 사용해 UnsplashMcpServer 인스턴스 생성
  const server = new UnsplashMcpServer(config.unsplashApiKey);

  // stdio 모드와 HTTP 모드에 따라 다른 시작 방식 선택
  if (isStdioMode) {
    // stdio 모드: 표준 입출력을 위한 transport 객체 생성
    const transport = new StdioServerTransport();
    // 서버를 stdio transport에 연결 (비동기 작업)
    await server.connect(transport);
  } else {
    console.log(`Initializing Unsplash MCP Server in HTTP mode on port ${config.port}...`);
    // 지정된 포트에서 HTTP 서버 시작 (비동기 작업)
    await server.startHttpServer(config.port);
  }
}

// 이 파일이 직접 실행된 경우에만 서버 시작
if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start server:", error);
    // 프로세스를 비정상 종료 코드(1)와 함께 종료
    process.exit(1);
  });
}